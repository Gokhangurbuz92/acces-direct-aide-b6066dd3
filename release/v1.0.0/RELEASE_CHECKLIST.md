# Release Checklist v1.0.0 (Mission CP7)

> **Objective**: Ensure `AccesDirectAide` is stable, performant, and ready for production deployment.
> **Version**: v1.0.0
> **Date**: 2026-01-27

---

## 1. Prerequisites
- [ ] **Node.js**: v18+ (Verified in `package.json` engines or implicit)
- [ ] **Environment**: `.env` or Vercel Configured
- [ ] **Dependencies**: `npm install` (clean state preferred)

## 2. Local Preflight Gate (Developer Machine)
> Run these commands to validate the codebase integrity before pushing.

| Step | Command | Critical? | Output Log |
|------|---------|-----------|------------|
| **Build** | `npm run build` | 🚨 YES | `proofs/07-release-gate/logs/01-build.txt` |
| **Lint** | `npm run lint` | 🚨 YES | `proofs/07-release-gate/logs/02-lint.txt` |
| **Typecheck** | `npm run typecheck` | 🚨 YES | `proofs/08-lint-typecheck-fix/logs/02-typecheck-v2.txt` |
| **Smoke (Auto)** | `npx playwright test e2e/cp5_prod_smoke.spec.ts` | 🚨 YES | `proofs/07-release-gate/logs/04-pw-cp5.txt` |
| **Regression** | `npx playwright test e2e/cp4_legacy_redirects.spec.ts` | 🚨 YES | `proofs/07-release-gate/logs/05-pw-quick.txt` |
| **Curl Gate** | `./scripts/smoke-prod.sh` | 🚨 YES | `proofs/07-release-gate/logs/06-smoke-curl.txt` |

## 3. Production Gate (Remote Validation)
> Validate the LIVE environment (or Preview) to ensure deployment success.
> **Target**: `https://www.accesdirectaide.fr` (or specify Custom URL)

| Step | Command | Critical? | Output Log |
|------|---------|-----------|------------|
| **Prod Smoke** | `PLAYWRIGHT_BASE_URL="https://www.accesdirectaide.fr" npx playwright test e2e/cp5_prod_smoke.spec.ts` | 🚨 YES | `proofs/07-release-gate/logs/07-prod-pw-cp5.txt` |
| **Prod Curl** | `PLAYWRIGHT_BASE_URL="https://www.accesdirectaide.fr" ./scripts/smoke-prod.sh` | 🚨 YES | `proofs/07-release-gate/logs/08-prod-smoke-curl.txt` |

## 4. Infrastructure & Config Audit

### A. Vercel Env Vars
Ensure the following are defined in Vercel Project Settings:
- [ ] `DATABASE_URL` (Prisma/Neon)
- [ ] `SENTRY_DSN` (Observability)
- [ ] `KV_URL` / `KV_REST_API_URL` (If using Vercel KV)
- [ ] `CRON_SECRET` (If cron jobs are active)

### B. Prisma / Database
- [ ] **Migrations**: `npx prisma migrate deploy` (Run during build or manually if separated)
- [ ] **Health**: API endpoints returning data (checked via Smoke Tests)

### C. SEO & Metadata
- [ ] `/robots.txt` returns 200 OK
- [ ] `/sitemap.xml` returns 200 OK and valid XML
- [ ] Canonical URL behavior (Regression checked in CP3)

### D. Observability (Sentry)
- [ ] Sentry SDK initialized in Production build
- [ ] Source Maps uploaded (Optional but recommended)

---

## 5. Exit Criteria (Go/No-Go)

### 🟢 READY (GO)
- All **Critical** Local Checks PASSED.
- All **Critical** Remote Checks PASSED (No 500s).
- Build is clean.
- Critical User Flows (Home -> Detail) validated.

### 🔴 NOT READY (NO-GO)
- Any **Build Failure**.
- Any **HTTP 500** on critical routes.
- **Lint Errors** blocking CI.
- **Regression** in navigation logic.

---

## 6. Verdict
**Status**: 🟢 **READY (GO)**
**Signed By**: Antigravity Check
