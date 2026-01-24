import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createHandler } from '../_utils/wrapper.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { createError, errorCodes } from '../_utils/errors.js';

const prisma = new PrismaClient();

const querySchema = z.object({
    id: z.string().optional(),
    slug: z.string().optional(),
    q: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    type: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
});

const handler = async (req, res) => {
    // 1. Method Check
    if (req.method !== 'GET') {
        throw createError(405, errorCodes.BAD_REQUEST, 'Method not allowed');
    }

    // 2. Rate Limit
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('SEARCH_STRUCTURES', ip);
    if (!rateLimit.allowed) {
        throw createError(429, errorCodes.RATE_LIMIT, rateLimit.error.error);
    }

    const { id, slug, q, city, zip, type, page, pageSize } = req.validated.query;
    const PAGE_SIZE = pageSize;
    const OFFSET = (page - 1) * PAGE_SIZE;

    // 3. Single Item
    if (id || slug) {
        const structure = await prisma.structure.findFirst({
            where: id ? { id: String(id) } : { slug: String(slug) },
            include: { proServices: true }
        });

        if (!structure || structure.statut !== 'actif') {
            throw createError(404, errorCodes.NOT_FOUND, "Structure non trouvée");
        }
        return structure;
    }

    // 4. Base filter
    const where = { statut: 'actif' };

    if (city) where.ville = { contains: city, mode: 'insensitive' };
    if (zip) where.code_postal = zip;
    if (type && type !== '_all') where.type_structure = type;

    let items;
    let total;

    if (q) {
        // Weighted FTS using Optimized Column
        items = await prisma.$queryRaw`
        SELECT *, 
          ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) AS rank
        FROM "Structure"
        WHERE statut = 'actif'
          AND "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
        ORDER BY rank DESC, nom ASC
        LIMIT ${PAGE_SIZE} OFFSET ${OFFSET}
      `;

        const countRes = await prisma.$queryRaw`
        SELECT count(*) FROM "Structure"
        WHERE statut = 'actif'
          AND "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
      `;
        total = Number(countRes[0].count);
    } else {
        const results = await Promise.all([
            prisma.structure.findMany({
                where,
                take: PAGE_SIZE,
                skip: OFFSET,
                orderBy: [
                    { nom: 'asc' },
                    { id: 'asc' }
                ]
            }),
            prisma.structure.count({ where })
        ]);
        items = results[0];
        total = results[1];
    }

    return {
        items,
        pagination: {
            total,
            page,
            pageSize: PAGE_SIZE,
            totalPages: Math.ceil(total / PAGE_SIZE)
        }
    };
};

export default createHandler(handler, { query: querySchema });
