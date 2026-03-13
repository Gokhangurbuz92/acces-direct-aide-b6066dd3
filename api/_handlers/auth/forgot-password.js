import { db } from '../../../src/db/index.js';
import { CitizenUser, AuthToken } from '../../../src/db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import { checkRateLimit, getRateLimitStatus } from '../../_utils/rateLimit.js';
import { sendMail } from '../../_utils/mailer.js';
import {
  buildAppUrl,
  generateAuthToken,
  getClientIp,
  hashAuthToken,
  isValidEmail,
  normalizeEmail,
} from '../../_utils/user-auth.js';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL for stricter security

const GENERIC_RESPONSE = {
  ok: true,
  message: "Si l'email est valide, un lien a été envoyé.",
};

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    return res.status(200).json(GENERIC_RESPONSE);
  }

  const ip = getClientIp(req);
  const ipLimit = await checkRateLimit('FORGOT_USER', `ip:${ip}`);
  if (!ipLimit.allowed) {
    return res.status(getRateLimitStatus(ipLimit)).json(ipLimit.error || { error: 'Too many attempts' });
  }
  const emailLimit = await checkRateLimit('FORGOT_USER', `email:${email}`);
  if (!emailLimit.allowed) {
    return res.status(getRateLimitStatus(emailLimit)).json(emailLimit.error || { error: 'Too many attempts' });
  }

  try {
    const user = await db.query.CitizenUser.findFirst({ where: eq(CitizenUser.email, email) });
    if (!user) {
      return res.status(200).json(GENERIC_RESPONSE);
    }

    const rawToken = generateAuthToken();
    const tokenHash = hashAuthToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await db.transaction(async (tx) => {
      await tx.update(AuthToken).set({ usedAt: new Date() }).where(
        and(
          eq(AuthToken.userId, user.id),
          eq(AuthToken.type, 'PASSWORD_RESET'),
          isNull(AuthToken.usedAt)
        )
      );
      await tx.insert(AuthToken).values({
          userId: user.id,
          type: 'PASSWORD_RESET',
          tokenHash,
          expiresAt,
      });
    });

    const resetUrl = buildAppUrl(`/auth/reset?token=${encodeURIComponent(rawToken)}`);
    await sendMail({
      to: email,
      subject: 'Reinitialisation du mot de passe',
      text: `Lien de reinitialisation: ${resetUrl}`,
      category: 'password_reset',
    });

    return res.status(200).json(GENERIC_RESPONSE);
  } catch {
    return res.status(500).json({ error: 'Internal error' });
  }
}
