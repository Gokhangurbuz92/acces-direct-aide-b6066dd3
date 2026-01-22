
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;


export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { userId, email } = decoded;

        // Optional: specific fields to select
        const user = await prisma.adminUser.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, lastLogin: true }
        });

        if (!user || user.email !== email) {
            return res.status(401).json({ error: "Invalid token" });
        }

        return res.status(200).json({ user });
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expired" });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
}
