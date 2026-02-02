import prisma from '../_utils/prisma.js';
import { verifyAdmin } from '../_utils/auth.js';
import { handleAdminCreate, handleAdminUpdate, handleAdminDelete } from '../_utils/crud.js';
import { logger } from '../lib/logger.js'; // Ensure logger is imported

async function handler(req, res) {
    const { id, slug, limit, sort, statut } = req.query;
    let isAdmin = false;
    try {
        isAdmin = verifyAdmin(req);
    } catch (e) {
        // verifyAdmin might throw if secret is missing or something
        // Treat as non-admin
        isAdmin = false;
    }

    try {
        // CRUD operations
        if (req.method === 'POST') return handleAdminCreate(req, res, prisma.actualite);
        if (req.method === 'PUT') return handleAdminUpdate(req, res, prisma.actualite, id);
        if (req.method === 'DELETE') return handleAdminDelete(req, res, prisma.actualite, id);

        // READ (GET / HEAD)
        if (req.method === 'GET' || req.method === 'HEAD') {
            try {
                // Single item by ID or slug
                if (id || slug) {
                    const item = await prisma.actualite.findFirst({
                        where: id ? { id: String(id) } : { slug: String(slug) }
                    });

                    if (!item) {
                        return res.status(404).json({ error: "Not found" });
                    }

                    // Enforce visibility for non-admin
                    if (!isAdmin && item.statut !== 'publie') {
                        return res.status(404).json({ error: "Not found" });
                    }

                    return res.status(200).json(item);
                }

                // List items
                const where = {};
                if (isAdmin) {
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
                } else {
                    queryOptions.orderBy = { date_publication: 'desc' };
                }

                const items = await prisma.actualite.findMany(queryOptions);
                return res.status(200).json(items);
            } catch (dbError) {
                logger.error("Actualites DB Error (Recovered):", dbError);
                // Fallback to safe empty state to prevent 500
                return res.status(200).json([]);
            }
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        logger.error('Actualites handler error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default handler;
