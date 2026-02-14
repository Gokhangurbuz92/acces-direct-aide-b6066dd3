
import { env } from './env.js';

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
 * Extract cron secret from supported inputs, in priority order:
 * 1) x-cron-secret header (preferred, avoids proxy/header stripping issues)
 * 2) Authorization: Bearer <token>
 * 3) ?secret=<token> (legacy fallback; avoid in production because it may appear in logs)
 *
 * @param {any} req
 * @returns {string|null}
 */
export function getCronToken(req) {
    const headerSecret = getHeader(req, 'x-cron-secret');
    if (headerSecret != null) {
        const s = String(headerSecret).trim();
        if (s) return s;
    }

    const bearer = getBearer(req);
    if (bearer) return bearer;

    // Legacy: query param (supports generic Node req or Vercel req.query)
    let secretQuery = req?.query?.secret;
    if (!secretQuery && req?.url) {
        // Fallback parsing for manual calls or raw URLs
        try {
            const proto = getHeader(req, 'x-forwarded-proto') || 'http';
            const host = getHeader(req, 'host') || 'localhost';
            secretQuery = new URL(req.url, `${proto}://${host}`).searchParams.get('secret');
        } catch {
            // ignore URL parse errors
        }
    }

    if (secretQuery != null) {
        const s = String(secretQuery).trim();
        if (s) return s;
    }

    return null;
}

/**
 * Standardized Cron Authorization Check
 * Accepts:
 * 1. x-cron-secret: <CRON_SECRET>
 * 2. Authorization: Bearer <CRON_SECRET>
 * 3. ?secret=<CRON_SECRET> (legacy fallback)
 */
export function isCronAuthorized(req) {
    return getCronAuth(req).ok;
}

/**
 * Detailed cron authorization result so handlers can fail closed.
 *
 * @param {any} req
 * @returns {{ ok: true } | { ok: false, reason: 'missing_secret' | 'unauthorized' }}
 */
export function getCronAuth(req) {
    const cronSecret = env.secrets.cronSecret;
    if (!cronSecret) {
        return { ok: false, reason: 'missing_secret' };
    }

    const token = getCronToken(req);
    if (token && token === cronSecret) {
        return { ok: true };
    }

    return { ok: false, reason: 'unauthorized' };
}
