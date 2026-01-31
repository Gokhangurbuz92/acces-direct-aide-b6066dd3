# Cron Security Configuration

## Overview

All cron endpoints are protected by authentication to prevent unauthorized execution.

## Authentication Methods

The cron authentication system (`api/_utils/cronAuth.js`) supports three methods:

### 1. Bearer Token (Recommended for Manual Testing)

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/ingest-structures
```

### 2. Query Parameter (Fallback)

```bash
curl "https://your-domain.com/api/cron/ingest-structures?secret=YOUR_CRON_SECRET"
```

### 3. Vercel Cron Header (Automatic)

When Vercel executes scheduled cron jobs, it automatically adds the `x-vercel-cron: 1` header. No additional configuration needed.

## Environment Variables

### Required

- `CRON_SECRET`: Secret token for cron authentication (minimum 32 characters recommended)

### Example

```bash
CRON_SECRET="your-secure-random-string-min-32-chars"
```

## Vercel Cron Configuration

Cron jobs are configured in `vercel.ts`:

```javascript
{
  crons: [
    { path: "/api/cron/pipeline", schedule: "0 * * * *" },
    { path: "/api/cron/ingest-structures", schedule: "0 2 * * 0" },
  ]
}
```

### Schedule Format

Uses standard cron syntax:
- `0 * * * *` = Every hour at minute 0
- `0 2 * * 0` = Every Sunday at 2:00 AM

## Security Best Practices

1. **Strong Secret**: Use a cryptographically random string (32+ characters)
2. **Environment Variables**: Never commit `CRON_SECRET` to git
3. **HTTPS Only**: Always use HTTPS in production
4. **Rate Limiting**: Cron endpoints are protected by rate limiting (via KV)
5. **Distributed Locking**: Prevents concurrent execution (see `pipelineLock.js`)

## Testing Cron Endpoints

### Local Development

```bash
# Set CRON_SECRET in .env
CRON_SECRET="local-dev-secret"

# Test with curl
curl -H "Authorization: Bearer local-dev-secret" \
  http://localhost:5173/api/cron/ingest-structures?limit=5
```

### Production/Preview

```bash
# Use Vercel environment variable
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/ingest-structures
```

## Monitoring

### Check Sync Runs

Query the `SyncRun` table to see execution history:

```sql
SELECT id, source_id, started_at, ended_at, status, stats
FROM "SyncRun"
ORDER BY started_at DESC
LIMIT 10;
```

### Health Check

The `/api/health` endpoint includes cron status (if applicable).

## Troubleshooting

### 401 Unauthorized

- Verify `CRON_SECRET` is set in environment
- Check Authorization header format: `Bearer <secret>`
- Ensure secret matches exactly (no extra spaces)

### 409 Conflict

- Pipeline is already running (locked)
- Wait for current run to complete (max 20 minutes)
- Check `SyncRun` table for stuck runs

### 500 Internal Server Error

- Check logs for detailed error message
- Verify database connectivity
- Check KV connectivity (for locking)

## Integration Tests

Run cron auth tests:

```bash
npm test tests/integration/cron-auth.test.js
```

Tests cover:
- Valid Bearer token
- Valid query param
- Vercel cron header
- Invalid credentials
- Missing credentials
- Malformed headers
