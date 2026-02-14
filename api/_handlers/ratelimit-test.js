import { checkRateLimit } from '../_utils/rateLimit.js';
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (process.env.VITE_PUBLIC_DIAGNOSTICS !== 'true') {
        return res.status(404).send('Not Found');
    }
    const identifier = 'stress-test-user-' + Math.floor(Date.now() / 60000); // Unique per minute to allow "reset" wait

    try {
        const rateLimit = await checkRateLimit('OTP_GEN', identifier);

        if (!rateLimit.allowed) {
            return res.status(429).json(rateLimit.error);
        }

        return res.status(200).json({
            status: 'ok',
            message: 'Request allowed.',
            backend_hint: process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL ? 'KV_REST_API' : 'MEMORY'
        });
    } catch (error) {
        console.error("Rate Limit Test Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
