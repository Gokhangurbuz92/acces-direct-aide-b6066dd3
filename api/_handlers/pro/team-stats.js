// @ts-nocheck
import logger from '../../_utils/logger.js';
import prisma from '../../_utils/prisma.js';
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
        const members = await prisma.proUser.findMany({
            where: { structureId },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        // 3. Today's appointments for the whole structure
        const appointmentsToday = await prisma.proAppointment.count({
            where: {
                structureId,
                startAt: { gte: today, lt: tomorrow },
                status: { not: 'cancelled' },
            },
        });

        // 4. Total upcoming appointments
        const appointmentsUpcoming = await prisma.proAppointment.count({
            where: {
                structureId,
                startAt: { gte: today },
                status: { not: 'cancelled' },
            },
        });

        // 5. Per-member appointment counts (upcoming)
        const memberStats = await prisma.proAppointment.groupBy({
            by: ['createdByProUserId'],
            where: {
                structureId,
                startAt: { gte: today },
                status: { not: 'cancelled' },
                createdByProUserId: { not: null },
            },
            _count: { id: true },
        });

        const memberCountMap = {};
        for (const stat of memberStats) {
            if (stat.createdByProUserId) {
                memberCountMap[stat.createdByProUserId] = stat._count.id;
            }
        }

        // 6. Active conversations count
        const conversationsActive = await prisma.rdvConversation.count({
            where: {
                structureId,
                lastMessageAt: { gte: new Date(Date.now() - 7 * 86400000) },
            },
        });

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
