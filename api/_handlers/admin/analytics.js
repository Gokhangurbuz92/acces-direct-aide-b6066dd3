import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';

/**
 * GET /api/admin/analytics
 *
 * Computes aggregate statistics for the admin monitoring dashboard:
 * - Search mode distribution (RAG/Lexical/Static)
 * - Top detected intents
 * - Daily activity over the last 7 days
 * - Average source count per mode
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized: Admin Token Required' });
    }

    try {
        const [modeStats, intentStats, dailyActivity, avgSources] = await Promise.all([
            // 1. Distribution des modes de recherche
            prisma.conversationLog.groupBy({
                by: ['searchMode'],
                _count: { id: true },
            }),

            // 2. Top 10 des intentions détectées
            prisma.conversationLog.groupBy({
                by: ['intent'],
                _count: { id: true },
                where: { NOT: { intent: null } },
                orderBy: { _count: { intent: 'desc' } },
                take: 10,
            }),

            // 3. Activité journalière (7 derniers jours)
            prisma.$queryRawUnsafe(`
                SELECT DATE("createdAt") AS day, COUNT(*)::int AS count
                FROM "ConversationLog"
                WHERE "createdAt" > NOW() - INTERVAL '7 days'
                GROUP BY day
                ORDER BY day ASC
            `),

            // 4. Moyenne de sources par mode
            prisma.conversationLog.groupBy({
                by: ['searchMode'],
                _avg: { sourceCount: true },
            }),
        ]);

        // Build clean response
        const modes = {};
        let total = 0;
        for (const row of modeStats) {
            modes[row.searchMode] = row._count.id;
            total += row._count.id;
        }

        const intents = intentStats.map(row => ({
            intent: row.intent,
            count: row._count.id,
        }));

        const avgByMode = {};
        for (const row of avgSources) {
            avgByMode[row.searchMode] = Math.round((row._avg.sourceCount || 0) * 10) / 10;
        }

        return res.status(200).json({
            success: true,
            data: {
                total,
                modes,
                intents,
                dailyActivity: dailyActivity.map(d => ({
                    day: d.day,
                    count: d.count,
                })),
                avgSourcesByMode: avgByMode,
                ragEfficiency: total > 0
                    ? Math.round(((modes.rag || 0) / total) * 100)
                    : 0,
            },
        });
    } catch (error) {
        console.error('[Admin Analytics Error]:', error);
        return res.status(200).json({
            success: true,
            data: {
                total: 0,
                modes: { rag: 0, lexical: 0, static: 0 },
                intents: [],
                dailyActivity: [],
                avgSourcesByMode: {},
                ragEfficiency: 0,
            },
        });
    }
}
