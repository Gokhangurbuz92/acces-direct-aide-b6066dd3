# Infrastructure Source of Truth

This document serves as the single source of truth for the deployment configuration of **AccesDirectAide**.

## Projects & Environments

We use **Vercel** for hosting both Production and Staging environments. To ensure strict separation and prevent "Preview = Prod" accidents, we use **two separate Vercel projects**.

| Environment | Vercel Project Name | Git Branch | Primary Domain | Redirects |
| :--- | :--- | :--- | :--- | :--- |
| **PRODUCTION** | `acces-direct-aide-prod` | `main` | `www.accesdirectaide.fr` | `accesdirectaide.fr` → `www` (308) |
| **STAGING** | `acces-direct-aide-staging` | `staging` | `staging.accesdirectaide.fr` (Recommended) | N/A |

### Environment Details

#### 1. Production (`acces-direct-aide-prod`)
- **Repository:** `acces-direct-aide`
- **Production Branch:** `main`
- **Vercel Domains:**
  - `www.accesdirectaide.fr` (Git Branch: `main`) - **Canonical**
  - `accesdirectaide.fr` (Redirects to `www.accesdirectaide.fr`)
- **Environment Variables:**
  - `NODE_ENV`: `production`
  - `NEXT_PUBLIC_SITE_URL`: `https://www.accesdirectaide.fr`
  - `DATABASE_URL`: (Production DB)

#### 2. Staging (`acces-direct-aide-staging`)
- **Repository:** `acces-direct-aide`
- **Production Branch:** `staging`
- **Vercel Domains:**
  - `staging.accesdirectaide.fr` (or similar sub-domain)
- **Environment Variables:**
  - `NODE_ENV`: `production` (Builds as prod, but uses staging data)
  - `NEXT_PUBLIC_SITE_URL`: `https://staging.accesdirectaide.fr`
  - `DATABASE_URL`: (Staging DB)
  - `X_ROBOTS_TAG`: `noindex` (To prevent indexing of staging)

## Git Workflow

1.  **Development**: Work in feature branches.
2.  **Staging**: Merge feature branches into `staging`. This triggers a deployment to the Staging environment.
    -   *Verification*: Test features on the Staging URL.
3.  **Production**: When Staging is validated, merge `staging` into `main` (or create a Pull Request from `staging` to `main`). This triggers a deployment to Production.

## DNS Strategy

- **Canonical Domain**: `www.accesdirectaide.fr`
- **Apex Domain**: `accesdirectaide.fr` redirects to `www`.
- **Protocol**: HTTPS is enforced by Vercel.

## Important Rules

1.  **NEVER** attach the production domain (`accesdirectaide.fr` or `www`) to a Preview deployment or the Staging project.
2.  **ALWAYS** verify `x-robots-tag: noindex` is present on Staging and absent on Production.
3.  **DO NOT** use `main` branch for the Staging project.
