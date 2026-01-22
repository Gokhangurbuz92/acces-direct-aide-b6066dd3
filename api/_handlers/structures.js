import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { q, city, zip, type, page = 1, pageSize = 20 } = req.query;
    const PAGE_SIZE = parseInt(pageSize);
    const OFFSET = (parseInt(page) - 1) * PAGE_SIZE;

    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const where = { statut: 'actif' }; // Note: some models use 'statut', others 'status'. Schema says 'statut' for Structure too?

        if (city) {
            where.ville = { contains: city, mode: 'insensitive' };
        }

        if (zip) {
            where.code_postal = zip;
        }

        if (type) {
            where.type_structure = type;
        }

        if (q) {
            where.OR = [
                { nom: { contains: q, mode: 'insensitive' } },
                { description_courte: { contains: q, mode: 'insensitive' } },
                { ville: { contains: q, mode: 'insensitive' } },
                { code_postal: { contains: q, mode: 'insensitive' } },
                { mots_cles: { hasSome: [q] } }
            ];
        }

        const [items, total] = await Promise.all([
            prisma.structure.findMany({
                where,
                take: PAGE_SIZE,
                skip: OFFSET,
                orderBy: { nom: 'asc' }
            }),
            prisma.structure.count({ where })
        ]);

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
        return res.status(500).json({ error: 'Server Error' });
    }
}
