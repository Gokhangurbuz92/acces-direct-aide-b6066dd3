import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function getAuthenticatedUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { userId, email } = decoded;

        const user = await prisma.adminUser.findUnique({
            where: { id: userId }
        });

        if (user && user.email === email) {
            return user;
        }
    } catch (e) {
        return null;
    }
    return null;
}
