# CI/CD Pipeline Documentation

## Overview

The AccesDirectAide project uses GitHub Actions for continuous integration and Vercel for continuous deployment.

---

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**

#### `unit-tests` Job
Runs on: `ubuntu-latest`  
Node version: 20  
DB: Postgres service container (pgvector enabled)

**Steps:**
1. **Checkout** - Clone repository
2. **Setup Node.js** - Install Node 20 with npm cache
3. **Install Dependencies** - `npm ci`
4. **Unit/Integration Tests (repeat)** - `npm run test:repeat` (runs `npm test` 3x)

#### `build-and-test` Job
Runs on: `ubuntu-latest`  
Node version: 20

**Steps:**
1. **Checkout** - Clone repository
2. **Setup Node.js** - Install Node 20 with npm cache
3. **Install Dependencies** - `npm ci`
4. **Lint** - `npm run lint`
5. **Build** - `npm run build`
6. **Install Playwright** - Install browsers for E2E tests
7. **E2E Tests** - `npx playwright test e2e/booking.spec.js e2e/public-core.spec.js`

**Environment Variables (CI):**
```yaml
# Dedicated test DB for `npm test` (never an external DB)
DATABASE_URL_TEST: "postgresql://postgres@localhost:5432/acces_direct_aide_test?schema=public"

# Safe dummy secrets (tests only)
ADA_ENCRYPTION_KEY: "0000000000000000000000000000000000000000000000000000000000000000"
JWT_SECRET: "test-jwt-secret"
CRON_SECRET: "test-cron-secret"
ADMIN_TOKEN: "test-admin-token"
BYPASS_SECRET: "test-bypass-secret"

# Stable flags
TZ: "UTC"
NODE_ENV: "test"
VERCEL_ENV: "test"
```

**Duration:** ~3-5 minutes

**Status:** ✅ All checks passing (expected)

---

### 2. Health Check Workflow (`.github/workflows/healthcheck.yml`)

**Purpose:** Monitor production health endpoint

**Status:** ⚠️ Need to verify configuration

---

### 3. Automerge Workflow (`.github/workflows/automerge.yml`)

**Purpose:** Automatically merge approved PRs

**Status:** ⚠️ Need to verify configuration

---

## Local Development Quality Gates

### Pre-Commit Checks (Recommended)

```bash
# Run all quality checks before committing
npm ci              # Clean install
npm run lint        # Linting
npm run typecheck   # Type checking
npm test            # Unit tests
npm run build       # Production build
```

**Expected Results:**
- Lint: 0 errors, 0 warnings
- Typecheck: 0 errors
- Tests: All passing (`npm test`)
- Build: Success with 0 warnings

---

## Test Infrastructure

### Unit Tests (Vitest)

**Location:** `tests/unit/`, `src/**/*.test.js`, `api/**/*.test.js`

**Coverage:**
- Component tests (FalcSummary, ErrorBoundary, etc.)
- Utility tests (queryState, jsonld, taxonomy, etc.)
- API tests (search-query, admin-security, etc.)
- Pipeline tests

**Command:** `npm test`  
**Current:** See `vitest` output (count may evolve; suite must be stable).

---

### Integration Tests (Vitest)

**Location:** `tests/integration/`

**Coverage:**
- API endpoint tests (actualites, api_head, api_slug)
- URL consistency tests
- Auth crossing tests

**Command:** `npm run test:api`  
**Current:** Included in main test suite

---

### E2E Tests (Playwright)

**Location:** `e2e/`

**Tests:**
- `booking.spec.js` - Appointment booking flow
- `public-core.spec.js` - Core public pages

**Command:** `npx playwright test`  
**CI Command:** Runs against preview server on port 4173

**Configuration:** `playwright.config.js`

---

## Build Process

### Development Build

```bash
npm run dev
```

**Features:**
- Hot module replacement (HMR)
- Source maps
- Fast refresh
- Development-only warnings

**Port:** 5173 (default Vite)

---

### Production Build

```bash
npm run build
```

**Output:** `dist/` directory

**Optimizations:**
- Code splitting (manual chunks)
- Minification
- Tree shaking
- Source maps (hidden in production with Sentry)

