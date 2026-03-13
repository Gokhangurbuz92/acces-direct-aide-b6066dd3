import logger from '../../_utils/logger.js';
// @ts-nocheck
import { db } from '../../../src/db/index.js';
import { Structure, ProUser, ProAppointment, SharedDiagnostic } from '../../../src/db/schema.js';
import { eq, and, gte, lte, asc, sql } from 'drizzle-orm';
import { requireProAuth } from '../../_utils/auth.js';
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
        const [sCount] = await db.select({ count: sql`count(*)` }).from(Structure);
        const structuresCount = Number(sCount.count);

        // 2. Count pro users (agents)
        const [aCount] = await db.select({ count: sql`count(*)` }).from(ProUser);
        const agentsCount = Number(aCount.count);

        // 3. Count appointments this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [appCount] = await db.select({ count: sql`count(*)` }).from(ProAppointment).where(gte(ProAppointment.startAt, startOfMonth));
        const appointmentsThisMonth = Number(appCount.count);

        // 4. Count shared diagnostics (impact)
        const [dCount] = await db.select({ count: sql`count(*)` }).from(SharedDiagnostic);
        const diagnosticsCount = Number(dCount.count);

        // 5. Per-structure breakdown (anonymized)
        // With drizzle, we use a single query with joins or execute a raw SQL query.
        const structuresRows = await db.execute(sql`
            SELECT s.id, s.nom as name, s.ville as city,
                   (SELECT COUNT(*) FROM "ProUser" pu WHERE pu."structureId" = s.id) as pro_count,
                   (SELECT COUNT(*) FROM "ProAppointment" pa WHERE pa."structureId" = s.id) as rdv_count
            FROM "Structure" s
            ORDER BY s.nom ASC
            LIMIT 20
        `);
        const structuresData = structuresRows.rows || structuresRows;

        const cities = structuresData.map((s) => ({
            id: s.id,
            name: s.name || s.city || 'Structure',
            city: s.city || '',
            agents: Number(s.pro_count) || 0,
            rdv: Number(s.rdv_count) || 0,
            status: Number(s.pro_count) > 0 ? 'optimal' : 'inactive',
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

            const [rdvCountRes, diagCountRes] = await Promise.all([
                db.select({ count: sql`count(*)` }).from(ProAppointment).where(and(gte(ProAppointment.startAt, dayStart), lte(ProAppointment.startAt, dayEnd))),
                db.select({ count: sql`count(*)` }).from(SharedDiagnostic).where(and(gte(SharedDiagnostic.createdAt, dayStart), lte(SharedDiagnostic.createdAt, dayEnd)))
            ]);

            trend.push({
                day: dayLabels[dayStart.getDay()],
                rdv: Number(rdvCountRes[0].count),
                diag: Number(diagCountRes[0].count),
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
