#!/usr/bin/env node

/**
 * Vercel build entrypoint (safe).
 *
 * Goals:
 * - Keep `npm run build` unchanged for local dev (vite build + prerender + sitemap).
 * - On Vercel: run `vite build` always. Only run prerender + sitemap on PRODUCTION
 *   (preview/branch deployments skip SSR prerender to avoid build timeouts).
 * - Run Drizzle schema push automatically in **production only**.
 * - Never print environment values (DB URLs, tokens, DSNs, etc).
 *
 * Expected Vercel setup:
 * - Build Command: `npm run vercel-build`
 */

import { execSync } from 'node:child_process';

/**
 * @param {string} cmd
 */
function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

const vercelEnv = String(process.env.VERCEL_ENV || '').trim() || 'unknown';
const isProduction = vercelEnv === 'production';

console.log(`[vercel-build] start (VERCEL_ENV=${vercelEnv})`);

// Schema migrations are handled separately via the db-migrate-deploy workflow.
// Do NOT run drizzle-kit push here — it requires interactive confirmation and
// should never run automatically during builds.

// Step 1: Build the frontend bundle (always).
run('npx vite build');

// Step 2: SSR prerender + sitemap (production only).
// Preview/branch deployments skip these to avoid build timeouts
// (the SSR prerender bundles all node_modules and can exceed Vercel's memory/time limits).
if (isProduction) {
  console.log('[vercel-build] production -> running SSR prerender + sitemap');
  try {
    run('npx tsx scripts/prerender.mjs');
  } catch (err) {
    console.warn('[vercel-build] prerender failed (non-fatal):', err.message);
  }
  try {
    run('npx tsx scripts/generate-sitemap.mjs');
  } catch (err) {
    console.warn('[vercel-build] sitemap generation failed (non-fatal):', err.message);
  }
} else {
  console.log('[vercel-build] preview -> skipping prerender + sitemap');
}

console.log('[vercel-build] done');
