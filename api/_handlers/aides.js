import { PrismaClient } from '@prisma/client';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { searchAidesSchema } from '../_utils/validators.js';
import { searchAides } from '../lib/search-query.js';
import { createHandler } from '../_utils/wrapper.js';

const prisma = new PrismaClient();

async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('SEARCH_AIDES', ip);
    if (!rateLimit.allowed) {
        return res.status(429).json(rateLimit.error);
    }

    const params = req.validated.query;

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
