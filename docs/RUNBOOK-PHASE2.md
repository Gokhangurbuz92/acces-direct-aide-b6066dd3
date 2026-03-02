# Phase 2 — Espace Pro Runbook

## Deployment Checklist

### Environment Variables (Vercel)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL (Neon) connection string |
| `DIRECT_URL` | ✅ | Direct PostgreSQL URL (migrations) |
| `PRO_JWT_SECRET` | ✅ | JWT signing secret for pro tokens |
| `CRON_SECRET` | ✅ | Secret for cron job authentication |
| `MAILER_PROVIDER` | ✅ | Email provider (`mailjet`, `resend`, `noop`) |
| `MAILER_API_KEY` | ✅ | `publicKey:secretKey` for Mailjet |
| `MAILER_FROM` | ✅ | Sender email address |
| `SIAO_ENABLED` | ❌ | `true` to enable SI-SIAO (default: false) |
| `SIAO_API_URL` | ❌ | SI-SIAO API endpoint |
| `SIAO_API_KEY` | ❌ | SI-SIAO API key |
| `OUTLOOK_ENABLED` | ❌ | `true` to enable Outlook OAuth (default: false) |
| `OUTLOOK_CLIENT_ID` | ❌ | Azure AD App Client ID |
| `OUTLOOK_CLIENT_SECRET` | ❌ | Azure AD App Client Secret |
| `OUTLOOK_REDIRECT_URI` | ❌ | Outlook OAuth callback URL |
| `GEMINI_API_KEY` | ✅ | Google Gemini 2.0 Flash API key |

### Cron Jobs (Vercel)

| Job | Schedule | Description |
|---|---|---|
| `/api/cron/rdv-reminder` | `0 8 * * *` | RDV J-1 email + notification |
| `/api/cron/actualites` | `0 */6 * * *` | RSS news ingestion |
| `/api/cron/ingest-aids` | `0 3 * * *` | Aid data ingestion |
| `/api/cron/ingest-structures` | `0 2 * * 0` | Structure data (weekly) |
| `/api/cron/review-queue/scan` | `30 */6 * * *` | Content review queue |
| `/api/cron/hive-scan` | `0 6 * * 1` | Hive orchestration (weekly) |

### Database Migrations

```bash
# Local
npx prisma migrate dev

# Production (Vercel build)
npx prisma migrate deploy
# Fallback if P3015 error:
npx prisma db push --accept-data-loss
```

### Post-Deploy Verification

```bash
# 1. Health check
curl -H "Authorization: Bearer $TOKEN" https://YOUR-APP.vercel.app/api/pro/health-check

# 2. Cron smoke test
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-APP.vercel.app/api/cron/rdv-reminder?mode=smoke

# 3. Verify RBAC (should return 401)
curl https://YOUR-APP.vercel.app/api/pro/team
```

## Feature Activation

### SI-SIAO (DO NOT ACTIVATE without signed convention)
1. Set `SIAO_ENABLED=true` in Vercel
2. Set `SIAO_API_URL` and `SIAO_API_KEY`
3. Test in staging first
4. See `docs/SI-SIAO-INTEGRATION.md` for data mapping

### Outlook
1. Create Azure AD App Registration
2. Set `OUTLOOK_ENABLED=true` + `CLIENT_ID/SECRET/REDIRECT_URI`
3. Test OAuth flow on staging

## Monitoring

- **Sentry**: All unhandled errors are captured
- **Structured Logging**: All handlers use `logger` (JSON format)
- **Audit Log**: All sensitive actions logged to `AuditLog` table
- **Cron Runs**: Tracked in `CronRun` table with status/metrics

## Incident Response

1. Check `/api/pro/health-check` for system status
2. Review Sentry for recent errors
3. Check `CronRun` table for failed cron jobs
4. Review `AuditLog` for suspicious activity
