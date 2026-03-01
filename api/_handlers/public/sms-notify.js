import logger from '../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { logProAudit } from '../../lib/pro-auth.js';

/**
 * SMS Notification API (Public)
 *
 * POST /api/public/sms-notify
 *
 * Registers an SMS reminder for an appointment. In production,
 * this connects to Twilio/Vonage. Currently logs to console.
 *
 * Body:
 * - appointmentId: string
 * - phoneNumber: string (French format)
 * - action: 'subscribe' | 'unsubscribe'
 */

// Mask phone for audit: 06 12 34 56 78 → 06 ** ** ** 78
function maskPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '****';
    return digits.slice(0, 2) + ' ** ** ** ' + digits.slice(-2);
}

// French phone regex
const FRENCH_PHONE_RE = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.\-]*\d{2}){4}$/;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { appointmentId, phoneNumber, action = 'subscribe' } = req.body || {};

    if (!appointmentId || !phoneNumber) {
        return res.status(400).json({ error: 'appointmentId et phoneNumber requis.' });
    }

    if (!FRENCH_PHONE_RE.test(phoneNumber)) {
        return res.status(400).json({ error: 'Numéro de téléphone français invalide.' });
    }

    try {
        const appointment = await prisma.proAppointment.findUnique({
            where: { id: appointmentId },
            include: {
                service: { select: { label: true, mode: true } },
                createdByProUser: { select: { firstName: true, lastName: true } },
            },
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Rendez-vous introuvable.' });
        }

        if (action === 'unsubscribe') {
            // Remove phone from appointment
            await prisma.proAppointment.update({
                where: { id: appointmentId },
                data: { beneficiaryPhone: null },
            });

            return res.status(200).json({ ok: true, message: 'Rappel SMS désactivé.' });
        }

        // Subscribe: store phone on the appointment
        await prisma.proAppointment.update({
            where: { id: appointmentId },
            data: { beneficiaryPhone: phoneNumber.replace(/\s/g, '') },
        });

        // Format message for logging (production: send via Twilio)
        const proName = appointment.createdByProUser
            ? `${appointment.createdByProUser.firstName} ${(appointment.createdByProUser.lastName || '')[0]}.`
            : 'votre accompagnateur';

        const dateStr = new Date(appointment.startAt).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });

        const mode =
            appointment.service?.mode === 'visio'
                ? 'Lien visio dans votre Passeport'
                : 'CCAS Strasbourg';

        const message = `Rappel ADA : Votre RDV avec ${proName} est prévu le ${dateStr}. ${mode}.`;

        // In production, replace with: await twilio.messages.create(...)
        logger.info(`[SMS QUEUED → ${maskPhone(phoneNumber)}]: ${message}`);

        // Audit
        const ip = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        await logProAudit('SMS_REMINDER_SUBSCRIBED', 'citizen', '', {
            appointmentId,
            phoneMasked: maskPhone(phoneNumber),
        }, ip).catch(() => { });

        return res.status(200).json({
            ok: true,
            message: 'Rappel SMS activé. Vous recevrez un rappel 2h avant le RDV.',
        });
    } catch (error) {
        logger.error('[SMS] Erreur:', error.message);
        return res.status(500).json({ error: "Échec de l'activation du rappel SMS." });
    }
}
