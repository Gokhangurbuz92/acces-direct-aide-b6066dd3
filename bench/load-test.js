/**
 * k6 Load Test — Accès Direct Aide
 *
 * Validates that the Drizzle ORM migration + Fluid Compute architecture
 * maintains ultra-low latency under sustained load.
 *
 * Usage:
 *   k6 run bench/load-test.js                              # default: localhost:3000
 *   k6 run bench/load-test.js --env BASE_URL=https://staging.accesdirectaide.fr
 *   k6 run bench/load-test.js --env BASE_URL=https://preview-pr-42.vercel.app
 *
 * Install k6:  brew install k6  (macOS)  |  https://k6.io/docs/get-started/installation/
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Custom Metrics ──────────────────────────────────────────────
const aidesLatency = new Trend('aides_latency', true);
const slotsLatency = new Trend('slots_latency', true);
const errorRate = new Rate('errors');

// ── Configuration ───────────────────────────────────────────────
const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3000';

export const options = {
  // Ramping VUs: gradual increase → sustained peak → cool-down
  stages: [
    { duration: '15s', target: 20 },   // Warm-up: 0 → 20 VUs
    { duration: '30s', target: 50 },   // Ramp to peak: 20 → 50 VUs
    { duration: '30s', target: 50 },   // Sustained peak: hold 50 VUs
    { duration: '15s', target: 0 },    // Cool-down: 50 → 0 VUs
  ],
  thresholds: {
    // p95 latency must stay under 500ms for public routes
    aides_latency: ['p(95)<500'],
    // p95 latency must stay under 800ms for pro routes (auth overhead)
    slots_latency: ['p(95)<800'],
    // Error rate must stay under 5%
    errors: ['rate<0.05'],
    // Overall HTTP request duration p95 under 600ms
    http_req_duration: ['p(95)<600'],
  },
};

// ── Scenario ────────────────────────────────────────────────────
export default function () {
  // 1. Public route: GET /api/aides (list — heaviest public query)
  const aidesRes = http.get(`${BASE}/api/aides?page=1&pageSize=10`, {
    headers: { 'Accept': 'application/json' },
    tags: { name: 'GET /api/aides' },
  });
  aidesLatency.add(aidesRes.timings.duration);
  check(aidesRes, {
    'aides: status 200': (r) => r.status === 200,
    'aides: has items': (r) => {
      try { return JSON.parse(r.body).items !== undefined; }
      catch { return false; }
    },
  }) || errorRate.add(1);

  sleep(0.3); // Small pause between requests

  // 2. Public route: GET /api/search (semantic search if pgvector active)
  const searchRes = http.get(`${BASE}/api/search?q=aide+logement&limit=5`, {
    headers: { 'Accept': 'application/json' },
    tags: { name: 'GET /api/search' },
  });
  check(searchRes, {
    'search: status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.3);

  // 3. Public route: GET /api/structures (list)
  const structRes = http.get(`${BASE}/api/structures?page=1&pageSize=5`, {
    headers: { 'Accept': 'application/json' },
    tags: { name: 'GET /api/structures' },
  });
  check(structRes, {
    'structures: status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.3);

  // 4. Pro route: GET /api/pro/slots (requires auth — will get 401, measures routing overhead)
  const slotsRes = http.get(`${BASE}/api/pro/slots?date=2026-04-01`, {
    headers: { 'Accept': 'application/json' },
    tags: { name: 'GET /api/pro/slots' },
  });
  slotsLatency.add(slotsRes.timings.duration);
  check(slotsRes, {
    'slots: responds (200 or 401)': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  sleep(0.5); // Pace between iterations
}

// ── Summary ─────────────────────────────────────────────────────
export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 'N/A';
  const p99 = data.metrics.http_req_duration?.values?.['p(99)'] || 'N/A';
  const med = data.metrics.http_req_duration?.values?.med || 'N/A';
  const reqs = data.metrics.http_reqs?.values?.count || 0;
  const rate = data.metrics.http_reqs?.values?.rate || 0;

  const summary = `
╔══════════════════════════════════════════════════════╗
║          ACCÈS DIRECT AIDE — LOAD TEST RESULTS       ║
╠══════════════════════════════════════════════════════╣
║  Total Requests:  ${String(reqs).padStart(8)}                        ║
║  Requests/sec:    ${String(rate.toFixed(1)).padStart(8)}                        ║
║  Median latency:  ${String(Math.round(med)).padStart(5)} ms                        ║
║  p95 latency:     ${String(Math.round(p95)).padStart(5)} ms                        ║
║  p99 latency:     ${String(Math.round(p99)).padStart(5)} ms                        ║
╚══════════════════════════════════════════════════════╝
`;
  console.log(summary);
  return {
    stdout: summary,
  };
}
