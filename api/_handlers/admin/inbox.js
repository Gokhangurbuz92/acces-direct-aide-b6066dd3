import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import logger from '../../_utils/logger.js';
import prisma from '../../_utils/prisma.js';
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
        const [items, total] = await Promise.all([
            prisma.actualite.findMany({
                where: { statut: status },
                orderBy: { fetched_at: 'desc' },
                take: Number(limit),
                skip: Number(skip)
            }),
            prisma.actualite.count({ where: { statut: status } })
        ]);

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
