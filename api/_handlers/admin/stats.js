import logger from "../../_utils/logger.js";
import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';
import { getAllFlags } from '@ada/shared/features';
import { cache } from '@ada/shared/cache';

/**
 * GET /api/admin/stats
 *
 * Returns real-time system stats for the admin dashboard:
 * - Prisma model counts (Aide, AdminUser, CitizenUser, CronRun, Demarche)
 * - Feature flag states
 * - Cache backend info
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
        const [
            aideCount,
            demarcheCount,
            adminCount,
            citizenCount,
            cronRunCount,
            recentCrons,
            recentImports,
            ragHealth,
        ] = await Promise.all([
            prisma.aide.count(),
            prisma.demarche.count(),
            prisma.adminUser.count(),
            prisma.citizenUser.count(),
            prisma.cronRun.count(),
            prisma.cronRun.findMany({
                orderBy: { startedAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    jobName: true,
                    status: true,
                    startedAt: true,
                    durationMs: true,
                    itemsProcessed: true,
                },
            }),
            prisma.importLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    sourceName: true,
                    status: true,
                    createdAt: true,
                    itemsCreated: true,
                    itemsUpdated: true,
                },
            }),
            // RAG Health: count aides with/without embeddings via raw SQL
            // (Prisma can't filter on Unsupported types)
            prisma.$queryRawUnsafe(`
                SELECT
                    COUNT(*) AS total,
                    COUNT(embedding) AS indexed,
                    COUNT(*) - COUNT(embedding) AS missing
                FROM "Aide"
            `).then(rows => ({
                total: Number(rows[0]?.total ?? 0),
                indexed: Number(rows[0]?.indexed ?? 0),
                missing: Number(rows[0]?.missing ?? 0),
            })),
        ]);

        const cacheInfo = cache.getInfo();
        const featureFlags = getAllFlags();

        return res.status(200).json({
            success: true,
            data: {
                counts: {
                    aides: aideCount,
                    demarches: demarcheCount,
                    admins: adminCount,
                    citizens: citizenCount,
                    cronRuns: cronRunCount,
                },
                features: featureFlags,
                rag: ragHealth,
                infrastructure: {
                    cache: cacheInfo,
                    nodeEnv: process.env.NODE_ENV || 'development',
                },
                activity: {
                    recentCrons,
                    recentImports,
                },
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        logger.error('[Admin Stats Error]:', error);
        return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des stats' });
    }
}
