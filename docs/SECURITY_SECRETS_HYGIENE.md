# Security: Secrets Hygiene Audit (P0)

Goal: reduce the risk of leaking secrets and make environment configuration reproducible (without committing values).

## Audit Scope

Reviewed (tracked files only):

- `docs/`
- `scripts/`
- `.github/workflows/`
- `api/` and `src/`
- `.gitignore`

Patterns searched (non-exhaustive):

- `postgresql://`
- `neon.tech`
- `JWT_SECRET`, `CRON_SECRET`, `ADMIN_TOKEN`, `ADMIN_PASSWORD`
- `TOKEN`, `KEY`, `PASSWORD`

## Findings (High Signal)

- Documentation contained full-looking database URL examples (including user/password-style segments) and provider endpoint hostnames.
  - Action: replaced with safe placeholders (no credentials; no real hostnames).
- `api/_handlers/cron/gdpr-purge.js` used a hardcoded fallback cron secret.
  - Action: removed fallback and standardized auth on `api/_utils/cronAuth.js` (still supports legacy `?key=` as an alias).

## Repository Protections

- `.gitignore` already prevents committing `.env*` files and Vercel local metadata (`.vercel/`).
- Added an automated secrets scanner in CI (gitleaks) to block new leaks on PRs and `main`.

## New Runbooks / Tools

- `.env.template`: required variable names (no values).
- `docs/ENV_VERCEL_SETUP.md`: reproducible setup guide (names only).
- `docs/ROTATE_SECRETS.md`: rotation checklist (no values).
- `scripts/vercel-env-sync.mjs`: checks that required variable names exist on Vercel (dev/preview/prod) and prints missing names only.
- `npm run security:secrets`: local gitleaks scan over tracked files only (no history; no values printed).

## Notes

- If a secret was ever committed, rotation is required even after removal from the working tree (git history still contains it).
- This change set intentionally avoids runtime behavior changes, except for removing an insecure fallback secret on a cron endpoint (covered by tests).

