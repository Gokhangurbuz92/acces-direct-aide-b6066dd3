import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../_utils/auth.js';
import { createSnapshot } from '../_utils/snapshot.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { id, limit, sort, statut } = req.query;

    try {
        // --- READ (GET) ---
        if (req.method === 'GET') {
            const user = await getAuthenticatedUser(req);
            const isAuth = !!user;

            if (id) {
                const item = await prisma.actualite.findUnique({
                    where: { id: String(id) }
                });
                if (!isAuth && item && item.statut !== 'publie') {
                    return res.status(404).json({ error: "Not found" });
                }
                return res.status(200).json(item ? [item] : []);
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
        }

        // --- WRITE ---
        const user = await getAuthenticatedUser(req);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        if (req.method === 'POST') {
            const data = req.body;
            delete data.id;
            const newItem = await prisma.actualite.create({ data });
            return res.status(201).json(newItem);
        }

        if (req.method === 'PUT') {
            if (!id) return res.status(400).json({ error: "Missing ID" });

            // Snapshot before update
            await createSnapshot('Actualite', id, user.email);

            const data = req.body;
            const updated = await prisma.actualite.update({
                where: { id: String(id) },
                data
            });
            return res.status(200).json(updated);
        }

        if (req.method === 'DELETE') {
            if (!id) return res.status(400).json({ error: "Missing ID" });
            await prisma.actualite.delete({ where: { id: String(id) } });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server Error' });
    }
}
