import logger from '../../_utils/logger.js';
import { getCronAuth, getHeader } from '../../_utils/cronAuth.js';
import { env } from '../../_utils/env.js';
import { kv } from '../../_utils/kv.js';
import { db } from '../../../src/db/index.js';
import { sql } from 'drizzle-orm';
import { CronRun } from '../../../src/db/schema.js';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'crypto';

/**
 * Health Alert Cron — automated health monitoring with alerting.
 *
 * Checks:
 *   1. DB connectivity (SELECT 1)
 *   2. KV connectivity
 *   3. Last ingestion freshness (< 48h)
 *
 * Alert delivery:
 *   - Sentry (via console.error → Sentry captures)
 *   - Optional webhook (ALERT_WEBHOOK_URL env var)
 *   - Alert log in KV for admin dashboard
 *
 * Anti-spam: same alert type suppressed for 1 hour via KV.
 *
 * Schedule: every 5 minutes (vercel.json)
 * Auth: CRON_SECRET or Vercel cron UA
 */

const ALERT_COOLDOWN_SECONDS = 3600; // 1 hour anti-spam
const FRESHNESS_THRESHOLD_HOURS = 48;
const MAX_ALERT_LOG = 50;

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 */
function isAuthorizedByVercelCronUA(req) {
    if (env.runtime.vercelEnv !== 'production') return false;
    const ua = String(getHeader(req, 'user-agent') || '');
    return ua.startsWith('vercel-cron/');
}

/**
 * @param {string} name
 * @param {string} message
 * @param {Record<string, any>} details
 */
async function fireAlert(name, message, details = {}) {
    const alertKey = `alert:cooldown:${name}`;

    // Anti-spam: check if this alert type was already fired recently
    const existing = await kv.get(alertKey);
    if (existing) {
        logger.info({ name }, '[HEALTH-ALERT] Alert suppressed (cooldown active)');
        return false;
    }

    // Set cooldown
    await kv.set(alertKey, Date.now(), { ex: ALERT_COOLDOWN_SECONDS });

    const alert = {
        name,
        message,
        severity: 'critical',
        timestamp: new Date().toISOString(),
        details,
    };

    // 1. Log to Sentry via console.error (Sentry auto-captures)
    console.error(`[HEALTH-ALERT] 🔴 ${name}: ${message}`, JSON.stringify(details));
    Sentry.captureMessage(`🔴 HEALTH ALERT: ${name} — ${message}`, {
        level: 'fatal',
        extra: details,
    });

    // 2. Optional webhook (Slack, Discord, Teams, etc.)
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `🔴 *HEALTH ALERT* — ${name}\n${message}\n${JSON.stringify(details, null, 2)}`,
                    ...alert,
                }),
                signal: AbortSignal.timeout(5000),
            });
        } catch (err) {
            logger.warn({ err: err?.message }, '[HEALTH-ALERT] Webhook delivery failed');
        }
    }

    // 3. Store in KV alert log for admin dashboard
    try {
        const logKey = 'alert:log';
        const existingLog = (await kv.get(logKey)) || [];
        const log = [alert, ...existingLog].slice(0, MAX_ALERT_LOG);
        await kv.set(logKey, log);
    } catch {
        // KV might be the thing that's down
    }

    logger.error({ alert }, '[HEALTH-ALERT] Alert fired');
    return true;
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    const requestId = typeof req.requestId === 'string' ? req.requestId : randomUUID();

    res.setHeader('x-request-id', requestId);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed', requestId });
    }

    const auth = getCronAuth(req);
    const vercelCronOk = isAuthorizedByVercelCronUA(req);

    if (!auth.ok && auth.reason === 'missing_secret') {
        return res.status(500).json({ error: 'CRON_SECRET is not configured', requestId });
    }
    if (!auth.ok && !vercelCronOk) {
        return res.status(401).json({ error: 'Unauthorized', requestId });
    }

    const checks = {};
    let alertCount = 0;

    // Check 1: Database connectivity
    try {
        const start = Date.now();
        await db.execute(sql`SELECT 1`);
        checks.db = { ok: true, durationMs: Date.now() - start };
    } catch (err) {
        checks.db = { ok: false, error: err?.message };
        if (await fireAlert('db.down', 'Database is unreachable', { error: err?.message })) {
            alertCount++;
        }
    }

    // Check 2: KV connectivity
    try {
        const start = Date.now();
        await kv.set('health-alert:ping', Date.now(), { ex: 60 });
        const val = await kv.get('health-alert:ping');
        checks.kv = { ok: val !== null, durationMs: Date.now() - start };
        if (!checks.kv.ok) {
            if (await fireAlert('kv.down', 'KV store is unreachable')) {
                alertCount++;
            }
        }
    } catch (err) {
        checks.kv = { ok: false, error: err?.message };
        if (await fireAlert('kv.down', 'KV store is unreachable', { error: err?.message })) {
            alertCount++;
        }
    }

    // Check 3: Ingestion freshness (last successful cron < 48h)
    try {
        const result = await db.select({
            maxStartedAt: sql`MAX(${CronRun.startedAt})`,
        }).from(CronRun).where(sql`${CronRun.status} = 'success' AND ${CronRun.job} IN ('INGEST_AIDS', 'ACTUALITES', 'ingest-aids', 'actualites')`);

        const lastIngestion = result[0]?.maxStartedAt;
        if (lastIngestion) {
            const ageHours = (Date.now() - new Date(lastIngestion).getTime()) / (1000 * 60 * 60);
            checks.ingestionFreshness = { ok: ageHours < FRESHNESS_THRESHOLD_HOURS, ageHours: Math.round(ageHours), lastIngestion };

            if (ageHours >= FRESHNESS_THRESHOLD_HOURS) {
                if (await fireAlert('ingestion.stale', `Last successful ingestion was ${Math.round(ageHours)}h ago (threshold: ${FRESHNESS_THRESHOLD_HOURS}h)`, { ageHours: Math.round(ageHours), lastIngestion })) {
                    alertCount++;
                }
            }
        } else {
            checks.ingestionFreshness = { ok: false, message: 'No successful ingestion found' };
        }
    } catch (err) {
        checks.ingestionFreshness = { ok: false, error: err?.message };
    }

    const allOk = Object.values(checks).every(c => c.ok);

    return res.status(allOk ? 200 : 503).json({
        ok: allOk,
        requestId,
        checkedAt: new Date().toISOString(),
        alertsFired: alertCount,
        checks,
    });
}
