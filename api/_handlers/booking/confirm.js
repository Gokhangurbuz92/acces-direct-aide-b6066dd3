import logger from "../../_utils/logger.js";
import prisma from '../../_utils/prisma.js';
import { checkRateLimit } from '../_utils/rateLimit.js';
import { hash } from '../../lib/crypto.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    const identifier = req.headers['x-forwarded-for'] || '127.0.0.1';
    const limit = checkRateLimit('CONFIRM', identifier);

    if (!limit.allowed) {
        return res.status(429).json(limit.error);
    }

    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Missing token" });

    try {
        const tokenHash = hash(token);
        const appointment = await prisma.appointment.findFirst({
            where: { access_token_hash: tokenHash }
        });

        if (!appointment) {
            return res.status(404).json({ error: "Invalid or expired link" });
        }

        if (appointment.status === 'requested') {
            await prisma.appointment.update({
                where: { id: appointment.id },
                data: { status: 'confirmed' }
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Rendez-vous confirmé',
            appointmentId: appointment.id
        });

    } catch (e) {
        logger.error('Confirmation error:', e);
        return res.status(500).json({ error: "Internal error" });
    }
}
