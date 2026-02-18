import { env } from './env.js';

/**
 * @param {Date | null | undefined} value
 * @returns {string | null}
 */
function toIso(value) {
  return value instanceof Date ? value.toISOString() : null;
}

/**
 * @param {Date} lastSuccessAt
 * @param {number} nowMs
 * @returns {number}
 */
function computeAgeMinutes(lastSuccessAt, nowMs) {
  return Math.max(0, Math.floor((nowMs - lastSuccessAt.getTime()) / 60000));
}

/**
 * Build freshness status for the "actualites" cron job from CronRun history.
 *
 * @param {import('@prisma/client').PrismaClient} prismaClient
 * @param {{ nowMs?: number }} [options]
 */
export async function getActualitesCronFreshness(prismaClient, options = {}) {
  const staleMinutes = env.cron.actualitesStaleMinutes;
  const failMinutes = Math.max(env.cron.actualitesFailMinutes, staleMinutes);
  const nowMs = typeof options.nowMs === 'number' ? options.nowMs : Date.now();

  const thresholds = { staleMinutes, failMinutes };

  try {
    const [lastSuccess, lastRun] = await Promise.all([
      prismaClient.cronRun.findFirst({
        where: { job: 'actualites', status: 'success' },
        orderBy: { startedAt: 'desc' },
        select: { startedAt: true },
      }),
      prismaClient.cronRun.findFirst({
        where: { job: 'actualites' },
        orderBy: { startedAt: 'desc' },
        select: { startedAt: true, status: true },
      }),
    ]);

    const lastSuccessAt = lastSuccess?.startedAt ?? null;
    const lastRunAt = lastRun?.startedAt ?? null;
    const lastStatus = lastRun?.status ?? null;

    if (!lastSuccessAt) {
      return {
        ok: false,
        state: 'missing',
        lastSuccessAt: null,
        lastRunAt: toIso(lastRunAt),
        lastStatus,
        ageMinutes: null,
        thresholds,
      };
    }

    const ageMinutes = computeAgeMinutes(lastSuccessAt, nowMs);

    if (ageMinutes >= failMinutes) {
      return {
        ok: false,
        state: 'error',
        lastSuccessAt: toIso(lastSuccessAt),
        lastRunAt: toIso(lastRunAt),
        lastStatus,
        ageMinutes,
        thresholds,
      };
    }

    if (ageMinutes >= staleMinutes) {
      return {
        ok: false,
        state: 'stale',
        lastSuccessAt: toIso(lastSuccessAt),
        lastRunAt: toIso(lastRunAt),
        lastStatus,
        ageMinutes,
        thresholds,
      };
    }

    return {
      ok: true,
      state: 'fresh',
      lastSuccessAt: toIso(lastSuccessAt),
      lastRunAt: toIso(lastRunAt),
      lastStatus,
      ageMinutes,
      thresholds,
    };
  } catch {
    return {
      ok: false,
      state: 'error',
      lastSuccessAt: null,
      lastRunAt: null,
      lastStatus: null,
      ageMinutes: null,
      thresholds,
    };
  }
}

