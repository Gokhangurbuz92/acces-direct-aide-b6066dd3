import { db } from '../../../src/db/index.js';
import { AuthToken, CitizenUser } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { checkRateLimit, getRateLimitStatus } from '../../_utils/rateLimit.js';
import { getClientIp, hashAuthToken, hashPassword } from '../../_utils/user-auth.js';

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');

  if (!token || password.length < 8) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const ip = getClientIp(req);
  const ipLimit = await checkRateLimit('RESET_USER', `ip:${ip}`);
  if (!ipLimit.allowed) {
    return res.status(getRateLimitStatus(ipLimit)).json(ipLimit.error || { error: 'Too many attempts' });
  }

  try {
    const tokenHash = hashAuthToken(token);
    const row = await db.query.AuthToken.findFirst({
      where: eq(AuthToken.tokenHash, tokenHash),
      with: { user: true },
    });

    if (!row || row.type !== 'PASSWORD_RESET' || row.usedAt || row.expiresAt <= new Date() || !row.user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const passwordHash = await hashPassword(password);

    // Sequential operations (neon-http driver doesn't support transactions)
    await db.update(CitizenUser).set({ passwordHash }).where(eq(CitizenUser.id, row.userId));
    await db.update(AuthToken).set({ usedAt: new Date() }).where(eq(AuthToken.id, row.id));

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Internal error' });
  }
}
