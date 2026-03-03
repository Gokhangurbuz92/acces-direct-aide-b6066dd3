import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import logger from '../../_utils/logger.js';
import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';

/**
 * GET /api/admin/conversations
 *
 * Returns conversation logs for the admin monitoring dashboard.
 * Supports filtering by searchMode (?mode=rag|lexical|static), pagination (?limit=50),
 * and CSV export (?format=csv).
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
        const url = new URL(req.url, `http://${req.headers.host}`);
        const mode = url.searchParams.get('mode');
        const format = url.searchParams.get('format');
        const ratingParam = url.searchParams.get('rating');
        const limitParam = url.searchParams.get('limit');
        const limit = format === 'csv' ? 10000 : Math.min(parseInt(limitParam) || 50, 100);

        const where = {};
        if (mode && mode !== 'all') {
            where.searchMode = mode;
        }
        if (ratingParam) {
            where.rating = parseInt(ratingParam);
        }

        // --- CSV Export ---
        if (format === 'csv') {
            const logs = await prisma.conversationLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            });

            const BOM = '\uFEFF'; // UTF-8 BOM for Excel
            const header = 'Date,Message,Intent,Mode,Sources,Rating,Comment\n';
            const rows = logs.map(log => {
                const date = new Date(log.createdAt).toISOString();
                const msg = `"${(log.message || '').replace(/"/g, '""')}"`;
                const intent = log.intent || '';
                const comment = `"${(log.userComment || '').replace(/"/g, '""')}"`;
                return `${date},${msg},${intent},${log.searchMode},${log.sourceCount},${log.rating || ''},${comment}`;
            }).join('\n');

            const csv = BOM + header + rows;
            const filename = `ada-logs-${new Date().toISOString().slice(0, 10)}.csv`;

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.status(200).send(csv);
        }

        // --- JSON Response ---
        const [logs, modeGroups, feedbackGroups] = await Promise.all([
            prisma.conversationLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma.conversationLog.groupBy({
                by: ['searchMode'],
                _count: { id: true },
            }),
            prisma.conversationLog.groupBy({
                by: ['rating'],
                _count: { id: true },
                where: { rating: { not: null } },
            }),
        ]);

        const modeStats = {
            total: 0,
            rag: 0,
            lexical: 0,
            static: 0,
        };
        for (const row of modeGroups) {
            modeStats[row.searchMode] = row._count.id;
            modeStats.total += row._count.id;
        }

        // Feedback stats
        let positive = 0, negative = 0;
        for (const row of feedbackGroups) {
            if (row.rating === 1) positive = row._count.id;
            if (row.rating === -1) negative = row._count.id;
        }

        return res.status(200).json({
            success: true,
            data: { logs, stats: { ...modeStats, positive, negative } },
        });
    } catch (error) {
        logger.error('[Admin Conversations Error]:', error);
        return res.status(200).json({
            success: true,
            data: { logs: [], stats: { total: 0, rag: 0, lexical: 0, static: 0 } },
        });
    }
}
