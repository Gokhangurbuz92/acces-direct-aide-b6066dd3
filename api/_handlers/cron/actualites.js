import crypto from 'crypto';
import { getCronAuth, getHeader } from '../../_utils/cronAuth.js';
import { withLock } from '../../_utils/pipelineLock.js';
import prisma from '../../_utils/prisma.js';
import { env } from '../../_utils/env.js';
import Sentry from '../../_utils/sentry.js';
import { kv } from '../../_utils/kv.js';
import { runIngestActualitesRss } from './ingest-actualites-rss.js';

const CRON_LOCK_KEY = 'cron:actualites:lock';
const CRON_LOCK_TTL_SECONDS = 15 * 60; // 15 minutes
const CRON_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Vercel Cron jobs cannot send custom Authorization headers. We accept the
 * default Vercel Cron user-agent in production only, and rely on KV + DB
 * throttling to make spoofing non-impactful.
 *
 * @param {import('../../_utils/http-types').ApiRequest} req
 */
function isAuthorizedByVercelCronUA(req) {
  if (env.runtime.vercelEnv !== 'production') return false;
  const ua = String(getHeader(req, 'user-agent') || '');
  return ua.startsWith('vercel-cron/');
}

/**
 * Attempt to acquire a coarse throttle lock to prevent endpoint flooding.
 *
 * Returns:
 * - true: acquired
 * - false: already locked
 * - null: KV unavailable (best-effort fallback)
 *
 * @param {string} runId
 * @returns {Promise<true | false | null>}
 */
async function tryAcquireCronLock(runId) {
  try {
    const result = await kv.set(CRON_LOCK_KEY, runId, { nx: true, ex: CRON_LOCK_TTL_SECONDS });
    return result != null;
  } catch {
    return null;
  }
}

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

  const runId = crypto.randomUUID();

  const auth = getCronAuth(req);
  if (!auth.ok && auth.reason === 'missing_secret') {
    return res.status(500).json({ error: 'CRON_SECRET is not configured' });
  }

  const vercelCronOk = isAuthorizedByVercelCronUA(req);
  if (!auth.ok && !vercelCronOk) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const requestId = typeof req.requestId === 'string' ? req.requestId : null;

  const lockState = await tryAcquireCronLock(runId);
  if (lockState === false) {
    return res.status(202).json({ ok: true, skipped: true, reason: 'locked', runId, requestId });
  }
  if (lockState === null) {
    try {
      Sentry.captureMessage('cron.lock.unavailable', {
        level: 'warning',
        tags: { cron: 'actualites', requestId: requestId ?? undefined },
      });
      await Sentry.flush(500);
    } catch {
      // best-effort
    }
  }

  const mode = req.query?.mode;
  const limitParam = req.query?.limit;
  const limit = limitParam
    ? Number.parseInt(String(limitParam), 10)
    : mode === 'smoke'
      ? 5
      : undefined;

  const startTime = Date.now();

  try {
    // Defense-in-depth: if KV is unavailable or the lock is manually cleared,
    // still avoid thrashing the ingestion pipeline too frequently.
    try {
      const lastSuccess = await prisma.cronRun.findFirst({
        where: { job: 'actualites', status: 'success' },
        orderBy: { startedAt: 'desc' },
        select: { startedAt: true },
      });

      if (lastSuccess) {
        const ageMs = Date.now() - lastSuccess.startedAt.getTime();
        if (ageMs >= 0 && ageMs < CRON_COOLDOWN_MS) {
          return res.status(202).json({ ok: true, skipped: true, reason: 'cooldown', runId, requestId });
        }
      }
    } catch {
      // best-effort; the cron will fail later anyway if DB is down.
    }

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
