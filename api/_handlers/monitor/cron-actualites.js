import { randomUUID } from 'crypto';
import prisma from '../../_utils/prisma.js';
import { getActualitesCronFreshness } from '../../_utils/cron-freshness.js';
import { applyNoIndex } from '../../_utils/robots.js';

/**
 * Public uptime-friendly endpoint for external monitors.
 * Returns 200 only when cron "actualites" freshness is healthy.
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = typeof req.requestId === 'string' ? req.requestId : randomUUID();
  const freshness = await getActualitesCronFreshness(prisma);
  const isFresh = freshness.state === 'fresh';

  res.setHeader('x-request-id', requestId);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  applyNoIndex(res);

  return res.status(isFresh ? 200 : 503).json({
    ok: isFresh,
    job: 'actualites',
    state: freshness.state,
    ageMinutes: freshness.ageMinutes,
    lastSuccessAt: freshness.lastSuccessAt,
    thresholds: freshness.thresholds,
    requestId,
  });
}
