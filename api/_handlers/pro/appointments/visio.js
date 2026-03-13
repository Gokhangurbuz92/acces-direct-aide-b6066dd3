import logger from '../../../_utils/logger.js';
import { db } from '../../../../src/db/index.js';
import { Appointment } from '../../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { logProAudit } from '../../../_utils/auth.js';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { appointmentId, visio_url } = req.body;
    if (!appointmentId || !visio_url) {
        return res.status(400).json({ error: "Missing appointmentId or visio_url" });
    }

    try {
        const appointment = await db.query.Appointment.findFirst({
            where: (a, { eq }) => eq(a.id, appointmentId)
        });

        if (!appointment) return res.status(404).json({ error: "Appointment not found" });
        if (appointment.structureId !== proCtx.structureId) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        const metadata = {
            ...(typeof appointment.metadata === 'object' ? appointment.metadata : {}),
            visio_url
        };

        await db.update(Appointment).set({
            mode: 'visio',
            metadata
        }).where(eq(Appointment.id, appointmentId));

        await logProAudit('VISIO_LINK_UPDATED', proCtx.userId, proCtx.structureId, { appointmentId, visio_url }, req.headers['x-forwarded-for']);

        return res.status(200).json({ success: true, message: "Lien visio mis à jour" });

    } catch (e) {
        logger.error('Visio update error:', e);
        return res.status(500).json({ error: "Internal Error" });
    }
}

export default requireProAuth(handler);
