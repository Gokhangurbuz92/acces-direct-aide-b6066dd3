import crypto from 'crypto';
import { getCronAuth } from '../../_utils/cronAuth.js';
import { withLock } from '../../_utils/pipelineLock.js';
import prisma from '../../_utils/prisma.js';
import { env } from '../../_utils/env.js';
import Sentry from '../../_utils/sentry.js';
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
  const requestId = typeof req.requestId === 'string' ? req.requestId : null;

  try {
    /** @type {string | null} */
    let cronRunId = null;

    const stats = await withLock('ingest-actualites-rss', async () => {
      const created = await prisma.cronRun.create({
        data: {
          job: 'actualites',
          status: 'running',
          requestId,
          vercelEnv: env.runtime.vercelEnv,
          release: env.sentry.release,
          metrics: {
            runId,
            mode: mode ?? null,
            limit: limit ?? null,
          },
        },
        select: { id: true },
      });

      cronRunId = created.id;

      try {
        const result = await runIngestActualitesRss({ limit, runId });
        const durationMs = Date.now() - startTime;

        await prisma.cronRun.update({
          where: { id: created.id },
          data: {
            status: 'success',
            finishedAt: new Date(),
            durationMs,
            metrics: {
              runId,
              mode: mode ?? null,
              limit: limit ?? null,
              fetched: result?.fetched ?? null,
              processed: result?.processed ?? null,
              created: result?.created ?? null,
              updated: result?.updated ?? null,
              skippedExisting: result?.skippedExisting ?? null,
              errorCount: Array.isArray(result?.errors) ? result.errors.length : null,
            },
          },
        });

        return result;
      } catch (err) {
        const durationMs = Date.now() - startTime;
        const message = err instanceof Error ? err.message : String(err);

        await prisma.cronRun.update({
          where: { id: created.id },
          data: {
            status: 'failed',
            finishedAt: new Date(),
            durationMs,
            errorSample: message.slice(0, 500),
            metrics: {
              runId,
              mode: mode ?? null,
              limit: limit ?? null,
            },
          },
        });

        throw err;
      }
    });

    return res.status(200).json({
      ok: true,
      source: 'actualites',
      runId,
      mode,
      limit: limit ?? null,
      durationMs: Date.now() - startTime,
      stats,
      cronRunId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already running')) {
      return res.status(409).json({ error: 'Pipeline already running', runId });
    }

    try {
      Sentry.captureException(err, {
        tags: {
          cron: 'actualites',
          runId,
          requestId: requestId ?? undefined,
        },
      });
      await Sentry.flush(2000);
    } catch {
      // best-effort
    }
    return res.status(500).json({ error: message, runId });
  }
}
