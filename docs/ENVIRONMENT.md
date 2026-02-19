# Environment Contract (Names Only)

This document defines the **environment variable contract** for AccesDirectAide.

Rules (non negotiable):
- Never commit secrets (`.env.local`, tokens, DB URLs with credentials, DSNs, keys).
- Never print env **values** in logs/tests/docs/PRs. Only print variable **names** and statuses.
- Frontend code under `src/` must only read `VITE_*` variables via `src/config/env.js`.
- Server code under `api/` and Node scripts under `scripts/` should read env via `api/_utils/env.js`.

## Quick Commands

- Local contract check (loads `.env.local` if present): `npm run env:check`
- Local doctor (adds DB URL sanity + TCP check, names-only output): `npm run doctor`
- Vercel env presence check (names-only list from `.env.template`): `npm run vercel:env:check`

## Contract Table

Legend:
- Scope: `server` (Node/Vercel functions) or `client` (Vite bundle).
- Required: what `scripts/env-check.mjs` enforces by mode.

| Variable | Scope | Required (local) | Required (preview/prod) | Aliases / Notes |
|---|---|---:|---:|---|
| `DATABASE_URL` | server | yes | yes | Prisma pooled URL. |
| `POSTGRES_URL_NON_POOLING` | server | yes | yes | Prisma `directUrl`. Alias: `DATABASE_URL_UNPOOLED`. |
| `POSTGRES_PRISMA_URL` | server | no | no | Optional legacy alias some platforms provide. |
| `DATABASE_URL_UNPOOLED` | server | no | no | Legacy alias for `POSTGRES_URL_NON_POOLING`. |
| `JWT_SECRET` | server | yes | yes | Auth signing secret. |
| `AUTH_MODE` | server | no | no | Auth mode for `/api/auth/login` (`token` default, `jwt` optional). |
| `AUTH_SECRET` | server | no | no | Admin auth signing secret when `AUTH_MODE=jwt`. Alias: `AUTH_JWT_SECRET`. |
| `AUTH_JWT_SECRET` | server | no | no | Alias for `AUTH_SECRET`. |
| `AUTH_MAGICLINK_ENABLED` | server | no | no | Reserved feature flag for future passwordless flow (`0` default). |
| `MAILER_PROVIDER` | server | no | no | Transactional mail provider (`noop` default, `test` in integration tests). |
| `MAILER_FROM` | server | no | no | Sender address used by transactional emails (verification/reset). |
| `MAILER_API_KEY` | server | no | no | API key for the configured transactional mail provider. |
| `ADA_ENCRYPTION_KEY` | server | yes | yes | Server encryption key. |
| `ADMIN_TOKEN` | server | no | yes | Admin API auth token (recommended locally, required on Vercel). |
| `CRON_SECRET` | server | no | yes | Secures cron endpoints (recommended locally, required on Vercel). |
| `CRON_ACTUALITES_STALE_MINUTES` | server | no | no | Freshness warning threshold for `/api/health/deep` (default `540`). |
| `CRON_ACTUALITES_FAIL_MINUTES` | server | no | no | Freshness failure threshold for `/api/health/deep` (default `1440`). |
| `DATA_AIDES_STALE_DAYS` | server | no | no | Data quality stale threshold for aides review queue (default `365`). |
| `DATA_DEMARCHES_STALE_DAYS` | server | no | no | Data quality stale threshold for demarches review queue (default `365`). |
| `DATA_STRUCTURES_STALE_DAYS` | server | no | no | Data quality stale threshold for structures review queue (default `365`). |
| `DATA_REVIEW_SCAN_LIMIT_PER_TYPE` | server | no | no | Max entities scanned per type during review queue scan (default `200`). |
| `DATA_REVIEW_SCAN_CRON_LIMIT_PER_TYPE` | server | no | no | Max entities scanned per type during cron review queue scan (fallback: `DATA_REVIEW_SCAN_LIMIT_PER_TYPE`). |
| `DATA_REVIEW_SCAN_CRON_ENABLED` | server | no | no | Enable/disable cron review queue scan (`1` by default, `0` to disable). |
| `INGESTION_PARSER_VERSION` | server | no | no | Parser version tag written in `SourceDocument.metadata` (default `v1`). |
| `INGESTION_DRY_RUN` | server | no | no | If `1`, ingestion computes stats without mutating entities (`0` by default). |
| `INGESTION_MAX_ITEMS_PER_RUN` | server | no | no | Safety cap for items processed in one ingestion run (default `200`). |
| `MONITOR_DQ_OPEN_TOTAL_MAX` | server | no | no | Max open items before `/api/monitor/data-quality` returns `503` (default `500`). |
| `MONITOR_DQ_OPEN_P0_MAX` | server | no | no | Max open `P0` items before `/api/monitor/data-quality` returns `503` (default `25`). |
| `MONITOR_INGEST_FRESHNESS_MAX_AGE_HOURS` | server | no | no | Max age of latest `SourceDocument.fetched_at` before `/api/monitor/ingestion-freshness` returns `503` (default `48`). |
| `PRO_RDV_RATE_LIMIT_READ_PER_MIN` | server | no | no | Per-tenant read quota on `/api/pro/*` RDV endpoints (default `60/min`). |
| `PRO_RDV_RATE_LIMIT_WRITE_PER_MIN` | server | no | no | Per-tenant write quota on `/api/pro/*` RDV endpoints (default `20/min`). |
| `PRO_RDV_RATE_LIMIT_WRITE_PER_DAY` | server | no | no | Per-tenant daily write quota on `/api/pro/*` RDV endpoints when KV is configured (default `300/day`). |
| `BYPASS_SECRET` | server | no | no | Optional bypass for specific automation/test flows. |
| `KV_REST_API_URL` | server | no | yes | Upstash/Vercel KV REST URL (required for prod rate limiting/locks). |
| `KV_REST_API_TOKEN` | server | no | yes | Upstash/Vercel KV REST token. |
| `UPSTASH_KV_REST_API_URL` | server | no | no | Alias for `KV_REST_API_URL`. |
| `UPSTASH_KV_REST_API_TOKEN` | server | no | no | Alias for `KV_REST_API_TOKEN`. |
| `UPSTASH_KV_KV_REST_API_URL` | server | no | no | Legacy alias for `KV_REST_API_URL`. |
| `UPSTASH_KV_KV_REST_API_TOKEN` | server | no | no | Legacy alias for `KV_REST_API_TOKEN`. |
| `STORAGE_ENDPOINT` | server | no | yes | S3 compatible endpoint. |
| `STORAGE_REGION` | server | no | yes | Region (some providers use `auto`). |
| `STORAGE_BUCKET` | server | no | yes | Bucket name. |
| `STORAGE_ACCESS_KEY_ID` | server | no | yes | Access key id. |
| `STORAGE_SECRET_ACCESS_KEY` | server | no | yes | Secret access key. |
| `SENTRY_DSN` | server | no | yes | Server Sentry DSN. |
| `VITE_SENTRY_DSN` | client | no | no | Client Sentry DSN (must be `VITE_*`). |
| `VITE_GOOGLE_SITE_VERIFICATION` | client | no | no | Optional Google Search Console meta verification token. |
| `VITE_BING_SITE_VERIFICATION` | client | no | no | Optional Bing Webmaster meta verification token. |
| `SENTRY_ORG` | server | no | no | DevOps/build only. |
| `SENTRY_PROJECT` | server | no | no | DevOps/build only. |
| `SENTRY_AUTH_TOKEN` | server | no | no | DevOps/build only. Must not be used at runtime. |
| `GEMINI_API_KEY` | server | no | no | AI features (optional). |

## Repo Extras (Used, But Not Part Of The Core Contract)

These variables are used by some flows but are not enforced by `env-check`:

| Variable | Scope | Notes |
|---|---|---|
| `DATABASE_URL_TEST` | server | Used by `npm test` for deterministic DB reset/seed. |
| `ADMIN_EMAIL` | server | Optional: admin login email (defaults to a fixed value if missing). |
| `ADMIN_PASSWORD` | server | Required for `/api/auth/login` (admin UI). |
| `PUBLIC_BASE_URL` | server | Used for canonical URLs/sitemap/robots. |
| `LOG_LEVEL` | server | Logging verbosity. |
| `DEBUG_TOKEN` | server | Optional protected diagnostics. |
| `ALLOW_DEV_TOOLS` | server | Local-only dev toggle. |
| `VITE_*` flags | client | Must stay client-only. Never move server secrets under `VITE_*`. |

## CI Secrets (GitHub Actions, Names Only)

These values are configured in GitHub repository secrets, not in app `.env` files:

| Secret | Used By | Notes |
|---|---|---|
| `PROD_BASE_URL` | `.github/workflows/obs-smoke-prod.yml` | Base URL passed to `scripts/obs-smoke.mjs --base-url` for scheduled production smoke checks. |
