import prisma from '../../_utils/prisma.js';
import { hashAuthToken, normalizeNextPath, redirect } from '../../_utils/user-auth.js';

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {string} key
 * @returns {string}
 */
function getQueryParam(req, key) {
  const direct = req?.query?.[key];
  if (typeof direct === 'string') return direct;
  if (Array.isArray(direct) && typeof direct[0] === 'string') return direct[0];

  try {
    const url = new URL(req.url || '', 'http://localhost');
    return String(url.searchParams.get(key) || '');
  } catch {
    return '';
  }
}

/**
 * @param {string} status
 * @param {string} nextPath
 * @returns {string}
 */
function buildUiRedirect(status, nextPath) {
  const safeNext = normalizeNextPath(nextPath, '/annuaire');
  return `/auth/verify-email?status=${encodeURIComponent(status)}&next=${encodeURIComponent(safeNext)}`;
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = String(getQueryParam(req, 'token') || '').trim();
  const nextPath = getQueryParam(req, 'next');

  if (!token) {
    return redirect(res, buildUiRedirect('invalid', nextPath), 302);
  }

  try {
    const tokenHash = hashAuthToken(token);
    const tokenRow = await prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRow || tokenRow.type !== 'EMAIL_VERIFY' || !tokenRow.user) {
      return redirect(res, buildUiRedirect('invalid', nextPath), 302);
    }

    if (tokenRow.usedAt || tokenRow.expiresAt <= new Date()) {
      return redirect(res, buildUiRedirect('expired', nextPath), 302);
    }

    await prisma.$transaction([
      prisma.authToken.update({
        where: { id: tokenRow.id },
        data: { usedAt: new Date() },
      }),
      prisma.citizenUser.update({
        where: { id: tokenRow.user.id },
        data: { emailVerifiedAt: tokenRow.user.emailVerifiedAt || new Date() },
      }),
    ]);

    return redirect(res, buildUiRedirect('success', nextPath), 302);
  } catch {
    return redirect(res, buildUiRedirect('error', nextPath), 302);
  }
}

