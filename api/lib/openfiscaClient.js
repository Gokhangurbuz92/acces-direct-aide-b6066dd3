/**
 * OpenFisca France API client.
 * Encapsulates /calculate and /trace calls with timeout, error handling, and PII protection.
 */

const OPENFISCA_BASE_URL = process.env.OPENFISCA_BASE_URL || 'https://api.fr.openfisca.org/latest';
const OPENFISCA_TIMEOUT_MS = parseInt(process.env.OPENFISCA_TIMEOUT_MS || '4000', 10);
const OPENFISCA_ENABLE_TRACE = process.env.OPENFISCA_ENABLE_TRACE === 'true';

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
        if (!err.status) {
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
    console.log('[OpenFisca] calculate request', {
        individuCount: Object.keys(situation.individus || {}).length,
        hasFamily: !!situation.familles,
    });

    const result = await post('/calculate', situation);

    console.log('[OpenFisca] calculate success');
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
        throw new Error('OpenFisca trace is disabled in this environment');
    }

    console.log('[OpenFisca] trace request');
    const result = await post('/trace', situation);

    console.log('[OpenFisca] trace success');
    return result;
}

/**
 * Check if OpenFisca is reachable (health check).
 * @returns {Promise<boolean>}
 */
export async function isAvailable() {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${OPENFISCA_BASE_URL}/spec`, {
            signal: controller.signal,
        });
        clearTimeout(timer);
        return res.ok;
    } catch {
        return false;
    }
}

export default { calculate, trace, isAvailable };
