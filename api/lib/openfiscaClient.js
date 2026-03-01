import { logger } from './logger.js';
/**
 * OpenFisca France API client.
 * Encapsulates /calculate and /trace calls with timeout, error handling, and PII protection.
 *
 * Health probe: cached 60s to avoid hammering /spec on every request.
 * URL: normalised (trailing slash stripped) to prevent //calculate paths.
 */

const RAW_URL = process.env.OPENFISCA_BASE_URL || 'https://api.fr.openfisca.org/latest';
const OPENFISCA_BASE_URL = RAW_URL.replace(/\/+$/, ''); // normalise: strip trailing slash(es)
const OPENFISCA_TIMEOUT_MS = parseInt(process.env.OPENFISCA_TIMEOUT_MS || '4000', 10);
const OPENFISCA_ENABLE_TRACE = process.env.OPENFISCA_ENABLE_TRACE === 'true';

/* ── Health probe cache (60 s TTL) ─────────────────────────── */
const HEALTH_CACHE_TTL_MS = 60_000;
let _healthCache = { available: null, checkedAt: 0 };

/**
 * Make a POST request to OpenFisca with timeout.
 * @param {string} endpoint - '/calculate' or '/trace'
 * @param {object} payload - OpenFisca situation JSON
 * @returns {Promise<object>} OpenFisca response
 */
async function post(endpoint, payload) {
    const url = `${OPENFISCA_BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OPENFISCA_TIMEOUT_MS);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            const err = new Error(`OpenFisca ${endpoint} returned ${res.status}`);
            err.status = res.status;
            err.code = 'OPENFISCA_HTTP_ERROR';
            err.detail = text.slice(0, 200); // limit logged detail
            throw err;
        }

        return await res.json();
    } catch (err) {
        if (err.name === 'AbortError') {
            const timeoutErr = new Error(`OpenFisca ${endpoint} timed out after ${OPENFISCA_TIMEOUT_MS}ms`);
            timeoutErr.code = 'OPENFISCA_TIMEOUT';
            throw timeoutErr;
        }
        if (!err.code) {
            err.code = 'OPENFISCA_NETWORK_ERROR';
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Calculate rights via OpenFisca /calculate.
 * @param {object} situation - Full OpenFisca situation JSON (individus, familles, menages, foyers_fiscaux)
 * @returns {Promise<object>} OpenFisca calculation result
 */
export async function calculate(situation) {
    // Log without PII — only structure info
    logger.info('[OpenFisca] calculate request', {
        individuCount: Object.keys(situation.individus || {}).length,
        hasFamily: !!situation.familles,
    });

    const result = await post('/calculate', situation);

    logger.info('[OpenFisca] calculate success');
    return result;
}

/**
 * Get trace via OpenFisca /trace (for pro/admin debugging).
 * Only enabled when OPENFISCA_ENABLE_TRACE=true or explicitly requested.
 * @param {object} situation - Full OpenFisca situation JSON
 * @returns {Promise<object>} OpenFisca trace result
 */
export async function trace(situation) {
    if (!OPENFISCA_ENABLE_TRACE) {
        const err = new Error('OpenFisca trace is disabled in this environment');
        err.code = 'OPENFISCA_TRACE_DISABLED';
        throw err;
    }

    logger.info('[OpenFisca] trace request');
    const result = await post('/trace', situation);

    logger.info('[OpenFisca] trace success');
    return result;
}

/**
 * Check if OpenFisca is reachable (health check).
 * Uses a 60-second TTL cache to avoid hammering the upstream on every request.
 * @returns {Promise<boolean>}
 */
export async function isAvailable() {
    const now = Date.now();
    if (_healthCache.available !== null && (now - _healthCache.checkedAt) < HEALTH_CACHE_TTL_MS) {
        return _healthCache.available;
    }

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${OPENFISCA_BASE_URL}/spec`, {
            signal: controller.signal,
        });
        clearTimeout(timer);
        _healthCache = { available: res.ok, checkedAt: now };
        return res.ok;
    } catch {
        _healthCache = { available: false, checkedAt: now };
        return false;
    }
}

export default { calculate, trace, isAvailable };
