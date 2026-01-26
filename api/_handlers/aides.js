import { PrismaClient } from '@prisma/client';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { searchAidesSchema } from '../_utils/validators.js';
import { searchAides } from '../lib/search-query.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const ip = getClientIp(req);
        const rateLimit = await checkRateLimit('SEARCH_AIDES', ip);
        if (!rateLimit.allowed) {
            return res.status(429).json(rateLimit.error);
        }

        // Validate Input
        const validation = searchAidesSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;

        // 1. Single Item (Direct access via slugOrId)
        // Support both /api/aides?slug=X and /api/aides?id=X for backward compat
        const slugOrId = params.slug || params.id;

        if (slugOrId) {
            const aide = await prisma.aide.findFirst({
                where: {
                    OR: [
                        { slug: slugOrId },
                        { id: slugOrId }
                    ]
                },
                include: { category: true, situations: true }
            });

            if (!aide || aide.statut !== 'publie') {
                return res.status(404).json({ error: "Aide non trouvée" });
            }
            return res.status(200).json(aide);
        }

        // 2. Search / List (Unified)
        const { items, total } = await searchAides(prisma, params);

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
        console.error("Aides API Error", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
