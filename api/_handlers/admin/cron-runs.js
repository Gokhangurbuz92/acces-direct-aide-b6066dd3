import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';

/**
 * @param {string | undefined} url
 * @param {string | undefined} host
 * @returns {string | null}
 */
function extractIdFromPath(url, host = 'localhost') {
  if (!url) return null;
  try {
    const urlObj = new URL(url, `https://${host}`);
    const pathname = urlObj.pathname || '';
    const match = pathname.match(/^\/(?:api\/)?admin\/cron-runs\/([^/?#]+)/);
    if (!match) return null;
    const raw = decodeURIComponent(match[1] || '').trim();
    return raw || null;
  } catch {
    return null;
  }
}

/**
 * Admin: list cron runs + detail (protected by ADMIN_TOKEN).
 *
 * Routes:
 * - GET /api/admin/cron-runs?job=actualites&limit=50
 * - GET /api/admin/cron-runs/:id
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin Token Required' });
  }

  const id = extractIdFromPath(req.url, req.headers?.host);
  if (id) {
    const item = await prisma.cronRun.findUnique({
      where: { id },
    });

    if (!item) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({ item });
  }

  const job = req.query?.job ? String(req.query.job) : undefined;
  const rawLimit = req.query?.limit ? Number.parseInt(String(req.query.limit), 10) : 50;
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;

  const items = await prisma.cronRun.findMany({
    where: job ? { job } : undefined,
    orderBy: { startedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      job: true,
      status: true,
      startedAt: true,
      durationMs: true,
      metrics: true,
    },
  });

  return res.status(200).json({ items });
}

