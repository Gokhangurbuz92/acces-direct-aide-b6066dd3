import logger from '../../../_utils/logger.js';
import prisma from '../../../_utils/prisma.js';
import { hash } from '../../../lib/crypto.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { id } = req.query; // /api/appointments/:id/cancel
    const { token } = req.body;

    if (!id || !token) return res.status(400).json({ error: "Missing ID or token" });

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id }
        });

        if (!appointment) return res.status(404).json({ error: "Not found" });

        if (appointment.cancel_token_hash !== hash(token)) {
            return res.status(403).json({ error: "Invalid token" });
        }

        await prisma.appointment.update({
            where: { id },
            data: { status: 'cancelled' }
        });

        return res.status(200).json({ success: true });

    } catch (e) {
        logger.error("Cancel Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
