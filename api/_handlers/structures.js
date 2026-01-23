import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { q, city, zip, type, page = 1, pageSize = 20 } = req.query;
    const PAGE_SIZE = Math.min(parseInt(pageSize) || 20, 100);
    const OFFSET = (parseInt(page) - 1) * PAGE_SIZE;

    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Base filter for non-search queries or counting
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
