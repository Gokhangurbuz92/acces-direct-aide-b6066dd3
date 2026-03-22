import { resolveAuthContext } from '../../_utils/auth.js';
import { getMetrics } from '../../lib/gemini-metrics.js';
import { applyNoIndex } from '../../_utils/robots.js';

/**
 * Admin-only endpoint to view AI metrics.
 * GET /api/admin/ai-metrics
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  applyNoIndex(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = resolveAuthContext(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const metrics = await getMetrics();
  return res.status(200).json(metrics);
}
