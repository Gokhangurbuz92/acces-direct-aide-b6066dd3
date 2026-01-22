import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    try {
        // Check DB
        await prisma.$queryRaw`SELECT 1`;

        return res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            database: 'connected'
        });
    } catch (error) {
        console.error('Health Check Failed:', error);
        return res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
}
