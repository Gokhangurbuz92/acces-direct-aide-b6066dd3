
import url from 'url';

// Helper to sanitize path
const sanitizePath = (path) => path.replace(/^\/api\//, '').split('?')[0];

export default async function handler(req, res) {
    const url = new URL(req.url, `https://${req.headers.host}`);
    let path = url.pathname || "";

    // Normalise:
    //  - "/api/cron/ingest-structures" -> "cron/ingest-structures"
    //  - "/api" -> ""
    path = path.replace(/^\/api(\/|$)/, "/");
    path = path.replace(/^\/+/, "");
    path = path.replace(/\/+$/, "");

    if (url.searchParams.get("debug") === "1") {
        return res.status(200).json({ pathname: url.pathname, path });
    }

    // Dynamic import mapping
    // This allows us to route requests to the correct file in _handlers
    // without defining each one manually

    try {
        let handlerModule;

        // Strategy: Try to find a matching file in _handlers
        // 1. Exact match (e.g., /api/aides -> _handlers/aides.js)
        // 2. Directory index (e.g., /api/pro/appointments -> _handlers/pro/appointments/index.js)
        // 3. Dynamic routes (needs manual mapping or smarter logic)

        // Simple router map for known top-level and nested structure
        // This is necessary because dynamic imports in Vercel need to be trace-able
        // or we need to simple switch case for stability.

        // Given the scale, a switch case might be safer and faster to implement correctly than complex dynamic resolution
        // that fails bundling.

        if (path === 'aides' || path.startsWith('aides/')) {
            handlerModule = await import('./_handlers/aides.js');
        } else if (path === 'structures' || path.startsWith('structures/')) {
            handlerModule = await import('./_handlers/structures.js');
        } else if (path === 'demarches' || path.startsWith('demarches/')) {
            handlerModule = await import('./_handlers/demarches.js');
        } else if (path === 'actualites' || path.startsWith('actualites/')) {
            handlerModule = await import('./_handlers/actualites.js');
        } else if (path === 'guides' || path.startsWith('guides/')) {
            handlerModule = await import('./_handlers/guides.js');
        } else if (path === 'tools' || path.startsWith('tools/')) {
            handlerModule = await import('./_handlers/tools.js');
        } else if (path === 'upload') {
            handlerModule = await import('./_handlers/upload.js');
        } else if (path === 'download') {
            handlerModule = await import('./_handlers/download.js');
        } else if (path === 'health') {
            handlerModule = await import('./_handlers/health.js');
        } else if (path === 'robots.txt' || path === 'robots') {
            handlerModule = await import('./_handlers/robots.js');
        } else if (path === 'sitemap.xml' || path === 'sitemap') {
            handlerModule = await import('./_handlers/sitemap.js');
        } else if (path === 'login-pro-guard') {
            handlerModule = await import('./_handlers/login-pro-guard.js');

            // Public Handlers
        } else if (path === 'public/messages') {
            handlerModule = await import('./_handlers/public/messages.js');
        } else if (path === 'public/suggest-structure') {
            handlerModule = await import('./_handlers/public/suggest-structure.js');
        } else if (path === 'public/stats') {
        } else if (path === 'public/stats') {
            handlerModule = await import('./_handlers/public/stats.js');

            // Admin Auth (New P0 Fix)
        } else if (path === 'auth/login') {
            handlerModule = await import('./_handlers/auth/login.js');
        } else if (path === 'auth/me') {
            handlerModule = await import('./_handlers/auth/me.js');

            // Pro Handlers
        } else if (path === 'pro/messages') {
            handlerModule = await import('./_handlers/pro/messages.js');
        } else if (path === 'pro/auth/login') {
            handlerModule = await import('./_handlers/pro/auth/login.js');
        } else if (path === 'pro/appointments') {
            handlerModule = await import('./_handlers/pro/appointments/index.js');

            // Dispositifs
        } else if (path === 'dispositifs' || path === 'dispositifs/' || path === 'dispositifs/index') {
            handlerModule = await import('./_handlers/dispositifs/index.js');

            // Cron
        } else if (path === 'cron/ingest-rss') {
            handlerModule = await import('./_handlers/cron/ingest-rss.js');
        } else if (path === 'cron/pipeline') {
            handlerModule = await import('./_handlers/cron/pipeline.js');
        } else if (path === 'cron/ingest-structures') {
            handlerModule = await import('./_handlers/cron/ingest-structures.js');
        } else if (path === 'cron/purge') {
            handlerModule = await import('./_handlers/cron/purge.js');

            // Admin
        } else if (path === 'admin/inbox') {
            handlerModule = await import('./_handlers/admin/inbox.js');
        } else if (path === 'admin/actions') {
            handlerModule = await import('./_handlers/admin/actions.js');
        } else if (path === 'admin/runs') {
            handlerModule = await import('./_handlers/admin/runs.js');

        } else {
            return res.status(404).json({ error: 'Route not found in Monolith Router' });
        }

        // Execute the handler
        if (handlerModule && handlerModule.default) {
            return await handlerModule.default(req, res);
        } else {
            return res.status(500).json({ error: 'Handler module missing default export' });
        }

    } catch (error) {
        console.error('Router Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
