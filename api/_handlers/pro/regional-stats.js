// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { verifyProToken } from '../../lib/pro-auth.js';

/**
 * Regional Stats API (Pro — Super-Admin / Observer)
 *
 * GET /api/pro/regional-stats
 *
 * Aggregates anonymized data across all structures.
 * Used by regional decision-makers for territorial dashboarding.
 * No individual dossier data is ever exposed.
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Auth
    const token = req.cookies?.pro_token;
    if (!token) return res.status(401).json({ error: 'Non autorisé.' });
    const user = verifyProToken(token);
    if (!user) return res.status(401).json({ error: 'Session invalide.' });

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

        return res.status(200).json({
            ok: true,
            stats: {
                totalCitizensHelped: diagnosticsCount,
                activeStructures: structuresCount,
                totalAgents: agentsCount,
                appointmentsThisMonth,
                cities,
            },
        });
    } catch (error) {
        console.error('[RegionalStats] Erreur:', error.message);
        return res.status(500).json({ error: 'Erreur statistiques régionales.' });
    }
}
