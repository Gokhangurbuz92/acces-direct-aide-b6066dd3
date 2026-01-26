import { PrismaClient } from '@prisma/client';
import { verifyAdmin } from '../_utils/auth.js';
import { createEntity, updateEntity, deleteEntity } from '../_utils/crud.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { id, slug, q, category, situation, geo, page = 1, pageSize = 20 } = req.query;
    const PAGE_SIZE = Math.min(parseInt(pageSize) || 20, 100);
    const OFFSET = (parseInt(page) - 1) * PAGE_SIZE;

    const isAdmin = verifyAdmin(req);

    try {
        // CRUD Operations (Admin Only)
        if (req.method === 'POST') return createEntity(req, res, prisma.demarche);
        if (req.method === 'PUT') return updateEntity(req, res, prisma.demarche);
        if (req.method === 'DELETE') return deleteEntity(req, res, prisma.demarche);

        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // 1. Single Item
        if (id || slug) {
            const demarche = await prisma.demarche.findFirst({
                where: id ? { id: String(id) } : { slug: String(slug) },
                include: { category: true, situations: true }
            });

            if (!demarche) return res.status(404).json({ error: "Démarche non trouvée" });
            if (!isAdmin && demarche.statut !== 'publie') {
                return res.status(404).json({ error: "Démarche non trouvée" });
            }
            return res.status(200).json(demarche);
        }

        // 2. Build Where Clause
        const where = {};
        if (!isAdmin) {
            where.statut = 'publie';
        } else {
            if (req.query.statut) where.statut = req.query.statut;
        }

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
            where.departements = { has: geo };
        }

        // 3. Execution (Search or List)
        let items;
        let total;

        if (q) {
             if (isAdmin) {
                 // Admin see all matching query
                 items = await prisma.$queryRaw`
                    SELECT *,
                      ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) AS rank
                    FROM "Demarche"
                    WHERE "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
                    ORDER BY rank DESC, published_at DESC
                    LIMIT ${PAGE_SIZE} OFFSET ${OFFSET}
                  `;
                 const countRes = await prisma.$queryRaw`
                    SELECT count(*) FROM "Demarche"
                    WHERE "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
                  `;
                 total = Number(countRes[0].count);
             } else {
                items = await prisma.$queryRaw`
                    SELECT *,
                      ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) AS rank
                    FROM "Demarche"
                    WHERE statut = 'publie'
                      AND "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
                    ORDER BY rank DESC, published_at DESC
                    LIMIT ${PAGE_SIZE} OFFSET ${OFFSET}
                  `;

                const countRes = await prisma.$queryRaw`
                    SELECT count(*) FROM "Demarche"
                    WHERE statut = 'publie'
                      AND "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
                  `;
                total = Number(countRes[0].count);
             }
        } else {
            items = await prisma.demarche.findMany({
                where,
                take: PAGE_SIZE,
                skip: OFFSET,
                orderBy: [
                    { updatedAt: 'desc' },
                    { published_at: 'desc' },
                    { id: 'asc' }
                ],
                include: { category: true, situations: true }
            });
            total = await prisma.demarche.count({ where });
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
        console.error('Demarches API Error:', error);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
}
