# Observability

Goal: Diagnose incidents in < 5 minutes.

## 1. Stack
- **Logging**: Pino (JSON structured logs).
- **Tracing/Errors**: Sentry (Full stack).
- **Context**: `requestId` (UUID) propagated via `x-request-id` header.

## 2. Logs Structure
Logs are output to `stdout` in JSON format.

```json
{
  "level": "info",
  "time": 1715695000000,
  "env": "production",
  "service": "api",
  "release": "abcdef123",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "msg": "Incoming Request",
  "method": "GET",
  "path": "/aides",
  "query": { "category": "logement" },
  "duration": 45
}
```

## 3. Sentry Alerts
Configure these rules in Sentry Project Settings:

1.  **5xx Spike**:
    *   Condition: `count() > 5` in 1 minute where `level:error` and `transaction.status:5xx`.
    *   Action: Slack/Email P0.

2.  **Search Errors (Degraded Experience)**:
    *   Condition: `count() > 10` in 5 minutes where `transaction:/api/aides` and `level:error`.

3.  **Auth Brute Force**:
    *   Condition: `count() > 20` in 1 minute where `transaction:/api/auth/login` and `message:"Invalid credentials"`.

## 4. Debug Checklist (P0 Incident)

1.  **Get the Request ID**:
    *   Ask reporter for `x-request-id` header or find it in Sentry event tags (`requestId`).
2.  **Find Logs**:
    *   Filter logs by `requestId` in your log aggregator (Datadog, Vercel Logs, etc.).
3.  **Check Sentry**:
    *   Search by `requestId` or `release` version.
    *   Look at "Breadcrumbs" for steps leading to error.
4.  **Identify Deployment**:
    *   Check `release` field in logs/Sentry matches the deployed git commit.
    *   Verify `env` matches expected environment (production vs staging).
5.  **Rollback?**:
    *   If many 500s appear after a new release, revert immediately using Vercel Dashboard.

## 5. Development
- **Sourcemaps**: Automatically uploaded on build via `@sentry/vite-plugin`.
- **Verify**: Run `npm run verify` to check route integrity.
