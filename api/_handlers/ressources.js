import logger from '../_utils/logger.js';
import { db } from '../../src/db/index.js';
import { ResourceAccessibility } from '../../src/db/schema.js';
import { eq, and, desc, count } from 'drizzle-orm';
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
            const ressource = await db.query.ResourceAccessibility.findFirst({
                where: params.id ? eq(ResourceAccessibility.id, params.id) : eq(ResourceAccessibility.slug, params.slug)
            });

            if (!ressource || ressource.status !== 'published') {
                return res.status(404).json({ error: "Ressource non trouvée" });
            }
            return res.status(200).json(ressource);
        }

        // 2. Search / List
        const conditionArr = [eq(ResourceAccessibility.status, 'published')];

        if (params.type) {
            conditionArr.push(eq(ResourceAccessibility.type, params.type));
        }

        if (params.territory_scope) {
            conditionArr.push(eq(ResourceAccessibility.territory_scope, params.territory_scope));
        }
        
        const conditions = conditionArr.length === 1 ? conditionArr[0] : and(...conditionArr);

        const [items, totalRes] = await Promise.all([
            db.query.ResourceAccessibility.findMany({
                where: conditions,
                orderBy: [desc(ResourceAccessibility.createdAt)],
                offset: (params.page - 1) * params.pageSize,
                limit: params.pageSize
            }),
            db.select({ count: count() }).from(ResourceAccessibility).where(conditions)
        ]);
        const total = Number(totalRes[0].count);

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
