/**
 * Email Service — Transactional email delivery via Resend.
 *
 * Falls back to console logging when RESEND_API_KEY is not configured,
 * allowing local development without an email provider.
 *
 * Usage:
 *   import { sendEmail, templates } from './email-service.js';
 *   await sendEmail({ to: 'user@example.com', ...templates.welcome('Alice', verifyUrl) });
 */

import logger from '../_utils/logger.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM || 'Accès Direct Aide <notifications@accesdirectaide.fr>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.accesdirectaide.fr';

/**
 * Send a transactional email.
 *
 * @param {{ to: string | string[], subject: string, html: string, text?: string }} params
 * @returns {Promise<{ id: string, success: boolean }>}
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!RESEND_API_KEY) {
    logger.warn({
      msg: 'EMAIL_MOCK — RESEND_API_KEY not configured',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
    });
    return { id: `mock-${Date.now()}`, success: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || stripHtml(html),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    logger.error({ msg: 'EMAIL_SEND_FAILED', status: response.status, error: data });
    throw new Error(data.message || `Resend error: ${response.status}`);
  }

  logger.info({ msg: 'EMAIL_SENT', id: data.id, to: Array.isArray(to) ? to[0] : to });
  return { id: data.id, success: true };
}

/**
 * Strip HTML tags for plain text fallback.
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

// ─────────────────────────────────────────────
// Email Templates
// ─────────────────────────────────────────────

const FOOTER = `
  <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="font-size: 11px; color: #999; text-align: center;">
    Accès Direct Aide — Plateforme d'aide sociale inclusive<br>
    Ceci est un message automatique, merci de ne pas y répondre.
  </p>
`;

/**
 * @param {string} content - Main HTML content
 * @returns {string} - Wrapped in branded email layout
 */
function wrapTemplate(content) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 24px; text-align: center;">
        <h1 style="color: white; font-size: 20px; font-weight: 700; margin: 0;">Accès Direct Aide</h1>
      </div>
      <div style="padding: 32px 24px;">
        ${content}
      </div>
      ${FOOTER}
    </div>
  `;
}

function ctaButton(text, url) {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
        ${text}
      </a>
    </div>
    <p style="font-size: 11px; color: #999; text-align: center;">
      Si le bouton ne fonctionne pas, copiez ce lien :<br>
      <a href="${url}" style="color: #2563eb; word-break: break-all;">${url}</a>
    </p>
  `;
}

export const templates = {
  /**
   * Welcome / email verification.
   * @param {string} name
   * @param {string} verificationToken
   */
  welcome(name, verificationToken) {
    const url = `${APP_URL}/auth/verify?token=${verificationToken}`;
    return {
      subject: 'Bienvenue sur Accès Direct Aide — Vérifiez votre email',
      html: wrapTemplate(`
        <h2 style="color: #1e293b; font-size: 22px;">Bienvenue, ${name} !</h2>
        <p style="color: #475569; line-height: 1.6;">
          Merci de vous être inscrit sur Accès Direct Aide. Pour accéder à votre espace personnel
          et bénéficier de toutes les fonctionnalités, veuillez vérifier votre adresse email :
        </p>
        ${ctaButton('Vérifier mon adresse email', url)}
        <p style="color: #94a3b8; font-size: 12px;">Ce lien expire dans 24 heures.</p>
      `),
    };
  },

  /**
   * Password reset.
   * @param {string} name
   * @param {string} resetToken
   */
  resetPassword(name, resetToken) {
    const url = `${APP_URL}/auth/reset-password?token=${resetToken}`;
    return {
      subject: 'Réinitialisation de votre mot de passe — Accès Direct Aide',
      html: wrapTemplate(`
        <h2 style="color: #1e293b; font-size: 22px;">Réinitialisation du mot de passe</h2>
        <p style="color: #475569; line-height: 1.6;">
          Bonjour ${name},<br><br>
          Vous avez demandé la réinitialisation de votre mot de passe.
          Cliquez sur le bouton ci-dessous pour en choisir un nouveau :
        </p>
        ${ctaButton('Réinitialiser mon mot de passe', url)}
        <p style="color: #94a3b8; font-size: 12px;">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      `),
    };
  },

  /**
   * Appointment confirmation.
   * @param {{ name: string, service: string, date: string, time: string, mode: string, reference: string }} params
   */
  appointmentConfirmation({ name, service, date, time, mode, reference }) {
    return {
      subject: `Rendez-vous confirmé — ${service}`,
      html: wrapTemplate(`
        <h2 style="color: #1e293b; font-size: 22px;">Rendez-vous confirmé ✓</h2>
        <p style="color: #475569; line-height: 1.6;">
          Bonjour ${name}, votre rendez-vous est bien enregistré :
        </p>
        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #94a3b8; font-size: 12px;">Service</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${service}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8; font-size: 12px;">Date</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${date} à ${time}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8; font-size: 12px;">Mode</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${mode === 'VIDEO' ? 'Visioconférence' : 'Sur place'}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8; font-size: 12px;">Référence</td><td style="padding: 6px 0; font-family: monospace; font-weight: 600; color: #1e293b;">${reference}</td></tr>
          </table>
        </div>
        ${ctaButton('Voir mes rendez-vous', `${APP_URL}/compte/rdv`)}
      `),
    };
  },

  /**
   * Appointment reminder (24h before).
   * @param {{ name: string, service: string, date: string, time: string }} params
   */
  appointmentReminder({ name, service, date, time }) {
    return {
      subject: `Rappel — RDV demain à ${time}`,
      html: wrapTemplate(`
        <h2 style="color: #1e293b; font-size: 22px;">Rappel de rendez-vous</h2>
        <p style="color: #475569; line-height: 1.6;">
          Bonjour ${name},<br><br>
          Vous avez un rendez-vous <strong>${service}</strong> prévu demain
          <strong>${date}</strong> à <strong>${time}</strong>.
        </p>
        ${ctaButton('Accéder à mon espace', `${APP_URL}/compte/rdv`)}
      `),
    };
  },
};
