import crypto from 'crypto';
import { getCronAuth } from '../../_utils/cronAuth.js';
import { withLock } from '../../_utils/pipelineLock.js';
import { runIngestActualitesRss } from './ingest-actualites-rss.js';

/**
 * Stable cron endpoint for RSS/Atom news ingestion.
 *
 * Note: ingestion logic lives in `runIngestActualitesRss` (P5). This handler only
 * orchestrates auth/locking and must not change ingestion behavior.
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = getCronAuth(req);
  if (!auth.ok) {
    if (auth.reason === 'missing_secret') {
      return res.status(500).json({ error: 'CRON_SECRET is not configured' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const runId = crypto.randomUUID();
  const mode = req.query?.mode;
  const limitParam = req.query?.limit;
  const limit = limitParam
    ? Number.parseInt(String(limitParam), 10)
    : mode === 'smoke'
      ? 5
      : undefined;

  const startTime = Date.now();

  try {
    const stats = await withLock('ingest-actualites-rss', async () => {
      return await runIngestActualitesRss({ limit, runId });
    });

    return res.status(200).json({
      ok: true,
      source: 'actualites',
      runId,
      mode,
      limit: limit ?? null,
      durationMs: Date.now() - startTime,
      stats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already running')) {
      return res.status(409).json({ error: 'Pipeline already running', runId });
    }
    return res.status(500).json({ error: message, runId });
  }
}

