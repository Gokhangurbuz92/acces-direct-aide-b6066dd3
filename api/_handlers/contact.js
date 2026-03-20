import { sendMail } from '../_utils/mailer.js';
import { env } from '../_utils/env.js';
import logger from '../_utils/logger.js';

/**
 * POST /api/contact
 *
 * Receives a contact form submission and sends it via Mailjet
 * to the admin inbox (contact@accesdirectaide.fr).
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-csrf-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nom, email, sujet, message, page_concernee } = req.body || {};

    // Validation
    if (!email || !sujet || !message) {
      return res.status(400).json({
        error: 'Champs obligatoires manquants',
        details: 'email, sujet et message sont requis.',
      });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Format email invalide' });
    }

    // Rate-limit basic: message length
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message trop long (max 5000 caractères)' });
    }

    // Build email content
    const sujetLabels = {
      question: "Question",
      signalement_erreur: "Signalement d'erreur",
      suggestion: "Suggestion",
      partenariat: "Proposition de partenariat",
      autre: "Autre",
    };

    const sujetLabel = sujetLabels[sujet] || sujet;
    const nomDisplay = nom?.trim() || 'Anonyme';
    const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

    const textContent = [
      `📩 Nouveau message de contact — ${sujetLabel}`,
      ``,
      `De : ${nomDisplay} (${email})`,
      `Date : ${timestamp}`,
      `Sujet : ${sujetLabel}`,
      page_concernee ? `Page concernée : ${page_concernee}` : null,
      ``,
      `--- Message ---`,
      message,
      ``,
      `--- Fin du message ---`,
      `Pour répondre, répondez directement à ${email}.`,
    ].filter(Boolean).join('\n');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e293b; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">📩 Nouveau message de contact</h2>
          <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">${sujetLabel}</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <table style="width: 100%; font-size: 14px; margin-bottom: 16px;">
            <tr><td style="padding: 4px 8px; color: #64748b;">De</td><td style="padding: 4px 8px;"><strong>${nomDisplay}</strong> &lt;${email}&gt;</td></tr>
            <tr><td style="padding: 4px 8px; color: #64748b;">Date</td><td style="padding: 4px 8px;">${timestamp}</td></tr>
            <tr><td style="padding: 4px 8px; color: #64748b;">Sujet</td><td style="padding: 4px 8px;">${sujetLabel}</td></tr>
            ${page_concernee ? `<tr><td style="padding: 4px 8px; color: #64748b;">Page</td><td style="padding: 4px 8px;"><a href="${page_concernee}">${page_concernee}</a></td></tr>` : ''}
          </table>
          <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
${message}
          </div>
          <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
            Pour répondre, envoyez un email à <a href="mailto:${email}">${email}</a>.
          </p>
        </div>
      </div>
    `.trim();

    // Send email to admin inbox
    const adminEmail = env.contactEmail || 'contact@accesdirectaide.fr';
    const result = await sendMail({
      to: adminEmail,
      subject: `[Contact] ${sujetLabel} — ${nomDisplay}`,
      text: textContent,
      html: htmlContent,
      category: 'contact-form',
    });

    logger.info(`[contact] Form submitted from=${email} sujet=${sujet} delivered=${result.delivered}`);

    // Send confirmation to the user
    if (result.delivered) {
      await sendMail({
        to: email,
        subject: 'Votre message a bien été reçu — Accès Direct Aide',
        text: `Bonjour ${nomDisplay},\n\nNous avons bien reçu votre message concernant "${sujetLabel}".\nNotre équipe s'engage à vous répondre sous 48 à 72h ouvrées.\n\nCordialement,\nL'équipe Accès Direct Aide\ncontact@accesdirectaide.fr`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e293b; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0; font-size: 18px;">✅ Message bien reçu</h2>
            </div>
            <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Bonjour <strong>${nomDisplay}</strong>,</p>
              <p>Nous avons bien reçu votre message concernant <strong>"${sujetLabel}"</strong>.</p>
              <p>Notre équipe s'engage à vous répondre sous <strong>48 à 72h ouvrées</strong>.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
              <p style="color: #64748b; font-size: 13px;">Cordialement,<br/>L'équipe Accès Direct Aide<br/><a href="mailto:contact@accesdirectaide.fr">contact@accesdirectaide.fr</a></p>
            </div>
          </div>
        `.trim(),
        category: 'contact-confirmation',
      });
    }

    return res.status(200).json({ ok: true, delivered: result.delivered });

  } catch (err) {
    logger.error('[contact] Error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}
