import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { CitizenUser, AuthToken } from '../../../src/db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import { checkRateLimit, getRateLimitStatus } from '../../_utils/rateLimit.js';
import { sendMail } from '../../_utils/mailer.js';
import { templates } from '../../lib/email-service.js';
import {
  buildAppUrl,
  generateAuthToken,
  getClientIp,
  hashAuthToken,
  hashPassword,
  isValidEmail,
  normalizeEmail,
  normalizeNextPath,
  normalizePhone,
} from '../../_utils/user-auth.js';

const VERIFY_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL for stricter security

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const phone = normalizePhone(req.body?.phone);
  const nextPath = normalizeNextPath(req.body?.next, '/annuaire');

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  // Password policy: 8+ chars, at least 1 uppercase, 1 lowercase, 1 digit
  const pwErrors = [];
  if (!password || password.length < 8) pwErrors.push('8 caractères minimum');
  if (!/[A-Z]/.test(password)) pwErrors.push('1 majuscule requise');
  if (!/[a-z]/.test(password)) pwErrors.push('1 minuscule requise');
  if (!/[0-9]/.test(password)) pwErrors.push('1 chiffre requis');
  if (pwErrors.length > 0) {
    return res.status(400).json({
      error: 'Mot de passe trop faible',
      details: pwErrors,
    });
  }

  const ip = getClientIp(req);
  const ipLimit = await checkRateLimit('SIGNUP_USER', `ip:${ip}`);
  if (!ipLimit.allowed) {
    return res.status(getRateLimitStatus(ipLimit)).json(ipLimit.error || { error: 'Too many attempts' });
  }
  const emailLimit = await checkRateLimit('SIGNUP_USER', `email:${email}`);
  if (!emailLimit.allowed) {
    return res.status(getRateLimitStatus(emailLimit)).json(emailLimit.error || { error: 'Too many attempts' });
  }

  try {
    let user = await db.query.CitizenUser.findFirst({ where: eq(CitizenUser.email, email) });

    if (!user) {
      const passwordHash = await hashPassword(password);
      const [newUser] = await db.insert(CitizenUser).values({
          email,
          passwordHash,
          phone: phone || null,
      }).returning();
      user = newUser;
    }

    if (user.emailVerifiedAt) {
      return res.status(200).json({
        ok: true,
        message: "Si l'email est valide, un lien a été envoyé.",
      });
    }

    const rawToken = generateAuthToken();
    const tokenHash = hashAuthToken(rawToken);
    const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

    // Sequential operations (neon-http driver doesn't support transactions)
    await db.update(AuthToken).set({ usedAt: new Date() }).where(
      and(
        eq(AuthToken.userId, user.id),
        eq(AuthToken.type, 'EMAIL_VERIFY'),
        isNull(AuthToken.usedAt)
      )
    );
    await db.insert(AuthToken).values({
        userId: user.id,
        type: 'EMAIL_VERIFY',
        tokenHash,
        expiresAt,
    });

    const verifyUrl = buildAppUrl(`/api/auth/verify-email?token=${encodeURIComponent(rawToken)}&next=${encodeURIComponent(nextPath)}`);
    const text = [
      'Confirmez votre adresse email pour activer votre compte Acces Direct Aide.',
      '',
      `Lien de verification: ${verifyUrl}`,
      '',
      "Si vous n'etes pas a l'origine de cette demande, ignorez cet email.",
    ].join('\n');

    const emailTemplate = templates.welcome(email.split('@')[0], rawToken);

    await sendMail({
      to: email,
      subject: emailTemplate.subject,
      text,
      html: emailTemplate.html,
      category: 'email_verify',
    });

    return res.status(200).json({
      ok: true,
      message: "Si l'email est valide, un lien a été envoyé.",
    });
  } catch (err) {
    const message = String(err?.message || '');
    // Duplicate email: don't leak account existence — return same generic OK
    if (message.includes('unique') || message.includes('duplicate')) {
      return res.status(200).json({ ok: true, message: "Si l'email est valide, un lien a été envoyé." });
    }
    logger.error({ err, email }, '[signup] Registration failed');
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}
