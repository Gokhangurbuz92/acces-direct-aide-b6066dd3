import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { requireProStructureContext } from '../../_utils/auth.js';

/**
 * GET /api/pro/appointments
 * List appointments for the authenticated pro user's structure
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
        const appointments = await db.query.ProAppointment.findMany({
            where: (appt, { eq }) => eq(appt.structureId, structureId),
            orderBy: (appt, { desc }) => [desc(appt.startAt)],
            limit: 50,
        });

        return res.status(200).json({
            items: appointments,
            total: appointments.length,
        });
    } catch (error) {
        logger.error('pro.appointments.list_failed', { error: error.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
}
