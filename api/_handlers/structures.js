import { PrismaClient } from '@prisma/client';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { searchStructuresSchema } from '../_utils/validators.js';
import { searchStructures } from '../lib/search-query.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const ip = getClientIp(req);
        const rateLimit = await checkRateLimit('SEARCH_STRUCTURES', ip);
        if (!rateLimit.allowed) {
            return res.status(429).json(rateLimit.error);
        }

        const validation = searchStructuresSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;

        // 1. Single Item (slugOrId)
        const slugOrId = params.slug || params.id;

        if (slugOrId) {
            const structure = await prisma.structure.findFirst({
                where: {
                    OR: [
                        { slug: slugOrId },
                        { id: slugOrId }
                    ]
                },
                include: { proServices: true }
            });

            if (!structure) {
                return res.status(404).json({ error: "Structure non trouvée" });
            }
            return res.status(200).json(structure);
        }

        // 2. Search / List
        const { items, total } = await searchStructures(prisma, params);

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
        console.error("Structures API Error", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
