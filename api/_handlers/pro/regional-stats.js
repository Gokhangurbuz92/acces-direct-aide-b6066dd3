// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { requireProAuth } from '../../_utils/auth.js';
import logger from '../../_utils/logger.js';

/**
 * Regional Stats API (Pro — authenticated)
 *
 * GET /api/pro/regional-stats
 *
 * Aggregates anonymized data across all structures.
 * Used by regional decision-makers for territorial dashboarding.
 * No individual dossier data is ever exposed.
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // 1. Count structures
        const structuresCount = await prisma.structure.count();

        // 2. Count pro users (agents)
        const agentsCount = await prisma.proUser.count();

        // 3. Count appointments this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const appointmentsThisMonth = await prisma.proAppointment.count({
            where: { startAt: { gte: startOfMonth } },
        });

        // 4. Count shared diagnostics (impact)
        const diagnosticsCount = await prisma.sharedDiagnostic.count();

        // 5. Per-structure breakdown (anonymized)
        const structures = await prisma.structure.findMany({
            select: {
                id: true,
                name: true,
                city: true,
                _count: {
                    select: {
                        proUsers: true,
                        appointments: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
            take: 20,
        });

        const cities = structures.map((s) => ({
            id: s.id,
            name: s.name || s.city || 'Structure',
            city: s.city || '',
            agents: s._count.proUsers,
            rdv: s._count.appointments,
            status: s._count.proUsers > 0 ? 'optimal' : 'inactive',
        }));

        // 6. Weekly trend data (last 7 days)
        const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const trend = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now);
            dayStart.setDate(dayStart.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            const [rdvCount, diagCount] = await Promise.all([
                prisma.proAppointment.count({
                    where: { startAt: { gte: dayStart, lte: dayEnd } },
                }),
                prisma.sharedDiagnostic.count({
                    where: { createdAt: { gte: dayStart, lte: dayEnd } },
                }),
            ]);

            trend.push({
                day: dayLabels[dayStart.getDay()],
                rdv: rdvCount,
                diag: diagCount,
            });
        }

        return res.status(200).json({
            ok: true,
            stats: {
                totalCitizensHelped: diagnosticsCount,
                activeStructures: structuresCount,
                totalAgents: agentsCount,
                appointmentsThisMonth,
                cities,
                trend,
            },
        });
    } catch (error) {
        logger.error({ err: error }, '[RegionalStats] Erreur');
        return res.status(500).json({ error: 'Erreur statistiques régionales.' });
    }
}

export default requireProAuth(handler);
