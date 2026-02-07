# Backup & Restore Procedures (Neon Postgres)

## Backup Strategy

Neon provides **Point-In-Time Recovery (PITR)** by default, allowing you to restore the database to any second within the retention period.

However, for major releases, we enforce an explicit **Snapshot** strategy using Neon Branches.

### ✅ Pre-Release Backup (Mandatory)

Before merging a release to `main`:

1.  Log in to the **Neon Console**.
2.  Go to the **Branches** tab.
3.  Click **"New Branch"**.
4.  **Source**: Select `main` (Production).
5.  **Name**: `backup-pre-release-vX.Y.Z` (e.g., `backup-pre-release-v1.2.0`).
6.  Click **Create Branch**.

*This creates an instant, copy-on-write snapshot of production data at that moment. It consumes no extra storage initially.*

---

## Restore / Rollback

### Scenario A: Data Corruption (Partial)

If a migration or script corrupted data, but the schema is fine:

1.  **Identify the time** of corruption (e.g., 14:30 UTC).
2.  **Create a Recovery Branch** in Neon from `main` at `14:29 UTC` (Time Travel).
3.  **Verify** the data in the recovery branch.
4.  **Swap Connection String** (Emergency) OR **Dump & Restore**:
    -   Dump the specific table from the recovery branch.
    -   Restore it to `main`.

### Scenario B: Catastrophic Failure

If production is unusable:

1.  **Promote the Backup Branch**:
    -   Go to the `backup-pre-release-vX.Y.Z` branch.
    -   Set it as Primary (if supported) OR update Vercel `DATABASE_URL` to point to this branch temporarily.
2.  **Restore to Main**:
    -   Use `pg_dump` from the backup branch and `psql` to restore to `main`.

```bash
# Example Restore
pg_dump -d [BACKUP_URL] -F c -f dump.file
pg_restore -d [PROD_URL] --clean --if-exists dump.file
```
