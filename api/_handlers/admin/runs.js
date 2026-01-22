import { PrismaClient } from '@prisma/client';
import { verifyAdmin } from '../../_utils/auth.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized: Admin Token Required' });
    }

    try {
        const logs = await prisma.importLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return res.status(200).json({ data: logs });

    } catch (error) {
        console.error('Admin Runs Error:', error);
        return res.status(500).json({ error: 'Database Error' });
    }
}
