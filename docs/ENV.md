# Environment Variables (No Secrets)

This repo enforces a strict separation between **server** and **frontend** environment variables to avoid accidental secret leaks.

## Canonical Sources

- Local template (with placeholders): `.env.example`
- Vercel names-only list: `.env.template`
- Vercel setup instructions: `docs/ENV_VERCEL_SETUP.md`
- Contract table: `docs/ENVIRONMENT.md`

## Frontend (Vite) Rules

Frontend code under `src/` must **only** read `VITE_*` variables via `src/config/env.js`.

- Allowed examples: `VITE_SENTRY_DSN`, `VITE_PUBLIC_DIAGNOSTICS`, `VITE_DEV_LOGIN_ENABLED`
- Forbidden: any server secret exposed as `VITE_*` (JWT, DB URLs, CRON secrets, storage keys, API tokens)

If `VITE_SENTRY_DSN` is missing, frontend Sentry is simply disabled (soft validation).

## Server + Scripts Rules

Server code under `api/` and Node scripts under `scripts/` must read environment variables through:

- `api/_utils/env.js`

This module provides:

- `getEnv(name)` / `requireEnv([...])` (fail-fast, names-only errors)
- `envAliases(name, aliases)` (fallback to supported aliases)
- `env.*` normalized accessors:
  - `env.db.*`
  - `env.kv.*` (supports Upstash aliases)
  - `env.storage.*`
  - `env.sentry.*`
  - `env.secrets.*`
  - `env.ai.*`

### KV Aliases

Canonical names:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Supported aliases (fallback):

- `UPSTASH_KV_REST_API_URL`
- `UPSTASH_KV_REST_API_TOKEN`
- `UPSTASH_KV_KV_REST_API_URL`
- `UPSTASH_KV_KV_REST_API_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Security Notes

- Never commit `.env.local` or any `.env*` with real values (only `.env.example` is allowed).
- Never print secret values in logs, scripts output, issues, or PR descriptions.
- Prefer passing cron secrets via headers (`x-cron-secret`) instead of query params.
