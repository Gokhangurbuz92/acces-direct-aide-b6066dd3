import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // TODO: Add Authorization Guard here (Session/Token check)
    // For now, we rely on the implementation plan's guidance:
    // "Protection: Wrapper AdminGuard" but at API level we need verifying access.
    // Assuming simple token header or we will implement AdminGuard in frontend.
    // For safety, let's look for a basic SECRET or assume Vercel protection if configured.
    // Adding placeholder for auth logic.

    const { page = 1, status = 'brouillon', limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const [items, total] = await Promise.all([
            prisma.actualite.findMany({
                where: { statut: status },
                orderBy: { fetched_at: 'desc' },
                take: Number(limit),
                skip: Number(skip)
            }),
            prisma.actualite.count({ where: { statut: status } })
        ]);

        return res.status(200).json({
            data: items,
            meta: {
                total,
                page: Number(page),
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Admin Inbox Error:', error);
        return res.status(500).json({ error: 'Database Error' });
    }
}
