import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    let dbStatus = 'disconnected';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (e) {
        console.error("Health DB Error:", e);
    }

    const info = {
        status: dbStatus === 'connected' ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.0.0',
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_GIT_COMMIT_SHA || 'dev',
        database: dbStatus
    };

    if (dbStatus !== 'connected') {
        return res.status(503).json(info);
    }

    return res.status(200).json(info);
}
