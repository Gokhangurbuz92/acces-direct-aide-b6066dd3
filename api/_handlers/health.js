import { randomUUID } from 'crypto';
import { env, getEnv } from '../_utils/env.js';

/**
 * Public minimal health endpoint (no dependency checks, no leaks).
 *
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = typeof req.requestId === 'string' ? req.requestId : randomUUID();
  res.setHeader('x-request-id', requestId);
  res.setHeader('Cache-Control', 'no-store');

  const release = getEnv('VERCEL_GIT_COMMIT_SHA') || null;
  const vercelEnv = getEnv('VERCEL_ENV') || getEnv('NODE_ENV') || env.runtime.vercelEnv;

  if (req.method === 'HEAD') {
    res.status(200).end();
    return;
  }

  return res.status(200).json({
    ok: true,
    service: 'acces-direct-aide',
    time: new Date().toISOString(),
    vercelEnv,
    release,
    requestId,
  });
}
