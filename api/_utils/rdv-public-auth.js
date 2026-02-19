import prisma from './prisma.js';
import { getUserSessionTokenFromRequest, normalizeEmail, verifyUserSessionToken } from './user-auth.js';

/**
 * @typedef {{ id: string, email: string, emailVerifiedAt: Date | null }} CitizenUserSummary
 */

/**
 * @param {import('./http-types').ApiRequest} req
 * @returns {Promise<{ ok: true, user: CitizenUserSummary } | { ok: false, status: number, error: string, code?: string }>}
 */
export async function requireCitizenUser(req) {
  const sessionToken = getUserSessionTokenFromRequest(req);
  const claims = verifyUserSessionToken(sessionToken);
  if (!claims) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const user = await prisma.citizenUser.findUnique({
    where: { id: claims.userId },
    select: {
      id: true,
      email: true,
      emailVerifiedAt: true,
    },
  });

  if (!user || normalizeEmail(user.email) !== normalizeEmail(claims.email)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  if (!user.emailVerifiedAt) {
    return {
      ok: false,
      status: 403,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED',
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
    },
  };
}
