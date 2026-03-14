import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

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
            const dispositif = await db.query.Dispositif.findFirst({
                where: (t, { eq, and }) => {
                    const conditions = [eq(t.statut, 'publie')];
                    if (id) conditions.push(eq(t.id, id));
                    if (slug) conditions.push(eq(t.slug, slug));
                    return conditions.length === 1 ? conditions[0] : and(...conditions);
                },
            });

            if (!dispositif) {
                return res.status(404).json({ error: 'Dispositif non trouvé' });
            }

            return res.status(200).json(dispositif);
        }

        // 2. List Lookup
        const dispositifs = await db.query.Dispositif.findMany({
            where: (t, { eq, and }) => {
                const conditions = [eq(t.statut, 'publie')];
                if (departement) conditions.push(eq(t.departement, departement));
                return conditions.length === 1 ? conditions[0] : and(...conditions);
            },
            orderBy: (t, { asc }) => [asc(t.titre)],
        });

        // Post-filter for array `has` (Drizzle relational API doesn't support it)
        const filtered = publicCible
            ? dispositifs.filter(d => Array.isArray(d.public) && d.public.includes(publicCible))
            : dispositifs;

        return res.status(200).json(filtered);
    } catch (error) {
        logger.error("Dispositifs API Error", error);
        return res.status(500).json({ error: 'Failed to fetch dispositifs' });
    }
}
