import { PrismaClient, Prisma } from '@prisma/client';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { verifyAdmin } from '../_utils/auth.js';
import { createEntity, updateEntity, deleteEntity } from '../_utils/crud.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { id, slug, q, category, situation, geo, audience, providerType, page = 1, pageSize = 20 } = req.query;
    const PAGE_SIZE = Math.min(parseInt(pageSize) || 20, 100);
    const OFFSET = (parseInt(page) - 1) * PAGE_SIZE;

    const isAdmin = verifyAdmin(req);

    try {
        // CRUD Operations (Admin Only)
        if (req.method === 'POST') return createEntity(req, res, prisma.aide);
        if (req.method === 'PUT') return updateEntity(req, res, prisma.aide);
        if (req.method === 'DELETE') return deleteEntity(req, res, prisma.aide);

        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Rate Limit (Skip for Admin)
        if (!isAdmin) {
            const ip = getClientIp(req);
            const rateLimit = await checkRateLimit('SEARCH_AIDES', ip);
            if (!rateLimit.allowed) {
                return res.status(429).json(rateLimit.error);
            }
        }

        // 1. Single Item
        if (id || slug) {
            const aide = await prisma.aide.findFirst({
                where: id ? { id: String(id) } : { slug: String(slug) },
                include: { category: true, situations: true }
            });

            if (!aide) return res.status(404).json({ error: "Aide non trouvée" });

            // Enforce visibility
            if (!isAdmin && aide.statut !== 'publie') {
                return res.status(404).json({ error: "Aide non trouvée" });
            }
            return res.status(200).json(aide);
        }

        // 2. Build Where Clause for Base Filtering
        const where = {};

        // Visibility Logic
        if (!isAdmin) {
            where.statut = 'publie';
        } else {
            // Admin can filter by status if provided, otherwise see all
            if (req.query.statut) {
                where.statut = req.query.statut;
            }
            // If no status param, Admin sees ALL (default)
        }

        if (category) {
            where.OR = [
                { category: { slug: category } },
                { categoryId: category } // fallback to ID
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

        // 3. Execution (Search or List)
        let items;
        let total;

        if (q) {
            // Weighted FTS using Optimized Column
            // Note: If Admin is searching using q, we currently restrict to 'publie'
            // unless we duplicate the complex query for admin.
            // Given Admin Panel uses Client-Side filtering for now, this is acceptable.
            // Public Search: Enforce 'publie' explicitly in SQL if !isAdmin

            if (isAdmin) {
                 // For now, let's allow Admin to search via FTS but ONLY published ones
                 // because the SQL is hardcoded.
                 // TODO: Update SQL to support status param.
                 items = await prisma.$queryRaw`
                    SELECT *,
                      ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) AS rank
                    FROM "Aide"
                    WHERE "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
                    ORDER BY rank DESC, published_at DESC
                    LIMIT ${PAGE_SIZE} OFFSET ${OFFSET}
                  `;

                 const countRes = await prisma.$queryRaw`
                    SELECT count(*) FROM "Aide"
                    WHERE "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
                  `;
                 total = Number(countRes[0].count);
            } else {
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
            }
        } else {
            items = await prisma.aide.findMany({
                where,
                take: PAGE_SIZE,
                skip: OFFSET,
                orderBy: [
                    { updatedAt: 'desc' }, // Admin prefers seeing recent updates
                    { published_at: 'desc' },
                    { id: 'asc' }
                ],
                include: { category: true, situations: true }
            });
            total = await prisma.aide.count({ where });
        }

        return res.status(200).json({
            items,
            pagination: {
                total,
                page: parseInt(page),
                pageSize: PAGE_SIZE,
                totalPages: Math.ceil(total / PAGE_SIZE)
            }
        });

    } catch (error) {
        console.error('Aides API Error:', error);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
}
