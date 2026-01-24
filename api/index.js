import { checkRateLimit } from './lib/pro-auth.js';
import { routes } from './routes.js';

// Central API Router (Vercel Serverless Function)
export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Add version header
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
        res.setHeader('x-release-sha', process.env.VERCEL_GIT_COMMIT_SHA);
    }

    // 2. Route Matching
    // Vercel rewrites /api/* to this file.
    // req.url will be something like /api/aides or /api/auth/login
    // We need to strip /api to match against our routes definitions if they are relative?
    // Let's check routes.js content.

    const url = new URL(req.url, `http://${req.headers.host}`);
    let path = url.pathname.replace(/^\/api\//, ''); // Strip leading /api/

    // SECURITY: Block /__dev routes in production/staging
    if (path.startsWith('__dev') || req.url.includes('/__dev/')) {
        // Allow only if explicitly enabled (e.g. local)
        // But for Staging/Prod we want to block.
        // We can check NODE_ENV or a specific flag.
        if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
             return res.status(403).json({ error: "Forbidden" });
        }
    }

    // Find route
    const route = routes.find(r => {
        if (r.match === 'exact') return r.path === path;
        if (r.match === 'prefix') return path.startsWith(r.path);
        return false;
    });

    if (!route) {
        return res.status(404).json({ error: "Not Found" });
    }

    // 3. Rate Limiting (Global or Route-specific?)
    // Basic global protection
    const identifier = req.headers['x-forwarded-for'] || 'unknown';
    // const limit = await checkRateLimit(identifier);
    // if (!limit.allowed) return res.status(429).json({ error: "Too Many Requests" });

    // 4. Dynamic Import & Execute
    try {
        // Vercel/Webpack needs explicit paths or a consistent pattern.
        // We use the path from routes.js which is relative to api/
        // e.g. './_handlers/auth/login.js'

        // Note: Dynamic imports in Vercel require careful handling of paths.
        // We cannot pass a variable directly to import() if it's too dynamic.
        // But here we have a constrained set of paths from routes.js which we hope Vercel analyzes.
        // If not, we might need a switch case.
        // For now, assuming the glob pattern in `api/` allows this.

        const handlerModule = await import(`${route.handler}`);
        return handlerModule.default(req, res);
    } catch (e) {
        console.error("Handler Error:", e);
        return res.status(500).json({ error: "Internal Server Error" });
import url from 'url';
import Sentry from './_utils/sentry.js';
import { routes } from './routes.js';

export default async function handler(req, res) {
    // Add Global Headers
    const release = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_GIT_COMMIT_SHA || "dev";
    const env = process.env.VERCEL_ENV || process.env.VITE_ENV || "development";
    res.setHeader('x-release-sha', release);
    res.setHeader('x-deploy-env', env);

    const urlObj = new URL(req.url, `https://${req.headers.host}`);
    let path = urlObj.pathname || "";


    console.log(`Router: Requesting ${req.url} -> Pathname: ${path}`);

    // Normalise:
    path = path.replace(/^\/api(\/|$)/, "/"); // Remove /api prefix
    path = path.replace(/^\/+/, ""); // Remove leading slashes
    path = path.replace(/\/+$/, ""); // Remove trailing slashes

    console.log(`Router: Normalized Path: "${path}"`);

    if (urlObj.searchParams.get("debug") === "1") {
        return res.status(200).json({ pathname: urlObj.pathname, path });
    }

    // Dynamic import mapping
    // This allows us to route requests to the correct file in _handlers
    // without defining each one manually


    try {
        let handlerPath = null;

        // Find matching route
        for (const route of routes) {
            if (route.match === 'exact') {
                if (path === route.path) {
                    handlerPath = route.handler;
                    break;
                }
            } else if (route.match === 'prefix') {
                if (path === route.path || path.startsWith(route.path + '/')) {
                    handlerPath = route.handler;
                    break;
                }
            }
        }

        if (handlerPath) {
            const handlerModule = await import(handlerPath);
            if (handlerModule && handlerModule.default) {
                return await handlerModule.default(req, res);
            } else {
                return res.status(500).json({ error: 'Handler module missing default export' });
            }
        }

        return res.status(404).json({ error: 'Route not found in Monolith Router' });

    } catch (error) {
        console.error('Router Error:', error);
        Sentry.captureException(error);
        await Sentry.flush(2000);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
