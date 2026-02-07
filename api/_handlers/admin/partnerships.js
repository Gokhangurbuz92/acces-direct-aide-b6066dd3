
import prisma from '../../_utils/prisma.js';
import jwt from 'jsonwebtoken';

const ALLOWED_ADMIN_ROLES = ['admin', 'superadmin'];

function isAdmin(req) {
    if (process.env.VITE_DEV_LOGIN_ENABLED === 'true') return true;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded && ALLOWED_ADMIN_ROLES.includes(decoded.role);
    } catch (e) {
        return false;
    }
}

export default async function handler(req, res) {
    if (!isAdmin(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { method } = req;

    try {
        if (method === 'GET') {
            const requests = await prisma.partnershipRequest.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            return res.json(requests);
        }

        if (method === 'PUT') {
            const { id, status } = req.body;
            if (!id || !status) return res.status(400).json({ error: "Missing fields" });

            const updated = await prisma.partnershipRequest.update({
                where: { id },
                data: { status }
            });
            return res.json(updated);
        }

        res.status(405).json({ error: "Method not allowed" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}
