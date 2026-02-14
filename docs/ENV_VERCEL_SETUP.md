# Vercel Environment Setup (No Secrets)

This document describes how to set up environment variables on Vercel in a reproducible way, without copying any secret values into the repo.

## Principles

- Never paste secret values in issues, PRs, or docs.
- Do not store secret values in git (even in "private" repos).
- Only commit variable **names** (see `.env.template`).

## Required Variables (Names Only)

Canonical list: `.env.template` (Core section).

Minimum required for the app to run safely:

- `DATABASE_URL`
- `POSTGRES_URL_NON_POOLING`
- `ADA_ENCRYPTION_KEY`
- `JWT_SECRET`
- `CRON_SECRET`
- `ADMIN_TOKEN`
- `ADMIN_PASSWORD`
- `PUBLIC_BASE_URL`

Optional variables are listed in `.env.template` (commented out). Only enable them if you use the related feature (KV rate limiting, storage, Sentry, Gemini, etc).

## Environments

Vercel scopes:

- `production`: main deployment
- `preview`: PR / branch deployments
- `development`: local usage with Vercel CLI (optional)

Recommendation: keep `JWT_SECRET`, `CRON_SECRET`, `ADMIN_TOKEN` different per environment.

## Setup via Vercel CLI

Prerequisites:

1. Install CLI: `npm i -g vercel`
2. Link the repo once: `vercel link`

### Pull to local `.env.local`

```bash
vercel env pull .env.local
```

Then in your shell:

```bash
set -a; source .env.local; set +a
npm run doctor
```

### Add / update variables

Use the Vercel Dashboard (recommended) or CLI:

```bash
vercel env add <NAME> production
vercel env add <NAME> preview
vercel env add <NAME> development
```

Do not run these commands from a recorded terminal session or paste values into chat.

## Drift Check (Names Only)

This repo includes a safe checker that prints only the **missing variable names** per environment:

```bash
npm run vercel:env:check
```

Notes:

- The checker requires `vercel link` first.
- It does not read or print values.

