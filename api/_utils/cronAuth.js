
/**
 * Helper to retrieve a header safely from Vercel Request or Node Request
 */
export function getHeader(req, name) {
    if (!req) return undefined;
    const n = name.toLowerCase();
    const h = req.headers;

    // Fetch/Edge style (Headers object)
    if (h && typeof h.get === "function") {
        return h.get(name) ?? h.get(n) ?? undefined;
    }

    // Node/Express style (Plain object)
    if (h && typeof h === "object") {
        return h[n] ?? h[name] ?? undefined;
    }
    return undefined;
}

/**
 * Extract Bearer token from Authorization header
 */
export function getBearer(req) {
    const h = getHeader(req, 'authorization');
    if (!h) return null;
    const m = /^Bearer\s+(.+)$/i.exec(h);
    return m ? m[1].trim() : null;
}

/**
 * Standardized Cron Authorization Check
 * Accepts:
 * 1. Authorization: Bearer <CRON_SECRET>
 * 2. ?secret=<CRON_SECRET>
 * 3. x-vercel-cron: 1
 */
export function isCronAuthorized(req) {
    if (!process.env.CRON_SECRET) {
        console.error("CRITICAL: CRON_SECRET is not defined in environment.");
        return false;
    }

    // 1. Query Params (supports generic Node req or Vercel req.query)
    let secretQuery = req.query?.secret;
    if (!secretQuery && req.url) {
        // Fallback parsing for manual calls or raw URLs
        try {
            const proto = getHeader(req, 'x-forwarded-proto') || 'http';
            const host = getHeader(req, 'host') || 'localhost';
            secretQuery = new URL(req.url, `${proto}://${host}`).searchParams.get('secret');
        } catch (e) {
            // ignore URL parse errors
        }
    }

    // 2. Bearer Token
    const bearer = getBearer(req);

    // 3. Vercel Cron Header
    const vercelCronHeader = getHeader(req, 'x-vercel-cron');

    // Matching logic
    const token = bearer || secretQuery;

    return (token === process.env.CRON_SECRET) || (vercelCronHeader === '1');
}
