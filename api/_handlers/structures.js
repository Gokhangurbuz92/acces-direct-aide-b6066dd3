import { PrismaClient, Prisma } from '@prisma/client';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { verifyAdmin } from '../_utils/auth.js';
import { createEntity, updateEntity, deleteEntity } from '../_utils/crud.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { id, slug, q, city, zip, type, page = 1, pageSize = 20 } = req.query;
    const PAGE_SIZE = Math.min(parseInt(pageSize) || 20, 100);

    const OFFSET = (parseInt(page) - 1) * PAGE_SIZE;

    const isAdmin = verifyAdmin(req);

    try {
        // CRUD Operations
        if (req.method === 'POST') return createEntity(req, res, prisma.structure);
        if (req.method === 'PUT') return updateEntity(req, res, prisma.structure);
        if (req.method === 'DELETE') return deleteEntity(req, res, prisma.structure);

        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // 1. Single Item (ID or Slug)
        if (id || slug) {
            const structure = await prisma.structure.findFirst({
                where: id ? { id: String(id) } : { slug: String(slug) },
                include: { proServices: true }
            });

            if (!structure) return res.status(404).json({ error: "Structure non trouvée" });

            // Visibility Check
            // Note: Structure uses 'actif' for published state, 'brouillon' for draft
            const isPublished = structure.statut === 'actif' || structure.statut === 'publie';
            if (!isAdmin && !isPublished) {
                 return res.status(404).json({ error: "Structure non trouvée" });
            }
            return res.status(200).json(structure);
        }

        // 2. Rate Limit (Public Only)
        if (!isAdmin) {
            const ip = getClientIp(req);
            const rateLimit = await checkRateLimit('SEARCH_STRUCTURES', ip);
            if (!rateLimit.allowed) {
                return res.status(429).json(rateLimit.error);
            }
        }

        // Base filter
        const where = {};

        if (!isAdmin) {
            where.statut = 'actif'; // Enforce public visibility
        } else {
            if (req.query.statut) where.statut = req.query.statut;
            // else Admin sees ALL
        }

        if (city) where.ville = { contains: city, mode: 'insensitive' };
        if (zip) where.code_postal = zip;
        if (type && type !== '_all') where.type_structure = type;

        let items;
        let total;

        if (q) {
            // FTS
            if (isAdmin) {
                 // Admin sees all matching Q
                 items = await prisma.$queryRaw`
                    SELECT *,
                      ts_rank_cd("search_vector", plainto_tsquery('french', unaccent(${q}))) AS rank
                    FROM "Structure"
                    WHERE "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
                    ORDER BY rank DESC, nom ASC
                    LIMIT ${PAGE_SIZE} OFFSET ${OFFSET}
                  `;
                  const countRes = await prisma.$queryRaw`
                    SELECT count(*) FROM "Structure"
                    WHERE "search_vector" @@ plainto_tsquery('french', unaccent(${q}))
                  `;
                  total = Number(countRes[0].count);

            } else {
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
            }
        } else {
            const results = await Promise.all([
                prisma.structure.findMany({
                    where,
                    take: PAGE_SIZE,
                    skip: OFFSET,
                    orderBy: [
                        { updatedAt: 'desc' },
                        { nom: 'asc' },
                        { id: 'asc' }
                    ]
                }),
                prisma.structure.count({ where })
            ]);
            items = results[0];
            total = results[1];
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
        console.error('Structures API Error:', error);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
}
