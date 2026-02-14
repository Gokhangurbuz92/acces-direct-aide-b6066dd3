
import prisma from '../../../_utils/prisma.js';
import crypto from 'crypto';
import { hash } from '../../../lib/crypto.js';

import { checkRateLimit } from '../../../lib/pro-auth.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ error: "Missing ID" });

    // Rate Limit (IP based)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const limit = await checkRateLimit(`confirm:${ip}`);
    if (!limit.allowed) return res.status(429).json({ error: "Too many attempts" });

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { service: true, structure: true }
        });

        if (!appointment) return res.status(404).json({ error: "Appointment not found" });

        // Check status
        if (appointment.status === 'confirmed') {
            return res.status(200).json({ status: 'confirmed' });
        }

        if (appointment.status !== 'locked') {
            return res.status(400).json({ error: `Cannot confirm appointment with status ${appointment.status}` });
        }

        // Check Expiry
        if (new Date() > new Date(appointment.lock_expires_at)) {
            await prisma.appointment.update({
                where: { id: appointmentId },
                data: { status: 'expired' }
            });
            return res.status(410).json({ error: "Lock expired" });
        }

        // Generate Cancel Token
        const cancelToken = crypto.randomBytes(32).toString('hex');
        const cancelTokenHash = hash(cancelToken);

        // Confirm
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: 'confirmed',
                cancel_token_hash: cancelTokenHash
            }
        });

        // Send Email (Mocked for now as per Lot 5 MVP, user says "console" if resend disabled)
        console.log(`📧 SEND EMAIL to Beneficiary: Booking Confirmed for ${appointment.start_at}.`);
        console.log(`🔗 Cancel Link: /cancel?token=${cancelToken}`);

        // Audit
        await prisma.auditLog.create({
            data: {
                action: 'BOOK_CONFIRMED',
                actor: 'beneficiary',
                entity: 'Appointment',
                entity_id: appointmentId,
                details: { structureId: appointment.structureId }
            }
        });

        return res.status(200).json({
            success: true,
            status: 'confirmed',
            cancelToken // Start of cancellation link
        });

    } catch (e) {
        console.error("Confirm API Error", e);
        return res.status(500).json({ error: "Confirmation failed" });
    }
}
