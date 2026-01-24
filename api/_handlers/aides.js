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
    category: z.string().optional(),
    situation: z.string().optional(),
    geo: z.string().optional(),
    audience: z.string().optional(),
    providerType: z.string().optional(),
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
    const rateLimit = await checkRateLimit('SEARCH_AIDES', ip);
    if (!rateLimit.allowed) {
        throw createError(429, errorCodes.RATE_LIMIT, rateLimit.error.error);
    }

    const { id, slug, q, category, situation, geo, audience, providerType, page, pageSize } = req.validated.query;
    const PAGE_SIZE = pageSize;
    const OFFSET = (page - 1) * PAGE_SIZE;

    // 3. Single Item
    if (id || slug) {
        const aide = await prisma.aide.findFirst({
            where: id ? { id: String(id) } : { slug: String(slug) },
            include: { category: true, situations: true }
        });

        if (!aide || aide.statut !== 'publie') {
            throw createError(404, errorCodes.NOT_FOUND, "Aide non trouvée");
        }
        return aide;
    }

    // 4. Build Where Clause
    const where = { statut: 'publie' };

    if (category) {
        where.OR = [
            { category: { slug: category } },
            { categoryId: category }
        ];
    }

    if (situation) {
        where.situations = { some: { slug: situation } };
    }

    if (geo) {
        where.territoires = { has: geo };
    }

    if (audience) {
        where.audiences = { has: audience };
    }

    if (providerType) {
        where.providerType = providerType;
    }

    // 5. Execution
    let items;
    let total;

    if (q) {
        // Weighted FTS using Optimized Column
        items = await prisma.$queryRaw`
        SELECT *, 
          ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) AS rank
        FROM "Aide"
        WHERE statut = 'publie'
          AND "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
        ORDER BY rank DESC, published_at DESC
        LIMIT ${PAGE_SIZE} OFFSET ${OFFSET}
      `;

        const countRes = await prisma.$queryRaw`
        SELECT count(*) FROM "Aide"
        WHERE statut = 'publie'
          AND "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
      `;
        total = Number(countRes[0].count);
    } else {
        items = await prisma.aide.findMany({
            where,
            take: PAGE_SIZE,
            skip: OFFSET,
            orderBy: [
                { published_at: 'desc' },
                { id: 'asc' }
            ],
            include: { category: true, situations: true }
        });
        total = await prisma.aide.count({ where });
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
