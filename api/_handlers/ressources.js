import logger from '../_utils/logger.js';
import prisma from '../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { z } from 'zod';

const searchRessourcesSchema = z.object({
    id: z.string().optional(),
    slug: z.string().optional(),
    type: z.string().optional(),
    territory_scope: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(12)
});
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const ip = getClientIp(req);
        const rateLimit = await checkRateLimit('SEARCH_RESSOURCES', ip);
        if (!rateLimit.allowed) {
            return res.status(429).json(rateLimit.error);
        }

        // Validate Input
        const validation = searchRessourcesSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;

        // 1. Single Item (ID or Slug)
        if (params.id || params.slug) {
            const ressource = await prisma.resourceAccessibility.findFirst({
                where: params.id ? { id: params.id } : { slug: params.slug }
            });

            if (!ressource || ressource.status !== 'published') {
                return res.status(404).json({ error: "Ressource non trouvée" });
            }
            return res.status(200).json(ressource);
        }

        // 2. Search / List
        const where = {
            status: 'published'
        };

        if (params.type) {
            where.type = params.type;
        }

        if (params.territory_scope) {
            where.territory_scope = params.territory_scope;
        }

        const [items, total] = await Promise.all([
            prisma.resourceAccessibility.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (params.page - 1) * params.pageSize,
                take: params.pageSize
            }),
            prisma.resourceAccessibility.count({ where })
        ]);

        return res.status(200).json({
            items,
            pagination: {
                total,
                page: params.page,
                pageSize: params.pageSize,
                totalPages: Math.ceil(total / params.pageSize)
            }
        });
    } catch (error) {
        logger.error('Ressources handler error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default handler;
