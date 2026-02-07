import prisma from '../_utils/prisma.js';

export default async function handler(req, res) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    // Log incoming health check
    logger.info({
        requestId,
        path: '/api/health',
        method: req.method,
        userAgent: req.headers['user-agent']
    }, 'Health check started');

    let dbStatus = 'disconnected';
    let dbError = null;
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (e) {
        dbError = e.message;
        logger.error({ requestId, error: e.message }, 'Health DB Error');
    }

    let kvStatus = 'unknown';
    let kvError = null;
    try {
        // Test KV with a simple set/get/del
        const testKey = `health:test:${requestId}`;
        await kv.set(testKey, 'ok', { ex: 10 });
        const testValue = await kv.get(testKey);
        await kv.del(testKey);
        kvStatus = testValue === 'ok' ? 'connected' : 'error';
    } catch (e) {
        kvStatus = 'error';
        kvError = e.message;
        logger.error({ requestId, error: e.message }, 'Health KV Error');
    }

    const duration = Date.now() - startTime;
    const overallStatus = (dbStatus === 'connected' && kvStatus === 'connected') ? 'ok' : 'degraded';

    const info = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        requestId,
        version: process.env.npm_package_version || '0.0.0',
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_GIT_COMMIT_SHA || 'dev',
        environment: process.env.VERCEL_ENV || process.env.VITE_ENV || 'development',
        checks: {
            database: {
                status: dbStatus,
                error: dbError
            },
            kv: {
                status: kvStatus,
                error: kvError
            }
        },
        duration_ms: duration
    };

    // Log completion
    logger.info({
        requestId,
        path: '/api/health',
        status: overallStatus,
        duration_ms: duration,
        dbStatus,
        kvStatus
    }, 'Health check completed');

    // Return 503 if any critical service is down
    if (dbStatus !== 'connected') {
        return res.status(503).json(info);
    }

    return res.status(200).json(info);
}
