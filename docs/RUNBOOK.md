# Runbook Incident Response

## 🚨 P0: Site Down / Critical Failure

**Definition**: User facing 500 errors, blank page, or critical feature (Search, Login) broken.

### 1. Immediate Action (Stop the Bleeding)

1.  **Check Status**:
    -   Vercel Status: https://www.vercel-status.com/
    -   Neon Status: https://neontech.statuspage.io/
2.  **Rollback** (If caused by recent deployment):
    -   Go to Vercel Dashboard > Project > Deployments.
    -   Find the last known "Green" deployment.
    -   Click **"Instant Rollback"**.
    -   *Time to mitigation: < 1 minute.*

### 2. Diagnosis

Use the [Observability](./observability.md) tools.

1.  **Sentry**: Look for spikes in `level:error`.
    -   Identify if it's Frontend (JS error) or Backend (API 500).
2.  **Logs**:
    -   Find `x-request-id` from Sentry or user report.
    -   Filter logs for this ID.
3.  **Database**:
    -   If API is timing out, check Neon Compute usage.
    -   Is the connection pool exhausted?

### 3. Common Scenarios & Fixes

| Scenario | Symptom | Fix |
| :--- | :--- | :--- |
| **Bad Deploy** | Sentry spike after release | **Rollback** immediately via Vercel. |
| **DB Connection Limit** | "Too many connections" logs | Check `PrismaClient` usage. Ensure strict singleton in dev. |
| **Third-party Down** | API timeouts | Check status of external services. Disable feature flags if applicable. |
| **Expired Cert/Token** | Auth failures | Rotate `JWT_SECRET` or check Vercel Env Vars. |

### 4. Post-Mortem

After resolution:
1.  Create a "Post-Mortem" document.
2.  Analyze Root Cause (5 Whys).
3.  Create Action Items to prevent recurrence (e.g., add test case).

---

## 🛠 P1: Degraded Performance / Non-Critical Bug

1.  **Acknowledge**: Updates status page (if internal) or notify stakeholders.
2.  **Fix Forward**:
    -   Reproduce locally or on Staging.
    -   Create PR with fix + test.
    -   Merge & Deploy.
