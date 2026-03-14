import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { Actualite } from '../../../src/db/schema.js';
import { eq, count } from 'drizzle-orm';
import { verifyAdmin } from '../../_utils/auth.js';
/**
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

    // Security P0 Fix
    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized: Admin Token Required' });
    }

    const { page = 1, status = 'brouillon', limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const [items, totalRes] = await Promise.all([
            db.query.Actualite.findMany({
                where: eq(Actualite.statut, status),
                orderBy: (a, { desc }) => [desc(a.fetched_at)],
                limit: Number(limit),
                offset: Number(skip)
            }),
            db.select({ count: count() }).from(Actualite).where(eq(Actualite.statut, status))
        ]);
        const total = totalRes[0].count;

        return res.status(200).json({
            data: items,
            meta: {
                total,
                page: Number(page),
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        logger.error('Admin Inbox Error:', error);
        return res.status(500).json({ error: 'Database Error' });
    }
}
