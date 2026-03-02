// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { verifyProToken } from '../../lib/pro-auth.js';

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
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const token = req.cookies?.pro_token;
    if (!token) return res.status(401).json({ error: 'Non autorisé.' });
    const user = verifyProToken(token);
    if (!user) return res.status(401).json({ error: 'Session invalide.' });

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
                status: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ? 'operational' : 'not_configured',
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
                status: process.env.SIAO_API_URL ? 'operational' : 'not_configured',
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
            env: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[HealthCheck] Error:', error.message);
        return res.status(500).json({
            status: 'DEGRADED',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
}
