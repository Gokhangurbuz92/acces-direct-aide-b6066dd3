import crypto from 'crypto';
import logger from '../../../_utils/logger.js';
import prisma from '../../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';
import { logProAudit } from '../../../lib/pro-auth.js';
import { sendMail } from '../../../_utils/mailer.js';

/**
 * POST /api/pro/appointments/start-visio
 *
 * Generates a unique Jitsi room for a ProAppointment,
 * marks it as visio-enabled, and emails the citizen a join link.
 *
 * Body: { appointmentId: string }
 *
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { appointmentId } = req.body || {};
    if (!appointmentId) {
        return res.status(400).json({ error: 'appointmentId is required' });
    }

    try {
        // 1. Fetch appointment with structure isolation
        const appointment = await prisma.proAppointment.findFirst({
            where: {
                id: appointmentId,
                structureId: proCtx.structureId,
            },
            include: {
                service: { select: { name: true } },
                citizenUser: { select: { email: true, first_name: true } },
            },
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Rendez-vous introuvable' });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ error: 'Impossible de lancer une visio pour un rendez-vous annulé' });
        }

        // 2. Generate or reuse room ID
        const roomId = appointment.visioRoomId || `ada-${crypto.randomUUID()}`;

        // 3. Update appointment
        await prisma.proAppointment.update({
            where: { id: appointmentId },
            data: {
                visioRoomId: roomId,
                visioEnabled: true,
                visioStartedAt: appointment.visioStartedAt || new Date(),
            },
        });

        // 4. Email the citizen if we have their email
        const citizenEmail = appointment.citizenUser?.email || appointment.citizenEmailSnapshot;
        const citizenName = appointment.citizenUser?.first_name || appointment.beneficiaryName || 'Madame/Monsieur';
        let emailSent = false;

        if (citizenEmail) {
            const visioUrl = `https://meet.jit.si/ADA-${roomId}`;
            const serviceName = appointment.service?.name || 'votre rendez-vous';

            const result = await sendMail({
                to: citizenEmail,
                subject: 'Votre visioconférence est prête — AccesDirectAide',
                category: 'visio_invite',
                text: `Bonjour ${citizenName},\n\nVotre agent a préparé la salle de visioconférence pour ${serviceName}.\n\nRejoignez l'appel ici : ${visioUrl}\n\nCordialement,\nAccesDirectAide`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;">
                        <div style="background: #0f766e; padding: 24px; border-radius: 12px 12px 0 0;">
                            <h2 style="color: white; margin: 0; font-size: 18px;">Votre visioconférence est prête</h2>
                        </div>
                        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                            <p>Bonjour <strong>${citizenName}</strong>,</p>
                            <p>Votre agent a préparé la salle de visioconférence pour <strong>${serviceName}</strong>.</p>
                            <div style="text-align: center; margin: 24px 0;">
                                <a href="${visioUrl}"
                                   style="display: inline-block; padding: 14px 28px; background: #0f766e; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                                    Rejoindre l'appel vidéo
                                </a>
                            </div>
                            <p style="font-size: 12px; color: #94a3b8;">
                                Si le bouton ne fonctionne pas, copiez ce lien :<br>
                                <a href="${visioUrl}" style="color: #0f766e;">${visioUrl}</a>
                            </p>
                        </div>
                    </div>`,
            });
            emailSent = result.delivered;
        }

        await logProAudit('VISIO_STARTED', proCtx.userId, proCtx.structureId, {
            appointmentId,
            roomId,
            emailSent,
        }, req.headers['x-forwarded-for']);

        return res.status(200).json({
            success: true,
            roomId,
            emailSent,
            visioUrl: `https://meet.jit.si/ADA-${roomId}`,
        });
    } catch (e) {
        logger.error('[start-visio] Error:', e);
        return res.status(500).json({ error: 'Échec du lancement de la visio' });
    }
}

export default requireProAuth(handler);
