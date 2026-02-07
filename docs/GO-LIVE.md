# Go-Live Procedure

**Objective**: Ensure a safe, predictable deployment to Production.

## 1. Preparation (Staging)

- [ ] **Code Freeze**: No new merges to `main` except the release candidate.
- [ ] **Sync Staging**: Ensure Staging DB has recent data (optional, but good for realistic tests).
- [ ] **Deploy to Staging**: Merge feature branches to `staging`.
- [ ] **Verification**:
    - [ ] Run `npm run verify` locally.
    - [ ] Smoke test Staging URL manually.
    - [ ] Verify `x-robots-tag: noindex` is present on Staging.

## 2. The Release Gate

- [ ] **Check CI**: Ensure all GitHub Actions are Green on the PR.
- [ ] **Database Migration**:
    - [ ] Does this release include migrations? (`prisma/migrations`)
    - [ ] If YES: Review `BACKUP_RESTORE.md` and prepare rollback plan.
- [ ] **Backup Production**:
    - [ ] Create a Neon Branch `backup-pre-release-vX.Y.Z` (See [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)).

## 3. Deployment (Production)

- [ ] **Merge**: Merge PR to `main`. (Or push tag if using tag-based deploy).
- [ ] **Monitor CI**: Watch the `CI` workflow.
- [ ] **Monitor Vercel**: Watch the deployment logs in Vercel.

## 4. Post-Go-Live Verification

- [ ] **Healthcheck**: Run `node scripts/ci-healthcheck.js https://www.accesdirectaide.fr`.
- [ ] **Smoke Test**: Login as Pro, Search Aides.
- [ ] **Sentry**: Check for new errors in the "Releases" tab.
- [ ] **Release Tag**:
    ```bash
    git tag vX.Y.Z
    git push origin vX.Y.Z
    ```

## 5. Rollback (If needed)

- [ ] **Instant**: Use Vercel "Instant Rollback".
- [ ] **Database**: If data corruption, refer to [BACKUP_RESTORE.md](./BACKUP_RESTORE.md).
