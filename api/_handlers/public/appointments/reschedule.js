import logger from '../../../_utils/logger.js';
import prisma from '../../../_utils/prisma.js';
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
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { service: { select: { duration_minutes: true } } },
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
        const conflict = await prisma.appointment.findFirst({
            where: {
                id: { not: id },
                structureId: appointment.structureId,
                status: { in: ['confirmed', 'locked'] },
                start_at: { lt: newEnd },
                end_at: { gt: newDate },
            },
        });

        if (conflict) {
            return res.status(409).json({ error: 'Ce créneau est déjà occupé.' });
        }

        // Update the appointment
        await prisma.appointment.update({
            where: { id },
            data: {
                start_at: newDate,
                end_at: newEnd,
                status: 'confirmed',
            },
        });

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
