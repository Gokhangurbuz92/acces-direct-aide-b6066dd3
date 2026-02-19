import { buildUserSessionCookieClear } from '../../_utils/user-auth.js';

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Set-Cookie', buildUserSessionCookieClear());
  return res.status(200).json({ ok: true });
}

