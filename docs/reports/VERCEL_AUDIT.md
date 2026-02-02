# Vercel Architecture Audit & Recommendations

## 1. `vercel.json` vs UI Settings
**Objective:** Avoid double sources of truth and configuration drift.

### Findings
- **Redirects:** `vercel.json` contains a hardcoded redirect to `www.accesdirectaide.fr`. This forces ALL environments (including Staging and Preview) to redirect to Production, which breaks the development workflow on Vercel.
- **Rewrites:** `vercel.json` handles rewrites to the API. Some rewrites point to specific files (e.g., `/api/sitemap`) which do not exist directly as functions, relying on a potentially fragile or misunderstood routing mechanism.
- **Headers:** Security headers are correctly defined in `vercel.json`.

### Recommendations (P0)
- **Remove Host Redirects from `vercel.json`:** Redirects that enforce a canonical domain (like `www`) should be handled via Vercel Project Settings (Domains > Redirect to www) or Middleware. This ensures that Preview/Staging URLs remain accessible.
- **Centralize API Routing:** Since `api/index.js` acts as a central router ("Monolith Router" pattern), all API-related rewrites should point to `/api` (the entry point), and `api/index.js` should handle the routing logic.

## 2. Redirects & Rewrites
**Objective:** Eliminate ambiguous rules and ensure predictable routing.

### Findings
- **Broken Rewrites:**
  - `/sitemap.xml` -> `/api/sitemap` (Function `api/sitemap.js` does not exist; `api/_handlers/sitemap.js` exists but is internal).
  - `/robots.txt` -> `/api/robots` (Similar issue).
  - `/login/pro` -> `/api/login-pro-guard` (Function `api/login-pro-guard.js` does not exist).
  - `/__dev/:path*` -> `/api/blocked` (Function `api/blocked.js` does not exist in root API, only in `_handlers`).
- **Ambiguity:** The rule `/api/(.*)` -> `/api` effectively captures everything under `/api/`, but the specific rules above (e.g., `/api/sitemap`) would take precedence if the destination existed. Since they don't, they likely 404 or behave unexpectedly depending on Vercel's fallback logic.

### Actionable Changes (P0)
- Update `vercel.json` rewrites to direct `/sitemap.xml`, `/robots.txt`, `/login/pro`, and `/__dev` to `/api`.
- Update `api/index.js` to explicitly handle these paths and route them to the correct `_handlers`.

## 3. Monorepo / Output Directory / Build
**Objective:** Ensure Vercel detects the correct build artifacts.

### Findings
- **Structure:** The project uses Vite with a standard structure. `package.json` defines `build`.
- **Output:** Vite outputs to `dist` by default. Vercel automatically detects this for Vite framework presets.
- **API:** Functions are in `api/`. Vercel automatically deploys these as serverless functions.

### Recommendations (P2)
- **Explicit configuration:** While auto-detection works, ensuring the "Framework Preset" is set to "Vite" in Vercel Project Settings is recommended.
- **Build Command:** `vite build` is correct.

## 4. Environments
**Objective:** Harmonize environment variables.

### Findings
- `api/_handlers/sitemap.js` uses `process.env.PUBLIC_BASE_URL` with a fallback to production. This is good practice.

### Recommendations (P1)
- **`PUBLIC_BASE_URL`:** Ensure this environment variable is set for Staging and Preview environments in Vercel Project Settings to point to the respective Vercel deployment URLs (e.g., `https://${VERCEL_URL}`).
- **Database:** Ensure separate database connections (Neon branches) for Staging vs Production if not already configured.

## Risk Assessment (If No Action Taken)
- **Broken Previews:** Developers cannot test changes on Preview URLs because they are redirected to Production.
- **Broken API Routes:** Routes like `/login/pro`, `/sitemap.xml` likely return 404 on deployment due to incorrect rewrites mapping to non-existent function paths.
- **Ambiguity:** Hard to debug routing issues when `vercel.json` points to non-existent files.
