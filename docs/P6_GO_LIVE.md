# P6 Go Live: Cron Prod + Securite

## Objectif

Executer l'ingestion des actualites (RSS/Atom) en production via un endpoint cron securise, avec un scheduling Vercel, sans modifier la logique d'ingestion P5.

## Prerequis (IMPORTANT)

Si une PR introduit une migration Prisma (ex: nouvelle table `CronRun`), la prod doit appliquer les migrations avant que les endpoints ne puissent ecrire en DB.

Ce repo fournit maintenant un build "safe" pour automatiser l'application des migrations en prod:

- Script: `npm run vercel-build`
- Comportement:
  - `VERCEL_ENV=production` => `prisma migrate deploy` est execute pendant le build
  - sinon => migrations skip (preview/dev)

### Configuration Vercel

Dans Vercel (Project Settings):

- Build Command: `npm run vercel-build`

## Endpoint

- `GET /api/cron/actualites`
  - Optional: `?mode=smoke` (limite a 5 items) ou `?limit=<n>`
  - Reponse: `{ ok, source, runId, durationMs, stats }`

## Securite (CRON_SECRET)

Le endpoint refuse toute execution sans secret.

Variables:
- `CRON_SECRET` (requis)

Headers supportes (ordre):
1. `x-cron-secret: <CRON_SECRET>` (preferred)
2. `Authorization: Bearer <CRON_SECRET>` (fallback)

Comportement:
- `500` si `CRON_SECRET` n'est pas configure cote serveur
- `401` si le secret est absent ou invalide

## Scheduling Vercel

Le scheduling est defini dans `vercel.json`:
- Hourly: `/api/cron/actualites` a `0 * * * *`

Sur Vercel, configurez la "cron secret" (ou equivalent) pour que les executions planifiees envoient `Authorization: Bearer <CRON_SECRET>`.

## Observabilite / Incidents

### Verifier rapidement

1. `401 Unauthorized`
   - Secret manquant / invalide
   - Verifier `CRON_SECRET` dans l'environnement (prod/preview)

2. `500 CRON_SECRET is not configured`
   - Variable env manquante
   - Ajouter `CRON_SECRET` dans Vercel (prod/preview/dev)

3. `409 Pipeline already running`
   - Lock actif (prevention des executions concurrentes)
   - Attendre la fin du run (TTL lock: 20 minutes)
   - Si besoin: verifier le backend KV (Upstash) ou redemarrer la stack

4. `500 CronRun table missing` / Prisma "table does not exist"
   - Cause: migrations Prisma pas appliquees en prod
   - Fix: executer `npx prisma migrate deploy` sur la DB prod (voir `docs/RUNBOOK_MIGRATIONS.md`)

### Execution manuelle (debug)

Exemples (ne pas coller de valeurs reelles dans les tickets ou PRs):

```bash
curl -i "https://www.accesdirectaide.fr/api/cron/actualites" \
  -H "x-cron-secret: $CRON_SECRET" # gitleaks:allow
```

Ou via script local:

```bash
node scripts/ingest-actualites.js --limit 5
```

## Post-deploy smoke (prod)

Script local (aucun secret en dur, utilise uniquement les variables du terminal):

```bash
export PROD_URL="https://www.accesdirectaide.fr"
export CRON_SECRET="(dans ton terminal)"
export ADMIN_TOKEN="(dans ton terminal)"

npm run smoke:prod
```
