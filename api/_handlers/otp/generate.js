import logger from '../../_utils/logger.js';
import { checkRateLimit } from '../_utils/rateLimit.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default function handler(req, res) {
    // Simulate getting IP or User ID
    const identifier = req.headers['x-forwarded-for'] || '127.0.0.1';

    const limit = checkRateLimit('OTP_GEN', identifier);

    if (!limit.allowed) {
        return res.status(429).json(limit.error);
    }

    // Mock Success
    logger.info(`[AUDIT] OTP Generated for ${identifier}`);
    return res.status(200).json({ status: 'sent', message: 'Code envoyé' });
}
