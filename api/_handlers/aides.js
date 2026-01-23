import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { id, slug, q, category, situation, geo, audience, providerType, page = 1, pageSize = 20 } = req.query;
    const PAGE_SIZE = Math.min(parseInt(pageSize) || 20, 100);
    const OFFSET = (parseInt(page) - 1) * PAGE_SIZE;

    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // 1. Single Item
        if (id || slug) {
            const aide = await prisma.aide.findFirst({
                where: id ? { id: String(id) } : { slug: String(slug) },
                include: { category: true, situations: true }
            });

            if (!aide || aide.statut !== 'publie') {
                return res.status(404).json({ error: "Aide non trouvée" });
            }
            return res.status(200).json(aide);
        }

        // 2. Build Where Clause for Base Filtering
        const where = { statut: 'publie' };

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

        // 4. Facets (for UI filters)
        // To be efficient, we do separate counts or use the taxonomy endpoint
        // But for a better UX, returning the current result's facets is great.

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
