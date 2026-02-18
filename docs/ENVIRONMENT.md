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
| `ADA_ENCRYPTION_KEY` | server | yes | yes | Server encryption key. |
| `ADMIN_TOKEN` | server | no | yes | Admin API auth token (recommended locally, required on Vercel). |
| `CRON_SECRET` | server | no | yes | Secures cron endpoints (recommended locally, required on Vercel). |
| `CRON_ACTUALITES_STALE_MINUTES` | server | no | no | Freshness warning threshold for `/api/health/deep` (default `540`). |
| `CRON_ACTUALITES_FAIL_MINUTES` | server | no | no | Freshness failure threshold for `/api/health/deep` (default `1440`). |
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
