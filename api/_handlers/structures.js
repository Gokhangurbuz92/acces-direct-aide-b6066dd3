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

        const validation = searchStructuresSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;

        // 1. Single Item (ID or Slug)
        if (params.id || params.slug) {
            const structure = await prisma.structure.findFirst({
                where: params.id ? { id: params.id } : { slug: params.slug },
                include: { proServices: true }
            });

    // 3. Single Item
    if (id || slug) {
        const structure = await prisma.structure.findFirst({
            where: id ? { id: String(id) } : { slug: String(slug) },
            include: { proServices: true }
        });

        // Rate Limit for search
        const ip = getClientIp(req);
        const rateLimit = await checkRateLimit('SEARCH_STRUCTURES', ip);
        if (!rateLimit.allowed) {
            return res.status(429).json(rateLimit.error);
        }
        return structure;
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

export default createHandler(handler, { query: querySchema });
