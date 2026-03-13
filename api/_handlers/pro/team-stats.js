import logger from '../../_utils/logger.js';
// @ts-nocheck
import { db } from '../../../src/db/index.js';
import { ProUser, ProAppointment, RdvConversation } from '../../../src/db/schema.js';
import { eq, and, gte, lt, not, isNotNull, count } from 'drizzle-orm';
import { AUTH_ROLE, requireProRole, requireProStructureContext } from '../../_utils/auth.js';

/**
 * Team Stats API Handler
 *
 * Provides the Structure Responsable with aggregated team performance
 * data without exposing private appointment/message details.
 *
 * GET /api/pro/team/stats
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId } = proCtx;

    try {
        // 1. Today boundary
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 2. Team members with appointment counts
        const members = await db.query.ProUser.findMany({
            where: eq(ProUser.structureId, structureId),
            columns: {
                id: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        // 3. Today's appointments for the whole structure
        const appointmentsTodayRes = await db.select({ count: count() }).from(ProAppointment).where(
            and(
                eq(ProAppointment.structureId, structureId),
                gte(ProAppointment.startAt, today),
                lt(ProAppointment.startAt, tomorrow),
                not(eq(ProAppointment.status, 'cancelled'))
            )
        );
        const appointmentsToday = appointmentsTodayRes[0].count;

        // 4. Total upcoming appointments
        const appointmentsUpcomingRes = await db.select({ count: count() }).from(ProAppointment).where(
            and(
                eq(ProAppointment.structureId, structureId),
                gte(ProAppointment.startAt, today),
                not(eq(ProAppointment.status, 'cancelled'))
            )
        );
        const appointmentsUpcoming = appointmentsUpcomingRes[0].count;

        // 5. Per-member appointment counts (upcoming)
        const memberStats = await db.select({
            createdByProUserId: ProAppointment.createdByProUserId,
            _count: { id: count() }
        }).from(ProAppointment).where(
            and(
                eq(ProAppointment.structureId, structureId),
                gte(ProAppointment.startAt, today),
                not(eq(ProAppointment.status, 'cancelled')),
                isNotNull(ProAppointment.createdByProUserId)
            )
        ).groupBy(ProAppointment.createdByProUserId);

        const memberCountMap = {};
        for (const stat of memberStats) {
            if (stat.createdByProUserId) {
                memberCountMap[stat.createdByProUserId] = stat._count.id;
            }
        }

        // 6. Active conversations count
        const conversationsActiveRes = await db.select({ count: count() }).from(RdvConversation).where(
            and(
                eq(RdvConversation.structureId, structureId),
                gte(RdvConversation.lastMessageAt, new Date(Date.now() - 7 * 86400000))
            )
        );
        const conversationsActive = conversationsActiveRes[0].count;

        // 7. Build response
        const enrichedMembers = members.map((m) => ({
            id: m.id,
            email: m.email,
            role: m.role,
            status: m.status,
            createdAt: m.createdAt,
            appointmentsCount: memberCountMap[m.id] || 0,
        }));

        return res.status(200).json({
            ok: true,
            global: {
                appointmentsToday,
                appointmentsUpcoming,
                conversationsActive,
                teamSize: members.filter((m) => m.status === 'active').length,
            },
            members: enrichedMembers,
        });
    } catch (error) {
        logger.error('[Team Stats] Erreur:', error.message);
        return res.status(500).json({ error: 'Impossible de générer les statistiques.' });
    }
}

export default requireProRole(handler, [AUTH_ROLE.STRUCTURE_ADMIN, AUTH_ROLE.SUPERADMIN]);
