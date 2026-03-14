import logger from '../_utils/logger.js';
import { randomUUID } from 'crypto';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { db } from '../../src/db/index.js';
import { sql } from 'drizzle-orm';
import { env } from '../_utils/env.js';
import { verifyAdmin } from '../_utils/auth.js';
import { getCronAuth } from '../_utils/cronAuth.js';
import { getActualitesCronFreshness } from '../_utils/cron-freshness.js';
import { kv } from '../_utils/kv.js';
import Sentry from '../_utils/sentry.js';

const TIMEOUT_MS = 2000;

function isProdLike() {
  return env.runtime.vercelEnv === 'production' || env.runtime.vercelEnv === 'preview';
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label}_timeout`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(t);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(t);
        reject(err);
      });
  });
}

async function checkDb() {
  const start = Date.now();
  try {
    await withTimeout(db.execute(sql`SELECT 1`), TIMEOUT_MS, 'db');
    return { ok: true, durationMs: Date.now() - start };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const detail = message.includes('timeout') ? 'timeout' : 'query_failed';
    return { ok: false, durationMs: Date.now() - start, detail };
  }
}

/**
 * @param {string} requestId
 */
async function checkKv(requestId) {
  const start = Date.now();
  const configured = Boolean(env.kv.url && env.kv.token);

  if (!configured) {
    if (isProdLike()) {
      return { ok: false, durationMs: 0, detail: 'not_configured' };
    }
    return { ok: 'skipped', durationMs: 0, detail: 'not_configured' };
  }

  try {
    const testKey = `health:deep:${requestId}`;
    await withTimeout(kv.set(testKey, 'ok', { ex: 10 }), TIMEOUT_MS, 'kv_set');
    const value = await withTimeout(kv.get(testKey), TIMEOUT_MS, 'kv_get');
    await withTimeout(kv.del(testKey), TIMEOUT_MS, 'kv_del');

    const ok = value === 'ok';
    return { ok, durationMs: Date.now() - start, detail: ok ? undefined : 'unexpected_value' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const detail = message.includes('timeout') ? 'timeout' : 'request_failed';
    return { ok: false, durationMs: Date.now() - start, detail };
  }
}

async function checkStorage() {
  const start = Date.now();
  const endpoint = env.storage.endpoint;
  const bucket = env.storage.bucket;
  const accessKeyId = env.storage.accessKeyId;
  const secretAccessKey = env.storage.secretAccessKey;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return { ok: 'skipped', durationMs: 0, detail: 'not_configured' };
  }

  try {
    const client = new S3Client({
      region: env.storage.region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    await withTimeout(
      client.send(
        new HeadBucketCommand({
          Bucket: bucket,
        }),
      ),
      TIMEOUT_MS,
      'storage_head_bucket',
    );

    return { ok: true, durationMs: Date.now() - start };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const detail = message.includes('timeout') ? 'timeout' : 'request_failed';
    return { ok: false, durationMs: Date.now() - start, detail };
  }
}

/**
 * Deep health endpoint (protected): checks DB/KV/Storage with strict timeouts.
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

  const adminConfigured = Boolean(env.secrets.adminToken);
  const cronConfigured = Boolean(env.secrets.cronSecret);
  if (!adminConfigured && !cronConfigured) {
    return res.status(500).json({ error: 'No health auth configured', requestId });
  }

  const isAdmin = adminConfigured ? verifyAdmin(req) : false;
  const isCron = cronConfigured ? getCronAuth(req).ok : false;
  if (!isAdmin && !isCron) {
    return res.status(401).json({ error: 'Unauthorized', requestId });
  }

  const dbCheck = await checkDb();
  const kvCheck = await checkKv(requestId);
  const storage = await checkStorage();
  const cronActualites = await getActualitesCronFreshness();
  const cronHardFail = cronActualites.state === 'error';

  const geminiKeyPresent = Boolean(env.ai.geminiKey);

  const overallOk =
    dbCheck.ok === true &&
    (kvCheck.ok === true || kvCheck.ok === 'skipped') &&
    (storage.ok === true || storage.ok === 'skipped') &&
    !cronHardFail;

  const payload = {
    ok: overallOk,
    requestId,
    deps: {
      db: dbCheck,
      kv: kvCheck,
      storage,
      cron: {
        actualites: cronActualites,
      },
      geminiKeyPresent,
      sentry: {
        dsnPresent: Boolean(env.sentry.dsn),
        environment: env.runtime.vercelEnv,
        release: env.sentry.release,
      },
    },
  };

  if (!overallOk) {
    logger.warn(
      {
        requestId,
        db: dbCheck.ok,
        kv: kvCheck.ok,
        storage: storage.ok,
        cronActualitesState: cronActualites.state,
      },
      'health.deep.failed',
    );

    try {
      Sentry.captureMessage('health.deep.failed', {
        level: 'warning',
        tags: {
          requestId,
          route: 'health/deep',
        },
      });
      await Sentry.flush(2000);
    } catch {
      // best-effort
    }
  }

  if (req.method === 'HEAD') {
    res.status(overallOk ? 200 : 503).end();
    return;
  }

  return res.status(overallOk ? 200 : 503).json(payload);
}
