import prisma from '../../_utils/prisma.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
         return res.status(405).json({ error: 'Method not allowed' });
    }

    // Support both Vercel req.query and fallback parsing
    const query = req.query || Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams);

    const { departement, public: publicCible, id, slug } = query;

    try {
        // 1. Single Item Lookup
        if (id || slug) {
            const where = {
                statut: 'publie'
            };
            if (id) where.id = id;
            if (slug) where.slug = slug;

            const dispositif = await prisma.dispositif.findFirst({
                where
            });

            if (!dispositif) {
                return res.status(404).json({ error: 'Dispositif non trouvé' });
            }

            return res.status(200).json(dispositif);
        }

        // 2. List Lookup
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

        const dispositifs = await prisma.dispositif.findMany({
            where,
            orderBy: { titre: 'asc' }
        });

        return res.status(200).json(dispositifs);
    } catch (error) {
        console.error("Dispositifs API Error", error);
        return res.status(500).json({ error: 'Failed to fetch dispositifs' });
    }
}
