# Vercel & DNS Migration Guide

Follow this guide to align the Vercel configuration with the [Infrastructure Source of Truth](./INFRASTRUCTURE.md).

## Phase 1: Git Setup

Before configuring Vercel, ensure the `staging` branch exists in your repository.

1.  Open your terminal in the project root.
2.  Create and push the staging branch (if it doesn't exist):
    ```bash
    git checkout main
    git pull origin main
    git checkout -b staging
    git push -u origin staging
    ```

## Phase 2: Production Project Cleanup

**Goal:** Ensure the current project is explicitly "Production" and only builds `main`.

1.  **Go to Vercel Dashboard** and select your existing project (likely named `acces-direct-aide`).
2.  **Rename Project** (Optional but Recommended):
    -   Settings > General > Project Name.
    -   Change to `acces-direct-aide-prod`.
3.  **Verify Production Branch**:
    -   Settings > Git.
    -   Ensure **Production Branch** is set to `main`.
4.  **Clean Domains**:
    -   Settings > Domains.
    -   Ensure ONLY `www.accesdirectaide.fr` and `accesdirectaide.fr` are listed.
    -   **Important:** `www.accesdirectaide.fr` should be the "Primary" (Canonical).
    -   `accesdirectaide.fr` should be a Redirect to `www`.
    -   Remove any other domains (like `*.vercel.app` aliases that are not needed, or old test domains).
5.  **Git Protection**:
    -   Ensure no other branches are aliased to the production domain.

## Phase 3: Staging Project Setup

**Goal:** Create a separate safe space for testing.

1.  **Create New Project**:
    -   On Vercel Dashboard, click **"Add New..."** > **Project**.
    -   Import the **same repository** (`acces-direct-aide`).
2.  **Configure Project**:
    -   **Project Name:** `acces-direct-aide-staging`.
    -   **Framework Preset:** Vite.
    -   **Root Directory:** `./` (default).
3.  **Git Configuration**:
    -   **Production Branch:** In the "Deploy" screen (or Settings > Git later), set **Production Branch** to `staging`.
    -   *Note:* This tells Vercel that for *this* project, "Production" means the `staging` branch.
4.  **Environment Variables**:
    -   Copy variables from the Prod project, but update:
        -   `NEXT_PUBLIC_SITE_URL`: `https://staging.accesdirectaide.fr` (or your staging URL).
        -   `DATABASE_URL`: Set to your Staging Database connection string.
        -   `X_ROBOTS_TAG`: `noindex`.
5.  **Deploy**: Click **Deploy**.

## Phase 4: Staging DNS

1.  In the new `acces-direct-aide-staging` project:
    -   Settings > Domains.
    -   Add `staging.accesdirectaide.fr`.
    -   Follow instructions to configure the CNAME record in your DNS Registrar (e.g., GoDaddy, OVH).

## Phase 5: Verification

Run the verification script provided in the repo:

```bash
sh scripts/verify-dns.sh
```

**Checklist:**
- [ ] Prod Project (`acces-direct-aide-prod`) is linked to `main`.
- [ ] Staging Project (`acces-direct-aide-staging`) is linked to `staging`.
- [ ] `www.accesdirectaide.fr` is the ONLY domain serving Production traffic.
- [ ] `accesdirectaide.fr` redirects to `www`.
- [ ] Staging URL (`staging.accesdirectaide.fr`) works and shows the `staging` branch content.
