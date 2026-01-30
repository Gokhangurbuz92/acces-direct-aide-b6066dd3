import { PrismaClient } from '@prisma/client';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { searchAidesSchema } from '../_utils/validators.js';
import { searchAides } from '../lib/search-query.js';
import { createHandler } from '../_utils/wrapper.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
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

        // 1. Single Item (Direct access via ID/Slug)
        if (params.id || params.slug) {
            const aide = await prisma.aide.findFirst({
                where: params.id ? { id: params.id } : { slug: params.slug },
                include: { category: true, situations: true }
            });

            if (!aide) return res.status(404).json({ error: "Aide non trouvée" });

            // Enforce visibility
            if (!isAdmin && aide.statut !== 'publie') {
                return res.status(404).json({ error: "Aide non trouvée" });
            }
            return res.status(200).json(aide);
        }

    // 1. Single Item (Direct access via ID/Slug)
    if (params.id || params.slug) {
        const aide = await prisma.aide.findFirst({
            where: params.id ? { id: params.id } : { slug: params.slug },
            include: { category: true, situations: true }
        });

        if (!aide || aide.statut !== 'publie') {
            return res.status(404).json({ error: "Aide non trouvée" });
        }
        return aide;
    }

    // 2. Search / List (Unified)
    const { items, total } = await searchAides(prisma, params);

    return {
        items,
        pagination: {
            total,
            page: params.page,
            pageSize: params.pageSize,
            totalPages: Math.ceil(total / params.pageSize)
        }
    };
}

export default createHandler(handler, { query: searchAidesSchema });
