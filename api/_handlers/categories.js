import { PrismaClient } from '@prisma/client';
import { verifyAdmin } from '../_utils/auth.js';
import { createEntity, updateEntity, deleteEntity } from '../_utils/crud.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { id, slug, page = 1, pageSize = 50 } = req.query; // Larger page size for cats
    const PAGE_SIZE = Math.min(parseInt(pageSize) || 50, 100);
    const OFFSET = (parseInt(page) - 1) * PAGE_SIZE;

    const isAdmin = verifyAdmin(req);

    // CRUD
    if (req.method === 'POST') return createEntity(req, res, prisma.aidCategory);
    if (req.method === 'PUT') return updateEntity(req, res, prisma.aidCategory);
    if (req.method === 'DELETE') return deleteEntity(req, res, prisma.aidCategory);

    // GET
    if (req.method === 'GET') {
        if (id || slug) {
            const item = await prisma.aidCategory.findFirst({
                 where: id ? { id: String(id) } : { slug: String(slug) }
            });
            if (!item) return res.status(404).json({ error: "Not found" });
            return res.status(200).json(item);
        }

        const items = await prisma.aidCategory.findMany({
            take: PAGE_SIZE,
            skip: OFFSET,
            orderBy: { label: 'asc' }
        });

        const total = await prisma.aidCategory.count();

        return res.status(200).json({
            items,
            pagination: {
                total,
                page: parseInt(page),
                pageSize: PAGE_SIZE,
                totalPages: Math.ceil(total / PAGE_SIZE)
            }
        });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
