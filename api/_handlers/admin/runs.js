import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { ImportLog } from '../../../src/db/schema.js';
import { verifyAdmin } from '../../_utils/auth.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('ADMIN_API', ip);
    if (!rateLimit.allowed) {
        return res.status(getRateLimitStatus(rateLimit)).json(rateLimit.error);
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized: Admin Token Required' });
    }

    try {
        const logs = await db.query.ImportLog.findMany({
            orderBy: (il, { desc }) => [desc(il.createdAt)],
            limit: 50
        });

        return res.status(200).json({ data: logs });

    } catch (error) {
        logger.error('Admin Runs Error:', error);
        return res.status(500).json({ error: 'Database Error' });
    }
}
