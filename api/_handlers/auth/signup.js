import prisma from '../../_utils/prisma.js';
import { checkRateLimit, getRateLimitStatus } from '../../_utils/rateLimit.js';
import { sendMail } from '../../_utils/mailer.js';
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

  if (!isValidEmail(email) || password.length < 8) {
    return res.status(400).json({ error: 'Invalid input' });
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
    let user = await prisma.citizenUser.findUnique({ where: { email } });

    if (!user) {
      const passwordHash = await hashPassword(password);
      user = await prisma.citizenUser.create({
        data: {
          email,
          passwordHash,
          phone: phone || null,
        },
      });
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

    await prisma.$transaction([
      prisma.authToken.updateMany({
        where: {
          userId: user.id,
          type: 'EMAIL_VERIFY',
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      prisma.authToken.create({
        data: {
          userId: user.id,
          type: 'EMAIL_VERIFY',
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const verifyUrl = buildAppUrl(`/api/auth/verify-email?token=${encodeURIComponent(rawToken)}&next=${encodeURIComponent(nextPath)}`);
    const text = [
      'Confirmez votre adresse email pour activer votre compte Acces Direct Aide.',
      '',
      `Lien de verification: ${verifyUrl}`,
      '',
      "Si vous n'etes pas a l'origine de cette demande, ignorez cet email.",
    ].join('\n');

    await sendMail({
      to: email,
      subject: 'Verification de votre compte',
      text,
      category: 'email_verify',
    });

    return res.status(200).json({
      ok: true,
      message: "Si l'email est valide, un lien a été envoyé.",
    });
  } catch {
    return res.status(500).json({ error: 'Internal error' });
  }
}
