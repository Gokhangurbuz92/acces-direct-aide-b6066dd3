import logger from '../../_utils/logger.js';
import { env } from '../../_utils/env.js';
// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import { logProAudit } from '../../_utils/auth.js';
import { sendMail } from '../../_utils/mailer.js';

/**
 * sendEmailFallback — envoie un email de secours quand le SMS échoue.
 * Ne crash jamais — absorbe les erreurs silencieusement.
 */
async function sendEmailFallback(appointment, phoneNumber, smsMessage) {
    try {
        const beneficiaryEmail = appointment.beneficiaryEmail;
        if (!beneficiaryEmail) {
            logger.warn('[SMS-FALLBACK] Pas d\'email bénéficiaire pour le fallback');
            return;
        }

        await sendMail({
            to: beneficiaryEmail,
            subject: 'Rappel de votre rendez-vous — AccesDirectAide',
            text: `${smsMessage}\n\n(Ce message vous est envoyé car le rappel SMS n'a pas pu être délivré.)`,
            html: `<p>${smsMessage}</p><p style="color:#666;font-size:12px"><em>Ce message vous est envoyé car le rappel SMS n'a pas pu être délivré.</em></p>`,
            category: 'sms_fallback',
        });

        logger.info(`[SMS-FALLBACK] Email de secours envoyé à ${beneficiaryEmail}`);
    } catch (emailErr) {
        // Ne jamais crash le handler principal
        logger.error('[SMS-FALLBACK] Erreur email de secours:', emailErr.message);
    }
}
/**
 * SMS Notification API (Public)
 *
 * POST /api/public/sms-notify
 *
 * Registers an SMS reminder for an appointment. In production,
 * this connects to Twilio/Vonage. Currently logs via structured logger.
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

        // Send SMS via Twilio REST API (no SDK dependency)
        const twilioSid = env.twilio.sid;
        const twilioAuth = env.twilio.authToken;
        const twilioFrom = env.twilio.from;

        if (twilioSid && twilioAuth && twilioFrom) {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
            const twilioBody = new URLSearchParams({
                To: phoneNumber.replace(/\s/g, ''),
                From: twilioFrom,
                Body: message,
            });

            try {
                const twilioRes = await fetch(twilioUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: twilioBody.toString(),
                });

                if (!twilioRes.ok) {
                    const errBody = await twilioRes.text().catch(() => '');
                    let errCode = null;
                    try { errCode = JSON.parse(errBody)?.code; } catch { /* ignore */ }

                    // Graceful fallback for known Twilio errors
                    if (errCode === 20404) {
                        logger.error('[SMS] Twilio HORS CRÉDIT (20404) — bascule sur email de secours');
                    } else if (errCode === 21614 || errCode === 21211) {
                        logger.error(`[SMS] Numéro invalide Twilio (${errCode}): ${maskPhone(phoneNumber)}`);
                    } else {
                        logger.error(`[SMS] Twilio error (${twilioRes.status}, code=${errCode}): ${errBody.slice(0, 200)}`);
                    }

                    // Attempt email fallback
                    await sendEmailFallback(appointment, phoneNumber, message);
                } else {
                    const smsResult = await twilioRes.json();
                    logger.info(`[SMS] Sent to=${maskPhone(phoneNumber)} sid=${smsResult.sid}`);
                }
            } catch (twilioErr) {
                logger.error('[SMS] Twilio network error:', twilioErr.message);
                // Email fallback on network failure
                await sendEmailFallback(appointment, phoneNumber, message);
            }
        } else {
            logger.warn(`[SMS] Twilio not configured — message queued locally: ${maskPhone(phoneNumber)}`);
        }

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
