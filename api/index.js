import { routes } from './routes.js';
import Sentry from './_utils/sentry.js';
import logger from './_utils/logger.js';
import { randomUUID } from 'crypto';
import { attachNoStoreOnError } from "./_utils/cache.js";
import { applyCachePolicy } from "./_utils/cachePolicy.js";

export default async function handler(req, res) {
    let requestId = "init-" + Math.random().toString(36).substring(7);
    let log = console; // Default fallback

    try {
        requestId = randomUUID();
        const startTime = Date.now();

        // 1. Initialize Logger with Fallback
        try {
            log = logger.child({ requestId });
        } catch (e) {
            console.error("Logger init failed, using console fallback:", e);
        }

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

        // 4. Route Matching (Inner Block)
        // Security check for __dev
        if ((path.startsWith('__dev') || req.url.includes('/__dev/')) &&
            (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview')) {
            log.warn({ msg: "Blocked access to __dev", path });
            return res.status(403).json({ error: "Forbidden" });
        }

        // --- CACHE CONTROL (CENTRALIZED) ---
        // 1. Guard against error caching
        attachNoStoreOnError(res);
        // 2. Apply whitelist policy
        applyCachePolicy(req, res);
        // -----------------------------------

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
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            log.info({
                msg: "Request Completed",
                status: res.statusCode,
                duration,
            });
        });

        // PIPELINE SENTINEL: Route Level
        if (path === 'cron/pipeline') {
            const runId = req.query.runId || req.headers['x-run-id'] || 'N/A';
            const source = req.query.source || 'N/A';
            console.log(`PIPELINE_ROUTE_ENTER source=${source} runId=${runId}`);
        }

        await routeHandler(req, res);

    } catch (bootError) {
        // GLOBAL CATCH: Catches errors before the handler specific try/catch or if it bubble up
        // This prevents "FUNCTION_INVOCATION_FAILED" generic errors
        console.error("CRITICAL HANDLER CRASH:", bootError);

        if (!res.headersSent) {
            try {
                res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
                res.setHeader("x-error-source", "boot-guard");
                res.status(500).json({
                    error: "Server Boot Error",
                    requestId,
                    message: process.env.NODE_ENV === 'production' ? "Internal Error" : String(bootError.message)
                });
            } catch (inner) {
                console.error("Error sending 500 response:", inner);
                res.end('{"error": "Critical Failure"}');
            }
        }

        // Try to capture in Sentry if possible
        try {
            Sentry.captureException(bootError, { tags: { requestId, phase: "boot" } });
            await Sentry.flush(2000);
        } catch {
            // Intentionally ignore: Sentry reporting is best-effort, failure should not block response
        }
    }
}
