# Secrets Rotation Runbook (No Values)

This runbook explains what to rotate after a suspected leak, and how to validate the system safely.

## Important Notes

- Never paste secret values in chat, issues, PRs, or docs.
- Rotation does not remove secrets from git history. If a secret was committed at any point, assume it is compromised and rotate it.
- Rotate Preview/Dev secrets too if they were exposed (they are often used locally).

## What To Rotate

### Application Secrets (Vercel Env)

- `JWT_SECRET` (JWT signing)
- `CRON_SECRET` (cron endpoints protection)
- `ADMIN_TOKEN` (admin API auth)
- `ADMIN_PASSWORD` (admin login)
- `BYPASS_SECRET` (automation bypass, if used)
- `DEBUG_TOKEN` (debug-only endpoints, if used)

### Database

- `DATABASE_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_PRISMA_URL` (if used)
- `DATABASE_URL_UNPOOLED` (if used)

Rotate the underlying DB credentials (user/password / token) in the provider (Neon) and update Vercel envs.

### KV / Rate limiting (Upstash / Vercel integrations)

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `UPSTASH_KV_KV_REST_API_URL`
- `UPSTASH_KV_KV_REST_API_TOKEN`
- `UPSTASH_KV_KV_REST_API_READ_ONLY_TOKEN` (if used)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (if used)

### Storage (S3-compatible)

- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`
- `STORAGE_ENDPOINT`
- `STORAGE_REGION`
- `STORAGE_BUCKET`

### Sentry (Build-time)

- `SENTRY_AUTH_TOKEN` (sourcemaps upload)

`SENTRY_DSN` / `VITE_SENTRY_DSN` are typically not "secrets" but should be treated as sensitive configuration.

## Special Case: `ADA_ENCRYPTION_KEY`

`ADA_ENCRYPTION_KEY` is used for encryption/hashing in `api/lib/crypto.js`.

Rotation requires a plan:

- If any persisted data is encrypted with the old key, changing the key can make that data unreadable.
- Recommended approach: implement multi-key decryption and a re-encryption job before switching fully.

Do not rotate `ADA_ENCRYPTION_KEY` in production without a migration strategy and a rollback plan.

## How To Rotate (Checklist)

Repeat per environment (`production`, `preview`, `development`):

1. Generate new secrets (offline, password manager).
2. Update Vercel Environment Variables (Dashboard recommended).
3. Redeploy.
4. Verify.

## Verification After Rotation

### Quick checks (prod/preview)

- Pages load: `/`, `/aides`, `/demarches`, `/annuaire`, `/actualites`
- API returns 200:
  - `GET /api/health`
  - `GET /api/aides?limit=1`
  - `POST /api/search` (smoke)
- Cron auth checks:
  - Cron endpoints should return 401 when called without secret.

### Local checks (dev)

```bash
set -a; source .env.local; set +a
npm run doctor
npx prisma migrate deploy
npm test
```

## Done Definition

- Old credentials revoked/invalidated in providers.
- Vercel env vars updated for all required environments.
- Deployments succeed and basic smoke checks are green.
- No secrets appear in repo or docs.

