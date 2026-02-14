import { checkRateLimit } from '../_utils/rateLimit.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default function handler(req, res) {
    const identifier = req.headers['x-forwarded-for'] || '127.0.0.1';

    const limit = checkRateLimit('OTP_VERIFY', identifier);

    if (!limit.allowed) {
        return res.status(429).json(limit.error);
    }

    // Mock Success
    return res.status(200).json({ status: 'verified', token: 'mock-jwt' });
}
