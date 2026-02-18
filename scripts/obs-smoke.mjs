#!/usr/bin/env node

import { fetch } from 'undici';

/**
 * @param {string} value
 * @returns {string}
 */
function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

/**
 * @param {string} name
 * @param {string} fallback
 * @returns {string}
 */
function getEnvOrDefault(name, fallback) {
  const raw = process.env[name];
  if (typeof raw === 'string' && raw.trim()) return trimTrailingSlash(raw.trim());
  return trimTrailingSlash(fallback);
}

/**
 * @param {string} name
 * @param {number} fallback
 * @returns {number}
 */
function getIntEnvOrDefault(name, fallback) {
  const raw = process.env[name];
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  const parsed = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function ok(message) {
  console.log(`✅ ${message}`);
}

/**
 * @param {string[]} failures
 * @param {string} message
 */
function fail(failures, message) {
  failures.push(message);
  console.error(`❌ ${message}`);
}

function warn(message) {
  console.warn(`⚠️ ${message}`);
}

/**
 * @param {string} raw
 * @returns {string}
 */
function normalizeHeader(raw) {
  return String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * @param {string} url
 * @param {number} timeoutMs
 */
async function getJson(url, timeoutMs) {
  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(timeoutMs),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    // best-effort only
  }

  return { response, json };
}

async function main() {
  const prodUrl = getEnvOrDefault('PROD_URL', 'https://www.accesdirectaide.fr');
  const timeoutMs = getIntEnvOrDefault('TIMEOUT_MS', 8000);
  const cronSecret = typeof process.env.CRON_SECRET === 'string' && process.env.CRON_SECRET.trim()
    ? process.env.CRON_SECRET.trim()
    : null;
  /** @type {string[]} */
  const failures = [];

  console.log(`[obs-smoke] PROD_URL=${prodUrl}`);
  console.log(`[obs-smoke] TIMEOUT_MS=${timeoutMs}`);

  // 1) core monitor (strict)
  try {
    const { response, json } = await getJson(`${prodUrl}/api/monitor/core`, timeoutMs);
    if (response.status !== 200) {
      fail(failures, `/api/monitor/core attendu HTTP=200, recu HTTP=${response.status}`);
    } else if (!json || typeof json !== 'object' || json.ok !== true) {
      fail(failures, '/api/monitor/core payload invalide (ok=true attendu)');
    } else {
      ok('/api/monitor/core HTTP=200');
    }
  } catch {
    fail(failures, '/api/monitor/core requête impossible');
  }

  // 2) cron freshness monitor (200 fresh / 503 stale-missing-error)
  try {
    const { response, json } = await getJson(`${prodUrl}/api/monitor/cron/actualites`, timeoutMs);
    if (response.status !== 200 && response.status !== 503) {
      fail(failures, `/api/monitor/cron/actualites status inattendu HTTP=${response.status}`);
    } else {
      const state = json && typeof json === 'object' ? json.state : 'unknown';
      if (response.status === 200) {
        ok(`/api/monitor/cron/actualites fresh (state=${state})`);
      } else {
        warn(`/api/monitor/cron/actualites degraded (HTTP=503, state=${state})`);
      }
    }
  } catch {
    fail(failures, '/api/monitor/cron/actualites requête impossible');
  }

  // 3) health no-store
  try {
    const response = await fetch(`${prodUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const cacheControl = normalizeHeader(response.headers.get('cache-control'));
    if (response.status !== 200) {
      fail(failures, `/api/health attendu HTTP=200, recu HTTP=${response.status}`);
    } else if (!cacheControl.includes('no-store')) {
      fail(failures, '/api/health Cache-Control no-store manquant');
    } else {
      ok('/api/health HTTP=200 + Cache-Control no-store');
    }
  } catch {
    fail(failures, '/api/health requête impossible');
  }

  // 4) data quality monitor (200 or 503 acceptable)
  try {
    const { response, json } = await getJson(`${prodUrl}/api/monitor/data-quality`, timeoutMs);
    if (response.status !== 200 && response.status !== 503) {
      fail(failures, `/api/monitor/data-quality status inattendu HTTP=${response.status}`);
    } else if (
      !json ||
      typeof json !== 'object' ||
      typeof json.ok !== 'boolean' ||
      typeof json.requestId !== 'string' ||
      !json.metrics ||
      !json.thresholds
    ) {
      fail(failures, '/api/monitor/data-quality payload invalide');
    } else if (response.status === 200) {
      ok('/api/monitor/data-quality healthy (HTTP=200)');
    } else {
      warn('/api/monitor/data-quality degraded (HTTP=503)');
    }
  } catch {
    fail(failures, '/api/monitor/data-quality requête impossible');
  }

  // 5) ingestion freshness monitor (200 or 503 acceptable)
  try {
    const { response, json } = await getJson(`${prodUrl}/api/monitor/ingestion-freshness`, timeoutMs);
    if (response.status !== 200 && response.status !== 503) {
      fail(failures, `/api/monitor/ingestion-freshness status inattendu HTTP=${response.status}`);
    } else if (
      !json ||
      typeof json !== 'object' ||
      typeof json.ok !== 'boolean' ||
      typeof json.requestId !== 'string' ||
      !('latestFetchedAt' in json) ||
      !('ageHours' in json) ||
      typeof json.thresholdHours !== 'number'
    ) {
      fail(failures, '/api/monitor/ingestion-freshness payload invalide');
    } else if (response.status === 200) {
      ok('/api/monitor/ingestion-freshness healthy (HTTP=200)');
    } else {
      warn('/api/monitor/ingestion-freshness degraded (HTTP=503)');
    }
  } catch {
    fail(failures, '/api/monitor/ingestion-freshness requête impossible');
  }

  // 6) noindex headers for technical endpoints
  const noIndexTargets = [
    `${prodUrl}/api/monitor/core`,
    `${prodUrl}/api/monitor/data-quality`,
    `${prodUrl}/api/monitor/ingestion-freshness`,
    `${prodUrl}/api/health`,
  ];
  for (const url of noIndexTargets) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(timeoutMs),
      });
      const robotsTag = normalizeHeader(response.headers.get('x-robots-tag'));
      if (robotsTag !== 'noindex, nofollow') {
        fail(failures, `${url} x-robots-tag invalide (${robotsTag || 'absent'})`);
      } else {
        ok(`${url} x-robots-tag OK`);
      }
    } catch {
      fail(failures, `${url} requête impossible`);
    }
  }

  // 7) cron review queue scan (optional, requires CRON_SECRET in terminal)
  if (!cronSecret) {
    warn('CRON_SECRET absent: skip /api/cron/review-queue/scan');
  } else {
    try {
      const response = await fetch(`${prodUrl}/api/cron/review-queue/scan`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${cronSecret}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ limitPerType: 25 }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      let json = null;
      try {
        json = await response.json();
      } catch {
        // best-effort only
      }

      if (response.status !== 200) {
        fail(failures, `/api/cron/review-queue/scan attendu HTTP=200, recu HTTP=${response.status}`);
      } else if (
        !json ||
        typeof json !== 'object' ||
        json.ok !== true ||
        typeof json.requestId !== 'string' ||
        !json.summary ||
        typeof json.summary !== 'object'
      ) {
        fail(failures, '/api/cron/review-queue/scan payload invalide');
      } else {
        ok('/api/cron/review-queue/scan HTTP=200');
      }
    } catch {
      fail(failures, '/api/cron/review-queue/scan requête impossible');
    }
  }

  if (failures.length > 0) {
    console.error(`[obs-smoke] FAILED (${failures.length} verification(s) critique(s))`);
    process.exit(1);
  }

  console.log('[obs-smoke] OK');
}

main().catch(() => {
  console.error('[obs-smoke] FAILED (unexpected error)');
  process.exit(1);
});
