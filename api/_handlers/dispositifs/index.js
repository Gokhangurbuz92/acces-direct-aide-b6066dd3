import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
         return res.status(405).json({ error: 'Method not allowed' });
    }

    // Support both Vercel req.query and fallback parsing
    const query = req.query || Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams);

    const { departement, public: publicCible } = query;

    const where = {
        statut: 'publie'
    };

    if (departement) {
        where.departement = departement;
    }

    if (publicCible) {
        where.public = {
            has: publicCible
        };
    }

    try {
        const dispositifs = await prisma.dispositif.findMany({
            where,
            orderBy: { titre: 'asc' }
        });

        return res.status(200).json(dispositifs);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch dispositifs' });
    }
}
