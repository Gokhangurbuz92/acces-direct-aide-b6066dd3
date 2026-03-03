import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import logger from '../../_utils/logger.js';
import prisma from '../../_utils/prisma.js';
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

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { method } = req;

    try {
        if (method === 'GET') {
            const requests = await prisma.partnershipRequest.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            return res.json(requests);
        }

        if (method === 'PUT') {
            const { id, status } = req.body;
            if (!id || !status) return res.status(400).json({ error: "Missing fields" });

            const updated = await prisma.partnershipRequest.update({
                where: { id },
                data: { status }
            });
            return res.json(updated);
        }

        res.status(405).json({ error: "Method not allowed" });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: e.message });
    }
}
