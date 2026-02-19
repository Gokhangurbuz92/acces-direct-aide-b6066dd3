import { routes } from './routes.js';
import Sentry from './_utils/sentry.js';
import logger from './_utils/logger.js';
import { randomUUID } from 'crypto';
import { attachNoStoreOnError } from "./_utils/cache.js";
import { applyCachePolicy } from "./_utils/cachePolicy.js";
import { env, getEnv } from './_utils/env.js';
import { applyNoIndex, isTechnicalNoIndexPath } from './_utils/robots.js';

/** @param {unknown} value */
function normalizeRequestId(value) {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.length > 64) return null;
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) return null;
    return trimmed;
}

/**
 * Avoid leaking secrets in logs.
 * We redact common sensitive query keys (exact or substring match).
 *
 * @param {URLSearchParams} searchParams
 * @returns {Record<string, string>}
 */
function redactQueryParams(searchParams) {
    /** @type {Record<string, string>} */
    const out = {};
    for (const [key, value] of searchParams.entries()) {
        const k = String(key || '').toLowerCase();
        const isSensitive =
            k.includes('secret') ||
            k.includes('token') ||
            k.includes('password') ||
            k === 'key' ||
            k.includes('auth');

        const s = String(value || '');
        const truncated = s.length > 80 ? `${s.slice(0, 80)}...` : s;

        out[key] = isSensitive ? '[REDACTED]' : truncated;
    }
    return out;
}

/**
 * @param {string} path
 * @returns {'public' | 'admin' | 'cron' | 'monitor' | 'health' | 'other'}
 */
function getRouteGroup(path) {
    if (!path) return 'other';
    if (path.startsWith('admin/')) return 'admin';
    if (path.startsWith('cron/')) return 'cron';
    if (path.startsWith('monitor/')) return 'monitor';
    if (path === 'health' || path === 'healthz' || path.startsWith('health/')) return 'health';

    const publicPrefixes = [
        'aides',
        'actualites',
        'appointments',
        'auth/',
        'demarches',
        'dispositifs',
        'download',
        'feedback',
        'guides',
        'login-pro-guard',
        'pdf',
        'pro/',
        'public/',
        'reports',
        'ressources',
        'robots',
        'search',
        'sitemap',
        'structures',
        'taxonomy',
        'tools',
        'upload',
    ];

    if (publicPrefixes.some((prefix) => path === prefix || path.startsWith(prefix))) {
        return 'public';
    }

    return 'other';
}
/**
 * @param {import('./_utils/http-types').ApiRequest} req
 * @param {import('./_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    let requestId = "init-" + Math.random().toString(36).substring(7);
    let log = logger; // Default fallback

    try {
        const startTime = Date.now();

        requestId = normalizeRequestId(req.headers?.['x-request-id']) || randomUUID();
        req.requestId = requestId;

        // 1. Initialize Logger with Fallback
        try {
            log = logger.child({ requestId });
        } catch (e) {
            console.error("Logger init failed, using root logger fallback:", e);
            log = logger;
        }

        // 2. CORS Headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret');
        res.setHeader('x-request-id', requestId);

        const vercelGitSha = getEnv('VERCEL_GIT_COMMIT_SHA');
        if (vercelGitSha) {
            res.setHeader('x-release-sha', vercelGitSha);
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
        const routeGroup = getRouteGroup(path);

        if (isTechnicalNoIndexPath(path)) {
            applyNoIndex(res);
        }

        log.info({
            msg: "Incoming Request",
            method: req.method,
            path: path,
            routeGroup,
            query: redactQueryParams(urlObj.searchParams),
            userAgent: req.headers['user-agent']
        });

        // 4. Route Matching (Inner Block)
        // Security check for __dev
        if ((path.startsWith('__dev') || req.url.includes('/__dev/')) &&
            (env.runtime.vercelEnv === 'production' || env.runtime.vercelEnv === 'preview')) {
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
                routeGroup,
            });
        });

        // PIPELINE SENTINEL: Route Level
        if (path === 'cron/pipeline') {
            const runId = req.query.runId || req.headers['x-run-id'] || 'N/A';
            const source = req.query.source || 'N/A';
            console.log(`PIPELINE_ROUTE_ENTER source=${source} runId=${runId}`);
        }

        await Sentry.withScope(async (scope) => {
            try {
                scope.setTag('request_id', requestId);
                scope.setTag('route', path);
                scope.setTag('route_group', routeGroup);
                scope.setTag('vercel_env', env.runtime.vercelEnv);
                scope.setTag('release', env.sentry.release);
                scope.setTag('http.method', String(req.method || 'GET').toUpperCase());
                scope.setContext('http', {
                    method: String(req.method || 'GET').toUpperCase(),
                    path: `/${path}`,
                });

                await routeHandler(req, res);
            } catch (routeError) {
                const message = routeError instanceof Error ? routeError.message : String(routeError);
                log.error({ msg: 'Handler crashed', error: message }, 'Unhandled handler error');

                try {
                    Sentry.captureException(routeError, {
                        tags: {
                            requestId,
                            route: path,
                            routeGroup,
                            phase: 'handler',
                            vercelEnv: env.runtime.vercelEnv,
                            'http.method': String(req.method || 'GET').toUpperCase(),
                            'http.status_code': '500',
                        },
                    });
                    await Sentry.flush(2000);
                } catch {
                    // best-effort
                }

                if (!res.headersSent) {
                    res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
                    res.setHeader("x-error-source", "handler-guard");
                    res.status(500).json({
                        error: "Internal Server Error",
                        requestId,
                        message: env.runtime.nodeEnv === 'production' ? "Internal Error" : String(message),
                    });
                }
            }
        });

    } catch (bootError) {
        // GLOBAL CATCH: Catches errors before the handler specific try/catch or if it bubble up
        // This prevents "FUNCTION_INVOCATION_FAILED" generic errors
        console.error("CRITICAL HANDLER CRASH:", bootError);
        const bootMessage = bootError instanceof Error ? bootError.message : String(bootError);

        if (!res.headersSent) {
            try {
                res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
                res.setHeader("x-error-source", "boot-guard");
                res.status(500).json({
                    error: "Server Boot Error",
                    requestId,
                    message: env.runtime.nodeEnv === 'production' ? "Internal Error" : bootMessage
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
