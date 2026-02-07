# Operations Runbook - AccesDirectAide

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [Deployment](#deployment)
3. [Database Migrations](#database-migrations)
4. [Cron Jobs](#cron-jobs)
5. [Monitoring](#monitoring)
6. [Rollback Procedures](#rollback-procedures)
7. [Common Issues](#common-issues)
8. [Emergency Contacts](#emergency-contacts)

---

## Environment Variables

### Required Variables

#### Database
```bash
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public"
POSTGRES_URL_NON_POOLING="postgresql://user:password@host:5432/db?schema=public"
```

#### Security
```bash
JWT_SECRET="super-secret-jwt-key-minimum-32-chars"
ADA_ENCRYPTION_KEY="64-char-hex-string-for-aes-256-gcm"
ADMIN_TOKEN="your-admin-token-for-api-auth"
CRON_SECRET="your-cron-secret-minimum-32-chars"
```

#### Vercel KV (Rate Limiting)
```bash
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
```

#### Site Configuration
```bash
PUBLIC_BASE_URL="https://www.accesdirectaide.fr"
VERCEL_ENV="production"  # Auto-set by Vercel
```

### Optional Variables
```bash
# Development only
VITE_DEV_LOGIN_ENABLED="false"
ALLOW_DEV_TOOLS="false"

# Automation
BYPASS_SECRET="optional-automation-bypass-secret"

# Sentry (if configured)
SENTRY_DSN="https://..."
SENTRY_AUTH_TOKEN="..."
```

### Setting Environment Variables

#### Vercel Dashboard
1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate scope (Production, Preview, Development)
3. Redeploy for changes to take effect

#### Local Development
```bash
cp .env.example .env
# Edit .env with your values
```

---

## Deployment

### Automatic Deployment (Recommended)

**Production:**
- Push to `main` branch
- Vercel automatically builds and deploys
- URL: https://www.accesdirectaide.fr

**Preview:**
- Create PR or push to any branch
- Vercel creates preview deployment
- URL: https://[branch]-[project].vercel.app

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Pre-Deployment Checklist

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Smoke tests pass: `npx playwright test e2e/smoke-critical.spec.js`
- [ ] Environment variables are set
- [ ] Database migrations are ready (if applicable)
- [ ] No secrets in code

### Post-Deployment Verification

```bash
# Check health endpoint
curl https://www.accesdirectaide.fr/api/health

# Verify sitemap
curl https://www.accesdirectaide.fr/sitemap.xml

# Verify robots.txt
curl https://www.accesdirectaide.fr/robots.txt

# Run smoke tests against production
PLAYWRIGHT_BASE_URL=https://www.accesdirectaide.fr npx playwright test e2e/smoke-critical.spec.js
```

---

## Database Migrations

### Running Migrations

#### Development
```bash
npm run db:migrate
# This runs: prisma migrate dev
```

#### Production
```bash
npm run db:deploy
# This runs: prisma migrate deploy
```

### Migration Workflow

1. **Create Migration**
   ```bash
   npx prisma migrate dev --name add_traceability_tables
   ```

2. **Review Migration SQL**
   - Check `prisma/migrations/[timestamp]_[name]/migration.sql`
   - Verify SQL is correct and safe

3. **Test Migration**
   - Apply to development database
   - Verify schema changes
   - Test application functionality

4. **Deploy to Production**
   - Merge PR to main
   - Vercel runs `npm run db:deploy` automatically (if configured)
   - Or run manually: `npm run db:deploy`

### Rollback Migration

```bash
# Revert last migration
npx prisma migrate resolve --rolled-back [migration_name]

# Apply previous state
npx prisma migrate deploy
```

### Migration Best Practices

- Always test migrations in staging first
- Use transactions for data migrations
- Add indexes for new foreign keys
- Avoid breaking changes (add columns as nullable first)
- Document complex migrations

---

## Cron Jobs

### Configured Cron Jobs

#### 1. Pipeline (Hourly)
- **Path:** `/api/cron/pipeline`
- **Schedule:** `0 * * * *` (every hour at minute 0)
- **Purpose:** General pipeline tasks

#### 2. Ingest Structures (Weekly)
- **Path:** `/api/cron/ingest-structures`
- **Schedule:** `0 2 * * 0` (every Sunday at 2:00 AM)
- **Purpose:** Sync structures from external sources

### Manual Cron Execution

```bash
# Using Bearer token
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://www.accesdirectaide.fr/api/cron/ingest-structures

# Using query param
curl "https://www.accesdirectaide.fr/api/cron/ingest-structures?secret=$CRON_SECRET"

# With limit (for testing)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.accesdirectaide.fr/api/cron/ingest-structures?limit=5"
```

### Monitoring Cron Jobs

#### Check Sync Runs
```sql
SELECT id, source_id, started_at, ended_at, status, stats
FROM "SyncRun"
ORDER BY started_at DESC
LIMIT 10;
```

#### Check for Stuck Runs
```sql
SELECT id, started_at, status
FROM "SyncRun"
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL '30 minutes';
```

### Troubleshooting Cron Jobs

**Issue: 401 Unauthorized**
- Verify `CRON_SECRET` is set correctly
- Check Authorization header format

**Issue: 409 Conflict**
- Pipeline is already running (locked)
- Wait for current run to complete
- Check for stuck locks in KV: `pipeline:lock:*`

**Issue: 500 Internal Server Error**
- Check logs in Vercel dashboard
- Verify database connectivity
- Check KV connectivity

---

## Monitoring

### Health Checks

```bash
# Production health
curl https://www.accesdirectaide.fr/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2026-01-31T12:00:00.000Z",
  "requestId": "...",
  "version": "0.0.0",
  "commitSha": "abc123",
  "environment": "production",
  "checks": {
    "database": { "status": "connected", "error": null },
    "kv": { "status": "connected", "error": null }
  },
  "duration_ms": 45
}
```

### Key Metrics

- **Uptime:** Should be > 99.9%
- **Response Time:** Should be < 500ms (p95)
- **Error Rate:** Should be < 0.1%
- **404 Rate:** Should be < 5%

### Logs

#### Vercel Dashboard
- Go to Project → Deployments → [Deployment] → Logs
- Filter by function (e.g., `/api/health`)

#### Structured Logs (Pino)
All API logs are JSON-formatted with:
- `requestId`: Unique request identifier
- `path`: Request path
- `method`: HTTP method
- `status`: Response status
- `duration_ms`: Request duration
- `error`: Error message (if any)

---

## Rollback Procedures

### Immediate Rollback (Critical Issues)

#### Via Vercel Dashboard
1. Go to Project → Deployments
2. Find last known good deployment
3. Click "..." → "Promote to Production"
4. Confirm promotion

#### Via Vercel CLI
```bash
# List recent deployments
vercel ls

# Promote specific deployment
vercel promote [deployment-url]
```

### Rollback Criteria

Rollback immediately if:
- Home page returns 500 or blank screen
- Any critical path is broken (aides, démarches, structures)
- 404 rate > 20%
- Error rate > 5%
- Database connectivity lost
- Security vulnerability discovered

### Post-Rollback Actions

1. **Investigate Root Cause**
   - Review deployment logs
   - Check error tracking (Sentry)
   - Review recent code changes

2. **Fix Issue**
   - Create hotfix branch
   - Fix bug
   - Test thoroughly
   - Deploy fix

3. **Post-Mortem**
   - Document what went wrong
   - Document what was done
   - Update runbook if needed
   - Improve monitoring/alerts

---

## Common Issues

### Issue: Database Connection Errors

**Symptoms:**
- `/api/health` returns `database: disconnected`
- 500 errors on API endpoints

**Diagnosis:**
```bash
# Check DATABASE_URL is set
vercel env ls

# Test connection manually
psql $DATABASE_URL -c "SELECT 1"
```

**Resolution:**
1. Verify DATABASE_URL is correct
2. Check database is running
3. Check firewall rules allow Vercel IPs
4. Restart database if needed

### Issue: KV Connection Errors

**Symptoms:**
- `/api/health` returns `kv: error`
- Rate limiting not working
- Pipeline locks failing

**Diagnosis:**
```bash
# Check KV env vars
vercel env ls | grep KV
```

**Resolution:**
1. Verify KV_REST_API_URL and KV_REST_API_TOKEN
2. Check Vercel KV dashboard for status
3. Restart KV instance if needed

### Issue: Build Failures

**Symptoms:**
- Deployment fails during build
- "Build failed" in Vercel dashboard

**Diagnosis:**
```bash
# Run build locally
npm ci
npm run build
```

**Resolution:**
1. Fix build errors locally
2. Ensure all dependencies are in package.json
3. Check for TypeScript errors
4. Verify Prisma schema is valid

### Issue: Cron Jobs Not Running

**Symptoms:**
- No new SyncRun records
- Data not updating

**Diagnosis:**
```bash
# Check cron configuration
cat vercel.ts | grep crons

# Manually trigger cron
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://www.accesdirectaide.fr/api/cron/ingest-structures
```

**Resolution:**
1. Verify cron schedule in vercel.ts
2. Check CRON_SECRET is set
3. Manually trigger to test
4. Check Vercel cron logs

---

## Emergency Contacts

### On-Call Rotation
- **Primary:** [Name] - [Email] - [Phone]
- **Secondary:** [Name] - [Email] - [Phone]

### Escalation Path
1. On-call engineer
2. Tech lead
3. CTO

### External Services
- **Vercel Support:** https://vercel.com/support
- **Database Provider:** [Contact info]
- **KV Provider:** Vercel Support

---

## Appendix

### Useful Commands

```bash
# Full verification suite
npm ci && npm test && npm run build

# Run smoke tests
npx playwright test e2e/smoke-critical.spec.js

# Validate sources manifest
node scripts/validate-sources-manifest.js

# Check Prisma schema
npx prisma validate

# Generate Prisma client
npx prisma generate

# View database schema
npx prisma studio
```

### Useful Queries

```sql
-- Check recent sync runs
SELECT * FROM "SyncRun" ORDER BY started_at DESC LIMIT 10;

-- Check published content counts
SELECT 
  (SELECT COUNT(*) FROM "Aide" WHERE statut = 'publie') as aides,
  (SELECT COUNT(*) FROM "Demarche" WHERE statut = 'publie') as demarches,
  (SELECT COUNT(*) FROM "Structure" WHERE statut = 'publie') as structures;

-- Check for stuck locks (via KV - use Vercel dashboard)
-- Key pattern: pipeline:lock:*
```

### Documentation Links

- [TRACEABILITY.md](docs/TRACEABILITY.md) - Data provenance model
- [CRON_SECURITY.md](docs/CRON_SECURITY.md) - Cron authentication
- [CRITICAL_PATHS.md](docs/CRITICAL_PATHS.md) - Critical user paths
- [FALC_GUIDE.md](docs/FALC_GUIDE.md) - Accessibility guidelines

---

**Last Updated:** 2026-01-31  
**Version:** 1.0.0
