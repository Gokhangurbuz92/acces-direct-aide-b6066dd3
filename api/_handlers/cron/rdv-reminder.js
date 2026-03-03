import logger from '../../_utils/logger.js';
// @ts-nocheck
import { getCronAuth } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import { sendMail } from '../../_utils/mailer.js';
import { createNotification } from '../../_handlers/pro/notifications.js';

/**
 * Cron: RDV J-1 Reminder
 *
 * GET /api/cron/rdv-reminder
 *
 * Runs daily (08:00 UTC). Finds all ProAppointments scheduled
 * for tomorrow and sends email reminders to:
 *   1. The beneficiary (if email available via SharedDiagnostic)
 *   2. The pro agent (for their own preparation)
 *
 * Also creates in-app ProNotification for the agent.
 */
export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Auth: CRON_SECRET or Vercel Cron UA
    const auth = getCronAuth(req);
    const ua = String(req.headers?.['user-agent'] || '');
    const isVercelCron = ua.startsWith('vercel-cron/') && process.env.VERCEL_ENV === 'production';

    if (!auth.ok && !isVercelCron) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Find appointments for tomorrow (J+1)
        const now = new Date();
        const tomorrowStart = new Date(now);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);

        const appointments = await prisma.proAppointment.findMany({
            where: {
                startAt: {
                    gte: tomorrowStart,
                    lte: tomorrowEnd,
                },
                status: { in: ['confirmed', 'pending'] },
            },
            include: {
                createdByProUser: {
                    select: {
                        id: true,
                        email: true,
                        structureId: true,
                        notificationEmailEnabled: true,
                    },
                },
            },
        });

        if (appointments.length === 0) {
            return res.status(200).json({
                ok: true,
                message: 'Aucun RDV prévu demain.',
                reminders: 0,
            });
        }

        let emailsSent = 0;
        let notificationsCreated = 0;
        const errors = [];

        for (const rdv of appointments) {
            const agent = rdv.createdByProUser;
            if (!agent) continue;

            const rdvDate = new Date(rdv.startAt);
            const dateStr = rdvDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            });
            const timeStr = rdvDate.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            });

            // 1. Send email to agent (if enabled)
            if (agent.notificationEmailEnabled && agent.email) {
                try {
                    await sendMail({
                        to: agent.email,
                        subject: `📅 Rappel RDV demain — ${dateStr} à ${timeStr}`,
                        text: `Bonjour,\n\nVous avez un rendez-vous prévu demain :\n\n📅 Date : ${dateStr}\n🕐 Heure : ${timeStr}\n📝 Type : ${rdv.type || 'Rendez-vous'}\n📍 Mode : ${rdv.mode || 'En personne'}\n\nConnectez-vous à AccesDirectAide pour voir les détails.\n\nCordialement,\nL'équipe AccesDirectAide`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #4F46E5;">📅 Rappel de rendez-vous</h2>
                                <p>Bonjour,</p>
                                <p>Vous avez un rendez-vous prévu <strong>demain</strong> :</p>
                                <table style="background: #F8FAFC; border-radius: 8px; padding: 16px; width: 100%; margin: 16px 0;">
                                    <tr><td style="padding: 8px; color: #64748B;">📅 Date</td><td style="padding: 8px; font-weight: bold;">${dateStr}</td></tr>
                                    <tr><td style="padding: 8px; color: #64748B;">🕐 Heure</td><td style="padding: 8px; font-weight: bold;">${timeStr}</td></tr>
                                    <tr><td style="padding: 8px; color: #64748B;">📝 Type</td><td style="padding: 8px;">${rdv.type || 'Rendez-vous'}</td></tr>
                                    <tr><td style="padding: 8px; color: #64748B;">📍 Mode</td><td style="padding: 8px;">${rdv.mode || 'En personne'}</td></tr>
                                </table>
                                <p style="color: #64748B; font-size: 12px;">— L'équipe AccesDirectAide</p>
                            </div>
                        `,
                        category: 'rdv-reminder',
                    });
                    emailsSent++;
                } catch (err) {
                    errors.push({ rdvId: rdv.id, error: err.message });
                }
            }

            // 2. Create in-app notification for agent
            try {
                await createNotification({
                    userId: agent.id,
                    structureId: agent.structureId,
                    type: 'rdv_new',
                    title: `RDV demain à ${timeStr}`,
                    message: `Vous avez un ${rdv.type || 'rendez-vous'} prévu demain ${dateStr} à ${timeStr}.`,
                    metadata: {
                        appointmentId: rdv.id,
                        startAt: rdv.startAt,
                    },
                });
                notificationsCreated++;
            } catch (err) {
                errors.push({ rdvId: rdv.id, type: 'notification', error: err.message });
            }
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CRON_RDV_REMINDER',
                entityId: 'system',
                entityType: 'CRON',
                details: JSON.stringify({
                    appointmentsFound: appointments.length,
                    emailsSent,
                    notificationsCreated,
                    errors: errors.length,
                }),
                ipHash: 'CRON',
            },
        }).catch(() => { });

        logger.info({
            appointmentsFound: appointments.length,
            emailsSent,
            notificationsCreated,
            errors: errors.length,
        }, '[Cron] RDV J-1 reminder completed');

        return res.status(200).json({
            ok: true,
            appointmentsFound: appointments.length,
            emailsSent,
            notificationsCreated,
            errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
        });
    } catch (error) {
        logger.error({ err: error }, '[Cron] RDV reminder failed');
        return res.status(500).json({ error: 'Cron RDV reminder failed.' });
    }
}
