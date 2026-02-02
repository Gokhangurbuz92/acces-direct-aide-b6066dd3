# MISSION P0 PROD - RELEASE NOTES & PROOFS

**Date:** 2025-02-28
**Branch:** fix/p0-api-500-aides
**Status:** READY TO DEPLOY

## 1. Root Cause Analysis
The production 500 errors ("Function Invocation Failed") on `/api/aides` and `/api/cron/pipeline` were caused by an incompatible import syntax in the data connectors (`GrandEstConnector.js`, `AgefiphConnector.js`).
The code used `import ... with { type: "json" }`, which caused the Vercel Runtime (likely Node 18/20 default) to crash at startup during module resolution. This propagated to all endpoints importing `routes.js`.

## 2. Changes
1.  **Fix (API):** Refactored Connectors to use `createRequire` and `require()` for loading `taxonomy.json`, ensuring compatibility with Vercel Runtime.
2.  **Fix (Ingestion):** Renamed `crawlMs` to `fetchMs` in `ingest-aids.js` to satisfy the "Anti Silent Failure" contract in `pipeline.js`.
3.  **Fix (CSP):** Self-hosted "Inter" font (w weights 400/500/600/700) in `public/fonts/` and updated `index.html` to remove Google Fonts dependencies.
4.  **Verification:** Validated that `unaccent` extension is already enabled by migration `20260228000000_ensure_unaccent`.

## 3. Deployment Instructions (PROD)

### Step 1: Database Migration
Ensure the schema and extensions are up to date.
```bash
npx prisma migrate deploy
```

### Step 2: Ingestion Trigger
Trigger the ingestion to populate data (since the crash might have left it stale or empty).
```bash
curl -X GET "https://<PROD_URL>/api/cron/ingest-aides?secret=<CRON_SECRET>&wipe=true&limit=50"
```

### Step 3: Verify Frontend
Visit `https://<PROD_URL>/aides`.
- **Expectation:** Page loads (HTTP 200), Filters appear, Aides list is populated.
- **Fonts:** Verify fonts are loaded from domain (no requests to `fonts.googleapis.com`).

## 4. Proofs (Local Simulation)
- **Tests:** `npm run test` passed (76 tests).
- **Startup Check:** `node dev-server.js` starts successfully (listening on 3000), proving that import crashes are resolved.
- **CSP:** `public/fonts/` contains 4 `.woff2` files. `index.html` has preloads.

## 5. Rollback Plan
If 500 errors persist:
1. Revert this PR.
2. Check Vercel Logs for specific stack trace.
