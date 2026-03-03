import logger from '../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { env } from '../../_utils/env.js';
import { requireProAuth } from '../../_utils/auth.js';
/**
 * Health Check API (Pro-only)
 *
 * GET /api/pro/health-check
 *
 * Returns real system metrics:
 *   - DB latency (ping)
 *   - Last ingestion timestamp
 *   - Pending moderation count
 *   - Environment info
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // 1. Database ping latency
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatencyMs = Date.now() - dbStart;

        // 2. Last ingestion
        const lastIngest = await prisma.importLog.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true, source: true, status: true },
        });

        // 3. Pending moderation items
        const pendingModeration = await prisma.reviewQueueItem.count({
            where: { status: 'OPEN' },
        });

        // 4. Total content counts
        const [aidesCount, demarchesCount, structuresCount] = await Promise.all([
            prisma.aide.count(),
            prisma.demarche.count(),
            prisma.structure.count(),
        ]);

        // 5. Appointments this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const appointmentsThisMonth = await prisma.proAppointment.count({
            where: { startAt: { gte: startOfMonth } },
        });

        // 6. Service status inference
        const siaEnabled = env.siao.enabled;
        const services = [
            {
                id: 'db',
                label: 'Base de Données',
                sub: 'PostgreSQL Neon',
                status: dbLatencyMs < 500 ? 'operational' : dbLatencyMs < 2000 ? 'degraded' : 'down',
                latencyMs: dbLatencyMs,
            },
            {
                id: 'ai',
                label: 'Moteur IA',
                sub: 'Gemini 2.0 Flash',
                status: env.ai.geminiKey ? 'operational' : 'not_configured',
            },
            {
                id: 'storage',
                label: 'Stockage',
                sub: 'Cloudflare R2',
                status: process.env.R2_ACCESS_KEY_ID ? 'operational' : 'not_configured',
            },
            {
                id: 'siao',
                label: 'Passerelle SIAO',
                sub: 'Interop National',
                status: siaEnabled && env.siao.apiUrl ? 'operational' : 'not_configured',
            },
        ];

        return res.status(200).json({
            status: 'HEALTHY',
            services,
            metrics: {
                dbLatencyMs,
                lastIngestAt: lastIngest?.createdAt || null,
                lastIngestSource: lastIngest?.source || null,
                lastIngestStatus: lastIngest?.status || null,
                pendingModeration,
                aidesCount,
                demarchesCount,
                structuresCount,
                appointmentsThisMonth,
            },
            env: env.runtime.nodeEnv,
            nodeVersion: process.version,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ err: error }, '[HealthCheck] Error');
        return res.status(500).json({
            status: 'DEGRADED',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
}

export default requireProAuth(handler);
