#!/usr/bin/env node

/**
 * Vercel build entrypoint (safe).
 *
 * Goals:
 * - Keep `npm run build` unchanged (still runs `vite build`).
 * - Run Prisma migrations automatically in **production only**.
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

// Ensure Prisma client is generated (idempotent).
run('npx prisma generate');

if (isProduction) {
  console.log('[vercel-build] production detected -> running safe prisma migrate flow');
  run('node scripts/prisma-migrate-safe.mjs');
} else {
  console.log('[vercel-build] skipping prisma migrate deploy (not production)');
}

// Build the frontend bundle.
run('npm run build');

console.log('[vercel-build] done');
