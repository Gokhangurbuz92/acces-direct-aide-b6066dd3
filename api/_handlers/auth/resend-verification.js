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
  normalizeNextPath,
} from '../../_utils/user-auth.js';

const VERIFY_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

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
  const nextPath = normalizeNextPath(req.body?.next, '/annuaire');
  if (!isValidEmail(email)) {
    return res.status(200).json(GENERIC_RESPONSE);
  }

  const ip = getClientIp(req);
  const ipLimit = await checkRateLimit('RESEND_VERIFY', `ip:${ip}`);
  if (!ipLimit.allowed) {
    return res.status(getRateLimitStatus(ipLimit)).json(ipLimit.error || { error: 'Too many attempts' });
  }

  try {
    const user = await db.query.CitizenUser.findFirst({ where: eq(CitizenUser.email, email) });
    if (!user || user.emailVerifiedAt) {
      return res.status(200).json(GENERIC_RESPONSE);
    }

    const rawToken = generateAuthToken();
    const tokenHash = hashAuthToken(rawToken);
    const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

    await db.transaction(async (tx) => {
      await tx.update(AuthToken).set({ usedAt: new Date() }).where(
        and(
          eq(AuthToken.userId, user.id),
          eq(AuthToken.type, 'EMAIL_VERIFY'),
          isNull(AuthToken.usedAt)
        )
      );
      await tx.insert(AuthToken).values({
          userId: user.id,
          type: 'EMAIL_VERIFY',
          tokenHash,
          expiresAt,
      });
    });

    const verifyUrl = buildAppUrl(`/api/auth/verify-email?token=${encodeURIComponent(rawToken)}&next=${encodeURIComponent(nextPath)}`);
    await sendMail({
      to: email,
      subject: 'Verification de votre compte',
      text: `Lien de verification: ${verifyUrl}`,
      category: 'email_verify',
    });

    return res.status(200).json(GENERIC_RESPONSE);
  } catch {
    return res.status(500).json({ error: 'Internal error' });
  }
}