**Bundle Analysis:**
- react-vendor: 143.44 kB (46.03 kB gzip)
- ui-vendor: 179.09 kB (53.66 kB gzip)
- sentry-vendor: 448.13 kB (148.14 kB gzip)
- vendor: 238.55 kB (77.03 kB gzip)
- utils-vendor: 56.89 kB (17.44 kB gzip)
- react-ecosystem: 55.83 kB (17.66 kB gzip)
- react-router-vendor: 36.99 kB (13.46 kB gzip)

**Total:** ~1.2 MB minified (~400 kB gzip)

---

### Preview Build

```bash
npm run preview
```

**Purpose:** Test production build locally  
**Port:** 4173 (default)

---

## Database Management

### Migrations

**Development:**
```bash
npm run db:migrate
```

**Production:**
```bash
npm run db:deploy
```

**Seed:**
```bash
npm run db:seed
```

**Guard:**
```bash
npm run guard:prisma
```
Prevents accidental schema changes.

---

## Deployment (Vercel)

### Automatic Deployment

**Triggers:**
- Push to `main` → Production deployment
- Pull request → Preview deployment

**Environment Variables (Required):**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `POSTGRES_URL_NON_POOLING` - Direct connection for migrations
- `ADA_ENCRYPTION_KEY` - 64-char hex encryption key
- `JWT_SECRET` - JWT signing secret
- `CRON_SECRET` - Cron endpoint protection
- `VITE_SENTRY_DSN` - Sentry DSN (optional)
- `SENTRY_AUTH_TOKEN` - Sentry upload token (optional)
- `SENTRY_ORG` - Sentry organization (optional)
- `SENTRY_PROJECT` - Sentry project (optional)

**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Install Command:** `npm ci`

---

## Monitoring & Observability

### Sentry

**Integration:**
- Frontend: `@sentry/react` in `src/main.jsx`
- Backend: `@sentry/node` in API handlers
- Build: `@sentry/vite-plugin` for source maps

**Configuration:**
- Environment-based sampling rates
- Session replay enabled
- Browser tracing enabled
- Release tracking with Git SHA

**Error Boundary:**
- Wraps entire app in `src/main.jsx`
- User-friendly fallback UI
- Automatic error reporting to Sentry

---

### Logging

**Library:** Pino 10.3.0

**Usage:**
- Structured JSON logs
- Request ID tracking
- Performance metrics
- Error context

**Example:**
```javascript
logger.info('SEARCH_AIDES_START', {
  requestId: '...',
  query: {...},
  ip: '...'
});
```

---

## Security

### Authentication
- **Admin:** JWT tokens with bcrypt password hashing
- **Pro:** JWT tokens with email verification
- **Cron:** CRON_SECRET header validation

### Rate Limiting
- **Library:** @upstash/ratelimit + @vercel/kv
- **Fallback:** In-memory rate limiting
- **Configuration:** Per-endpoint limits

### Secrets Management
- **Storage:** Vercel environment variables
- **Access:** Via `process.env` or `import.meta.env`
- **Validation:** Never committed to repository

---

## Troubleshooting

### CI Failures

**Lint Errors:**
```bash
npm run lint -- --fix  # Auto-fix issues
```

**Typecheck Errors:**
```bash
npm run typecheck  # See detailed errors
```

**Test Failures:**
```bash
npm test -- --reporter=verbose  # Detailed test output
```

**Build Failures:**
```bash
npm run build  # See build errors
rm -rf node_modules dist && npm ci && npm run build  # Clean rebuild
```

### Local Development Issues

**Port Already in Use:**
```bash
lsof -ti:5173 | xargs kill -9  # Kill process on port 5173
```

**Database Connection:**
```bash
# Verify DATABASE_URL in .env
npx prisma db push  # Sync schema without migration
```

**Prisma Client Out of Sync:**
```bash
npx prisma generate  # Regenerate Prisma client
```

---

## Best Practices

### Before Committing
1. Run `npm run lint` - Fix linting issues
2. Run `npm run typecheck` - Fix type errors
3. Run `npm test` - Ensure tests pass
4. Run `npm run build` - Verify build succeeds
5. Use conventional commits (feat:, fix:, docs:, etc.)

### Before Creating PR
1. Rebase on latest `main`
2. Run full quality gate
3. Update documentation if needed
4. Add tests for new features
5. Verify no secrets committed

### Before Merging
1. CI must be green
2. Code review approved
3. No merge conflicts
4. Documentation updated
5. Breaking changes documented

---

**Last Updated:** 2026-02-04  
**Maintained by:** Tech Lead
