import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import logger from '../../_utils/logger.js';
import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';

/**
 * GET /api/admin/national-stats
 *
 * Aggregates platform-wide metrics for national supervision:
 * - Aids by territorial scope (NATIONAL, REGIONAL, DEPARTMENTAL, COMMUNAL)
 * - Active structures count
 * - Review queue status (Hive AI moderation pipeline)
 * - Social impact (shared diagnostics)
 * - Active pro agents
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('ADMIN_API', ip);
    if (!rateLimit.allowed) {
        return res.status(getRateLimitStatus(rateLimit)).json(rateLimit.error);
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized: Admin Token Required' });
    }

    try {
        const [
            aidsByScope,
            structuresActive,
            reviewStats,
            diagnosticsCount,
            activeAgents,
            totalAides,
        ] = await Promise.all([
            // Aids grouped by territorial scope
            prisma.aide.groupBy({
                by: ['territory_scope'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
            }),

            // Active structures
            prisma.structure.count({
                where: { status: 'actif' },
            }),

            // Review queue breakdown by status (pending, approved, rejected)
            prisma.reviewQueueItem.groupBy({
                by: ['status'],
                _count: { id: true },
            }),

            // Social impact: total shared diagnostics
            prisma.sharedDiagnostic.count(),

            // Active pro users
            prisma.proUser.count({
                where: { status: 'active' },
            }),

            // Total aids
            prisma.aide.count(),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalAids: totalAides,
                    activeStructures: structuresActive,
                    sharedDiagnostics: diagnosticsCount,
                    activeAgents,
                },
                territorial: aidsByScope.map((row) => ({
                    scope: row.territory_scope || 'UNKNOWN',
                    count: row._count.id,
                })),
                hive: reviewStats.map((row) => ({
                    status: row.status,
                    count: row._count.id,
                })),
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        logger.error('[National Stats Error]:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Échec de la récupération des statistiques nationales',
        });
    }
}
