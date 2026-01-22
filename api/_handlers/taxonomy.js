import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const categories = await prisma.aidCategory.findMany({
            orderBy: { label: 'asc' },
            include: {
                _count: {
                    select: { aides: { where: { statut: 'publie' } } }
                }
            }
        });

        const situations = await prisma.lifeSituation.findMany({
            orderBy: { label: 'asc' },
            include: {
                _count: {
                    select: { aides: { where: { statut: 'publie' } } }
                }
            }
        });

        return res.status(200).json({
            categories: categories.map(c => ({
                id: c.id,
                slug: c.slug,
                label: c.label,
                count: c._count.aides
            })),
            situations: situations.map(s => ({
                id: s.id,
                slug: s.slug,
                label: s.label,
                count: s._count.aides
            }))
        });
    } catch (error) {
        console.error('Taxonomy API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
