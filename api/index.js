import { routes } from './routes.js';
import Sentry from './_utils/sentry.js';
import logger from './_utils/logger.js';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
    const requestId = randomUUID();
    const startTime = Date.now();

    // 1. Initialize Logger
    const log = logger.child({ requestId });

    // 2. CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('x-request-id', requestId);

    if (process.env.VERCEL_GIT_COMMIT_SHA) {
        res.setHeader('x-release-sha', process.env.VERCEL_GIT_COMMIT_SHA);
    }

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. Request Logging
    const urlObj = new URL(req.url, `https://${req.headers.host}`);
    let path = urlObj.pathname || "";

    // Normalize path
    path = path.replace(/^\/api(\/|$)/, "/");
    path = path.replace(/^\/+/, "");
    path = path.replace(/\/+$/, "");

    log.info({
        msg: "Incoming Request",
        method: req.method,
        path: path,
        query: Object.fromEntries(urlObj.searchParams),
        userAgent: req.headers['user-agent']
    });

    try {
        // 4. Route Matching
        // Security check for __dev
        if ((path.startsWith('__dev') || req.url.includes('/__dev/')) &&
            (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview')) {
            log.warn({ msg: "Blocked access to __dev", path });
            return res.status(403).json({ error: "Forbidden" });
        }

        let routeHandler = null;
        const route = routes.find(r => {
            if (r.match === 'exact') return r.path === path;
            if (r.match === 'prefix') return path.startsWith(r.path) || path.startsWith(r.path + '/');
            return false;
        });

        if (route) {
            routeHandler = route.handler;
        }

        if (!routeHandler) {
            log.warn({ msg: "Route Not Found", path });
            return res.status(404).json({ error: "Not Found" });
        }

        // 5. Execute Handler
        // Wrap response to log duration on finish
        // Note: res.on('finish') is node-specific, Vercel supports it.
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            log.info({
                msg: "Request Completed",
                status: res.statusCode,
                duration,
            });
        });

        await routeHandler(req, res);

    } catch (error) {
        const duration = Date.now() - startTime;
        log.error({
            msg: "Request Error",
            error: error.message,
            stack: error.stack,
            duration
        });

        // Explicitly set tags to ensure context is captured even if scope is lost
        Sentry.captureException(error, {
            tags: {
                requestId,
                release: process.env.VERCEL_GIT_COMMIT_SHA || "dev"
            }
        });
        await Sentry.flush(2000);

        if (!res.headersSent) {
            return res.status(500).json({ error: "Internal Server Error", requestId });
        }
    }
}
