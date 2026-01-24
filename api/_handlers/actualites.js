import { PrismaClient } from '@prisma/client';
import { verifyAdmin } from '../_utils/auth.js';
import { createEntity, updateEntity, deleteEntity } from '../_utils/crud.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { id, slug, limit, sort, statut } = req.query;
    const isAdmin = verifyAdmin(req);

    // CRUD
    if (req.method === 'POST') return createEntity(req, res, prisma.actualite);
    if (req.method === 'PUT') return updateEntity(req, res, prisma.actualite);
    if (req.method === 'DELETE') return deleteEntity(req, res, prisma.actualite);

    // GET
    if (req.method === 'GET') {
        if (id || slug) {
            const item = await prisma.actualite.findFirst({
                 where: id ? { id: String(id) } : { slug: String(slug) }
            });

            if (!item) return res.status(404).json({ error: "Not found" });
            if (!isAdmin && item.statut !== 'publie') {
                return res.status(404).json({ error: "Not found" });
            }
            return res.status(200).json(item);
        }

        const where = {};
        if (!isAdmin) {
             where.statut = 'publie';
        } else {
             if (statut) where.statut = statut;
        }

        const queryOptions = {
            where,
            take: limit ? parseInt(limit) : undefined,
            orderBy: sort ? {
                [sort.replace('-', '')]: sort.startsWith('-') ? 'desc' : 'asc'
            } : { date_publication: 'desc' }
        };

        const items = await prisma.actualite.findMany(queryOptions);
        return res.status(200).json(items);
    }

    return res.status(405).json({ error: "Method not allowed" });
}
