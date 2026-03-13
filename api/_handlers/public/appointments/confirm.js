import logger from '../../../_utils/logger.js';
import { db } from '../../../../src/db/index.js';
import { Appointment, AuditLog } from '../../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { hash } from '../../../lib/crypto.js';

import { checkRateLimit } from '../../../_utils/auth.js';
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
        const appointment = await db.query.Appointment.findFirst({
            where: eq(Appointment.id, appointmentId),
            with: { service: true, structure: true }
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
            await db.update(Appointment).set({ status: 'expired' }).where(eq(Appointment.id, appointmentId));
            return res.status(410).json({ error: "Lock expired" });
        }

        // Generate Cancel Token
        const cancelToken = crypto.randomBytes(32).toString('hex');
        const cancelTokenHash = hash(cancelToken);

        // Confirm
        await db.update(Appointment).set({
                status: 'confirmed',
                cancel_token_hash: cancelTokenHash
        }).where(eq(Appointment.id, appointmentId));

        // Send Email (Mocked for now as per Lot 5 MVP, user says "console" if resend disabled)
        logger.info(`📧 SEND EMAIL to Beneficiary: Booking Confirmed for ${appointment.start_at}.`);
        logger.info(`🔗 Cancel Link: /cancel?token=${cancelToken}`);

        // Audit
        await db.insert(AuditLog).values({
                action: 'BOOK_CONFIRMED',
                actorId: 'beneficiary', // actor instead of actorId in older models maybe? AuditLog schema has actorId
                entityType: 'Appointment',
                entityId: appointmentId,
                details: JSON.stringify({ structureId: appointment.structureId }) // Convert to JSON string
        });

        return res.status(200).json({
            success: true,
            status: 'confirmed',
            cancelToken // Start of cancellation link
        });

    } catch (e) {
        logger.error("Confirm API Error", e);
        return res.status(500).json({ error: "Confirmation failed" });
    }
}
