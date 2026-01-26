# Release Procedure

## 1. Merge Strategy
The codebase is currently in a "Fix Branch" state (`fix/bundling-and-routes`).
Recommended merge command (if using GitHub CLI):
```bash
gh pr merge fix/bundling-and-routes --squash --body "Fix Vercel bundling, standardize routing, and harden API handlers"
```
Or via standard git:
```bash
git checkout main
git merge --squash fix/bundling-and-routes
git commit -m "Fix Vercel bundling, standardize routing, and harden API handlers"
git push origin main
```

## 2. CI/CD Verification
This merge adds `.github/workflows/ci.yml`. GitHub Actions should automatically trigger:
*   `Verify Handler Imports` (Checks for static import errors)
*   `Build Project` (Ensures Vite/Rollup compilation works)
*   `Run E2E Tests` (Playwright checks Home, Aides, Demarches without DB)

**Success Criterion:** Green Checkmark on GitHub Actions.

## 3. Rollback Procedure
If Production (Vercel) fails (500 errors persist or new regression):
1.  **Revert Commit:**
    ```bash
    git revert -m 1 HEAD
    git push origin main
    ```
2.  **Redeploy Vercel:** Vercel automatically deploys the revert.

## 4. Post-Merge Verification (Production)
Run these checks against `https://www.accesdirectaide.fr` (or your domain):

### A. Routing
*   [ ] `curl -I https://www.accesdirectaide.fr/login/pro` -> **308 Permanent Redirect** to `/pro/login`
*   [ ] `curl -I https://www.accesdirectaide.fr/sitemap.xml` -> **200 OK** (Content-Type: application/xml)
*   [ ] `curl -I https://www.accesdirectaide.fr/robots.txt` -> **200 OK**

### B. Functional (Browser)
*   [ ] Go to `/aides`. Click an aide. Page loads? (No "click dead")
*   [ ] Go to `/demarches`. Click a démarche. Page loads?
*   [ ] Go to `/structures`. Click a structure. Page loads?
*   [ ] Go to `/actualites`. Are there items? Click one. Page loads?

### C. Monitoring
*   [ ] Check Vercel Logs: Filter for `ERROR` or `500`.
*   [ ] Check Sentry: Alert for "Cannot find module"? (Should be gone).
