# Environment Variables Matrix

> **⚠️ No secret values are shown — only variable NAMES and expected states.**

## Required Variables

| Variable | Prod | Preview | Dev | Purpose |
|----------|:----:|:-------:|:---:|---------|
| `DATABASE_URL` | ✅ | ✅ | ✅ | Neon PostgreSQL connection (pooled) |
| `DIRECT_URL` | ✅ | ✅ | ✅ | Neon PostgreSQL direct URL (migrations) |
| `CRON_SECRET` | ✅ | ✅ | ❌ | Protects cron endpoints |
| `ADMIN_TOKEN` | ✅ | ✅ | ❌ | Admin API authentication |
| `SENTRY_DSN` | ✅ | ✅ | ❌ | Error monitoring |
| `OPENFISCA_BASE_URL` | ✅ | ✅ | ❌ | OpenFisca API for diagnostic calculations |

## Optional Variables

| Variable | Prod | Preview | Dev | Purpose |
|----------|:----:|:-------:|:---:|---------|
| `LOG_LEVEL` | `warn` | `info` | `debug` | Logger verbosity (error/warn/info/debug) |
| `SERVICE_PUBLIC_DEMARCHES_DATASET_URL` | ❌ | ❌ | ❌ | Override DILA dataset URL (default: data.gouv.fr) |
| `UPSTASH_REDIS_REST_URL` | ✅ | ✅ | ❌ | Rate limiting (Upstash KV) |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | ✅ | ❌ | Rate limiting auth |

## ⚠️ Dangerous Flags (MUST be OFF in production)

| Variable | Prod | Preview | Dev | Risk |
|----------|:----:|:-------:|:---:|------|
| `VITE_DEV_LOGIN_ENABLED` | ❌ OFF | ❌ OFF | ✅ | Enables dev login bypass — **NEVER in prod** |
| `VITE_PUBLIC_DIAGNOSTICS` | ❌ OFF | ❌ OFF | ✅ | Exposes diagnostic debug info |
| `ALLOW_DEV_TOOLS` | ❌ OFF | ❌ OFF | ✅ | Enables dev tool endpoints |

> **Rule**: If a dangerous flag is absent from the environment, it defaults to OFF (disabled). This is the safe default.

## CI Variables

| Variable | CI | Purpose |
|----------|:--:|---------|
| `DATABASE_URL` | Mock | CI uses a local PostgreSQL or SKIP_DB_SETUP=true |
| `DIRECT_URL` | Mock | Same as DATABASE_URL for CI |
| `SKIP_DB_SETUP` | `true` | Skip real DB setup in CI |
| `VITE_API_URL` | `http://localhost:3000` | Mock API URL |
| `LOG_LEVEL` | `warn` | Reduce CI log noise |
| `USE_MOCKS` | `true` | E2E tests use mock data |
| `CHROMATIC_PROJECT_TOKEN` | Secret | Chromatic visual regression (GitHub Secret) |

## Verification Checklist

```bash
# Check prod env vars are set (Vercel CLI)
npx vercel env ls --environment production

# Verify dangerous flags are NOT set
npx vercel env ls --environment production | grep -i "DEV_LOGIN\|DEV_TOOLS\|PUBLIC_DIAGNOSTICS"
# Expected: no output
```
