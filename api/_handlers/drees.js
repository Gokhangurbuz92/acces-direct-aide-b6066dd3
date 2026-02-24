import prisma from '../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { logger } from '../lib/logger.js';

/**
 * GET /api/drees — List DREES social program data (APA, PCH, ASH, AAH, ASPA)
 * Supports filters: ?q=, ?category=, ?page=, ?limit=
 */
export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('DREES_API', ip);
    if (!rateLimit.allowed) {
        return res.status(429).json(rateLimit.error);
    }

    try {
        const { q, category, page = '1', limit = '20' } = req.query || {};
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * pageSize;

        const where = {
            statut: 'publie',
            providerName: 'drees',
        };

        if (q) {
            where.OR = [
                { titre: { contains: q, mode: 'insensitive' } },
                { cest_quoi: { contains: q, mode: 'insensitive' } },
            ];
        }

        if (category) {
            where.categorie = category.toLowerCase();
        }

        const [items, total] = await Promise.all([
            prisma.aide.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { titre: 'asc' },
                select: {
                    id: true,
                    slug: true,
                    titre: true,
                    cest_quoi: true,
                    categorie: true,
                    theme: true,
                    territory_scope: true,
                    source_url: true,
                    apply_url: true,
                    providerName: true,
                    published_at: true,
                    updatedAt: true,
                },
            }),
            prisma.aide.count({ where }),
        ]);

        return res.status(200).json({
            items,
            pagination: {
                total,
                page: pageNum,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
                hasNext: pageNum * pageSize < total,
            },
        });
    } catch (error) {
        logger.error('DREES_API_ERROR', { error });
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
