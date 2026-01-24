import { PrismaClient } from '@prisma/client';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { searchStructuresSchema } from '../_utils/validators.js';
import { searchStructures } from '../lib/search-query.js';
import { createHandler } from '../_utils/wrapper.js';

const prisma = new PrismaClient();

async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('SEARCH_STRUCTURES', ip);
    if (!rateLimit.allowed) {
        return res.status(429).json(rateLimit.error);
    }

    const params = req.validated.query;

    // 1. Single Item (ID or Slug)
    if (params.id || params.slug) {
        const structure = await prisma.structure.findFirst({
            where: params.id ? { id: params.id } : { slug: params.slug },
            include: { proServices: true }
        });

        if (!structure) {
            return res.status(404).json({ error: "Structure non trouvée" });
        }
        return structure;
    }

    // 2. Search / List
    const { items, total } = await searchStructures(prisma, params);

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

export default createHandler(handler, { query: searchStructuresSchema });
