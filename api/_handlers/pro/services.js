import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { requireProStructureContext } from '../../_utils/auth.js';

/**
 * GET /api/pro/services
 * List RDV services for the authenticated pro user's structure
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    try {
        const { structureId } = proCtx;
        const services = await db.query.ProRdvService.findMany({
            where: (svc, { eq }) => eq(svc.structureId, structureId),
            orderBy: (svc, { asc }) => [asc(svc.name)],
        });

        return res.status(200).json({
            items: services,
            total: services.length,
        });
    } catch (error) {
        logger.error('pro.services.list_failed', { error: error.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
}
