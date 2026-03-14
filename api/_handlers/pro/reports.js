import logger from '../../_utils/logger.js';
// @ts-nocheck
import { db } from '../../../src/db/index.js';
import { ProAppointment, ProRdvService, RdvConversation, SharedDiagnostic, ProUser, RdvNotificationLog, ConversationLog } from '../../../src/db/schema.js';
import { eq, and, gte, ne, not, inArray, count, desc, asc, sql } from 'drizzle-orm';
import { AUTH_ROLE, requireProRole, requireProStructureContext } from '../../_utils/auth.js';

/**
 * Impact Reports API
 *
 * GET /api/pro/reports?period=month|quarter|year
 *
 * Aggregates anonymized metrics from ProAppointment, SharedDiagnostic,
 * and AuditLog for the structure. No private data is exposed.
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId } = proCtx;

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const period = url.searchParams.get('period') || 'month';

    try {
        const now = new Date();
        const startDate = new Date();

        switch (period) {
            case 'quarter':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default: // month
                startDate.setMonth(now.getMonth() - 1);
                break;
        }

        // 1. Total appointments in period
        const totalAppointmentsRes = await db.select({ count: count() }).from(ProAppointment).where(
            and(
                eq(ProAppointment.structureId, structureId),
                gte(ProAppointment.startAt, startDate)
            )
        );
        const totalAppointments = totalAppointmentsRes[0].count;

        // 2. Appointments by status
        const byStatus = await db.select({
            status: ProAppointment.status,
            _count: { id: count() }
        }).from(ProAppointment).where(
            and(
                eq(ProAppointment.structureId, structureId),
                gte(ProAppointment.startAt, startDate)
            )
        ).groupBy(ProAppointment.status);

        // 3. Daily activity (appointments per day)
        const appointments = await db.query.ProAppointment.findMany({
            where: and(
                eq(ProAppointment.structureId, structureId),
                gte(ProAppointment.startAt, startDate),
                not(eq(ProAppointment.status, 'cancelled')) // Handle status not cancelled properly
            ),
            columns: { startAt: true },
            orderBy: (pa, { asc }) => [asc(pa.startAt)],
        });

        // Group by day
        const dailyMap = {};
        for (const apt of appointments) {
            const day = apt.startAt.toISOString().split('T')[0];
            dailyMap[day] = (dailyMap[day] || 0) + 1;
        }
        const dailyActivity = Object.entries(dailyMap).map(([date, count]) => ({
            date,
            count,
        }));

        // 4. By service (themes)
        const byService = await db.select({
            serviceId: ProAppointment.serviceId,
            _count: { id: count() }
        }).from(ProAppointment).where(
            and(
                eq(ProAppointment.structureId, structureId),
                gte(ProAppointment.startAt, startDate),
                not(eq(ProAppointment.status, 'cancelled'))
            )
        ).groupBy(ProAppointment.serviceId);

        // Enrich service names
        const serviceIds = byService.map((s) => s.serviceId).filter(Boolean); // Filter nulls just in case
        const services = serviceIds.length > 0
            ? await db.query.ProRdvService.findMany({
                where: inArray(ProRdvService.id, serviceIds),
                columns: { id: true, label: true },
            })
            : [];

        const serviceMap = {};
        services.forEach((s) => { serviceMap[s.id] = s.label; });

        const themes = byService.map((s) => ({
            name: serviceMap[s.serviceId] || 'Autre',
            value: s._count.id,
        }));

        // 5. Conversations count
        const conversationsCountRes = await db.select({ count: count() }).from(RdvConversation).where(
            and(
                eq(RdvConversation.structureId, structureId),
                gte(RdvConversation.createdAt, startDate)
            )
        );
        const conversationsCount = conversationsCountRes[0].count;

        // 6. Shared diagnostics count
        const diagnosticsCountRes = await db.select({ count: count() }).from(SharedDiagnostic).where(
            gte(SharedDiagnostic.createdAt, startDate)
        );
        const diagnosticsCount = diagnosticsCountRes[0].count;

        // 7. Active team size
        const teamSizeRes = await db.select({ count: count() }).from(ProUser).where(
            and(eq(ProUser.structureId, structureId), eq(ProUser.status, 'active'))
        );
        const teamSize = teamSizeRes[0].count;

        // 8. Cancelled count
        const cancelledCount = byStatus.find((s) => s.status === 'cancelled')?._count?.id || 0;
        const completedCount = totalAppointments - cancelledCount;

        // 9. SMS Notification Impact (Phase 3 — No-show prevention)
        // Need to inner join RdvConversation on rdv_notification_logs.conversation_id to check structureId
        const smsNotificationsRes = await db.select({ count: count() }).from(RdvNotificationLog)
            .innerJoin(RdvConversation, eq(RdvNotificationLog.conversationId, RdvConversation.id))
            .where(
                and(
                    eq(RdvConversation.structureId, structureId),
                    gte(RdvNotificationLog.sentAt, startDate)
                )
            );
        const smsNotifications = smsNotificationsRes[0].count;
        
        // DITP estimation: SMS reminders reduce no-shows by ~35%
        const noShowCount = byStatus.find((s) => s.status === 'noshow' || s.status === 'NOSHOW')?._count?.id || 0;
        const avoidedNoShows = Math.round(smsNotifications * 0.35);

        // 10. Boussole Sociale — Orientation sessions
        const compassSessionsRes = await db.select({ count: count() }).from(ConversationLog).where(
            and(
                eq(ConversationLog.searchMode, 'compass'),
                gte(ConversationLog.createdAt, startDate)
            )
        );
        const compassSessions = compassSessionsRes[0].count;

        return res.status(200).json({
            ok: true,
            period,
            startDate: startDate.toISOString(),
            kpis: {
                totalAppointments,
                completedAppointments: completedCount,
                cancelledAppointments: cancelledCount,
                completionRate: totalAppointments > 0
                    ? Math.round((completedCount / totalAppointments) * 100)
                    : 0,
                conversations: conversationsCount,
                diagnosticsShared: diagnosticsCount,
                teamSize,
                // Phase 3 — SMS Impact
                smsNotifications,
                noShowCount,
                avoidedNoShows,
                smsImpactRate: totalAppointments > 0
                    ? Math.round((smsNotifications / totalAppointments) * 100)
                    : 0,
                // Phase 3 — Boussole Sociale
                compassSessions,
            },
            dailyActivity,
            themes,
            byStatus: byStatus.map((s) => ({
                status: s.status,
                count: s._count.id,
            })),
        });
    } catch (error) {
        logger.error('[Reports] Erreur:', error.message);
        return res.status(500).json({ error: 'Impossible de générer le rapport.' });
    }
}

export default requireProRole(handler, [AUTH_ROLE.STRUCTURE_ADMIN, AUTH_ROLE.SUPERADMIN]);
