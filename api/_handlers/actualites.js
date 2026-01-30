import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../_utils/auth.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { id, slug, limit, sort, statut } = req.query;

    try {
        // --- READ (GET / HEAD) ---
        if (req.method === 'GET' || req.method === 'HEAD') {
            const user = await getAuthenticatedUser(req);
            const isAuth = !!user;

            try {
                if (id || slug) {
                    const item = await prisma.actualite.findFirst({
                        where: id ? { id: String(id) } : { slug: String(slug) }
                    });
                    if (!isAuth && item && item.statut !== 'publie') {
                        return res.status(404).json({ error: "Not found" });
                    }
                    if (!item) return res.status(404).json({ error: "Not found" });
                    return res.status(200).json(item);
                }

                const where = {};
                if (isAuth) {
                    if (statut) where.statut = statut;
                } else {
                    where.statut = 'publie';
                }

                const queryOptions = {
                    where,
                    take: limit ? parseInt(limit) : undefined,
                };

                if (sort) {
                    const desc = sort.startsWith('-');
                    const field = desc ? sort.substring(1) : sort;
                    queryOptions.orderBy = {
                        [field]: desc ? 'desc' : 'asc'
                    };
                }

                const items = await prisma.actualite.findMany(queryOptions);
                return res.status(200).json(items);
            } catch (dbError) {
                console.error("Actualites DB Error (Recovered):", dbError);
                // Fallback to safe empty state to prevent 500
                return res.status(200).json([]);
            }
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (e) {
        console.error("Actualites Error:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
