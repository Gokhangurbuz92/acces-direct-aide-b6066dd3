import logger from '../../../_utils/logger.js';
import { db } from '../../../../src/db/index.js';
import { ProAppointment } from '../../../../src/db/schema.js';
import { eq, and, ne, inArray, lt, gt } from 'drizzle-orm';
import { hash } from '../../../lib/crypto.js';
/**
 * Appointment Reschedule (Public)
 *
 * PUT /api/appointments/reschedule
 * Body: { token, newStartAt }
 *
 * Allows a citizen to reschedule their appointment via the secure
 * token link sent in the confirmation email.
 */
export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;
    const { token, newStartAt } = req.body || {};

    if (!id || !token || !newStartAt) {
        return res.status(400).json({ error: 'Missing id, token, or newStartAt' });
    }

    const newDate = new Date(newStartAt);
    if (isNaN(newDate.getTime()) || newDate <= new Date()) {
        return res.status(400).json({ error: 'La nouvelle date doit être dans le futur.' });
    }

    try {
        const appointment = await db.query.Appointment.findFirst({
            where: eq(Appointment.id, id),
            with: { service: { columns: { duration_minutes: true } } },
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Rendez-vous introuvable.' });
        }

        if (appointment.cancel_token_hash !== hash(token)) {
            return res.status(403).json({ error: 'Token invalide.' });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ error: 'Ce rendez-vous a déjà été annulé.' });
        }

        // Calculate new end time based on service duration
        const durationMs = (appointment.service?.duration_minutes || 60) * 60000;
        const newEnd = new Date(newDate.getTime() + durationMs);

        // Check for conflicts in the same structure
        const conflict = await db.query.Appointment.findFirst({
            where: and(
                ne(Appointment.id, id),
                eq(Appointment.structureId, appointment.structureId),
                inArray(Appointment.status, ['confirmed', 'locked']),
                lt(Appointment.start_at, newEnd),
                gt(Appointment.end_at, newDate)
            ),
        });

        if (conflict) {
            return res.status(409).json({ error: 'Ce créneau est déjà occupé.' });
        }

        // Update the appointment
        await db.update(Appointment).set({
                start_at: newDate,
                end_at: newEnd,
                status: 'confirmed',
        }).where(eq(Appointment.id, id));

        logger.info(`[Reschedule] Appointment ${id} rescheduled to ${newStartAt}`);

        return res.status(200).json({
            success: true,
            newStartAt: newDate.toISOString(),
            newEndAt: newEnd.toISOString(),
        });
    } catch (error) {
        logger.error('[Reschedule] Error:', error.message);
        return res.status(500).json({ error: 'Erreur interne.' });
    }
}
