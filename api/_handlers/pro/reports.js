import logger from '../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../_utils/prisma.js';
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
        const totalAppointments = await prisma.proAppointment.count({
            where: {
                structureId,
                startAt: { gte: startDate },
            },
        });

        // 2. Appointments by status
        const byStatus = await prisma.proAppointment.groupBy({
            by: ['status'],
            where: {
                structureId,
                startAt: { gte: startDate },
            },
            _count: { id: true },
        });

        // 3. Daily activity (appointments per day)
        const appointments = await prisma.proAppointment.findMany({
            where: {
                structureId,
                startAt: { gte: startDate },
                status: { not: 'cancelled' },
            },
            select: { startAt: true },
            orderBy: { startAt: 'asc' },
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
        const byService = await prisma.proAppointment.groupBy({
            by: ['serviceId'],
            where: {
                structureId,
                startAt: { gte: startDate },
                status: { not: 'cancelled' },
            },
            _count: { id: true },
        });

        // Enrich service names
        const serviceIds = byService.map((s) => s.serviceId);
        const services = serviceIds.length > 0
            ? await prisma.proRdvService.findMany({
                where: { id: { in: serviceIds } },
                select: { id: true, label: true },
            })
            : [];

        const serviceMap = {};
        services.forEach((s) => { serviceMap[s.id] = s.label; });

        const themes = byService.map((s) => ({
            name: serviceMap[s.serviceId] || 'Autre',
            value: s._count.id,
        }));

        // 5. Conversations count
        const conversationsCount = await prisma.rdvConversation.count({
            where: {
                structureId,
                createdAt: { gte: startDate },
            },
        });

        // 6. Shared diagnostics count
        const diagnosticsCount = await prisma.sharedDiagnostic.count({
            where: {
                createdAt: { gte: startDate },
            },
        });

        // 7. Active team size
        const teamSize = await prisma.proUser.count({
            where: { structureId, status: 'active' },
        });

        // 8. Cancelled count
        const cancelledCount = byStatus.find((s) => s.status === 'cancelled')?._count?.id || 0;
        const completedCount = totalAppointments - cancelledCount;

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
