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
  - Reponse success: `{ ok, source, runId, durationMs, stats, cronRunId }`
  - Reponse skip: `202 { ok:true, skipped:true, reason:"locked|cooldown", runId, cronRunId }`

## Securite (CRON_SECRET)

Le endpoint accepte 2 modes d'auth (sans jamais exposer de secret):

Variables:
- `CRON_SECRET` (requis)

### Mode 1: Manuel / Externe (secret)

Headers supportes (ordre, recommandes):
1. `x-cron-secret: <CRON_SECRET>` (preferred)
2. `Authorization: Bearer <CRON_SECRET>` (fallback)

Comportement:
- `500` si `CRON_SECRET` n'est pas configure cote serveur
- `401` si le secret est absent ou invalide

### Mode 2: Vercel Cron (prod uniquement)

Vercel Cron Jobs declenche un `GET` sur `path` mais ne permet pas d'ajouter un header Authorization custom depuis `vercel.json`.

En production uniquement (`VERCEL_ENV=production`), le handler accepte aussi les requetes dont:
- `User-Agent` commence par `vercel-cron/` (ex: `vercel-cron/1.0`)

Ce mode est refuse en preview/dev.

## Scheduling Vercel

Le scheduling est defini dans `vercel.json`:
- Toutes les 6h (UTC): `/api/cron/actualites` a `0 */6 * * *`

### Timezone (UTC -> France)

Le cron Vercel est interprete en UTC.

Pour `0 */6 * * *`:
- UTC: 00:00, 06:00, 12:00, 18:00
- France (hiver, CET = UTC+1): 01:00, 07:00, 13:00, 19:00
- France (ete, CEST = UTC+2): 02:00, 08:00, 14:00, 20:00

## Anti-flood (verrou KV + cooldown DB)

Pour limiter le risque de spoofing du User-Agent et eviter les doubles executions:

1. Verrou KV (throttle):
   - cle: `cron:actualites:lock`
   - acquisition: `NX` + `TTL=15min`
   - si lock deja present => `202` `{ ok:true, skipped:true, reason:"locked" }`
2. Cooldown DB (defense-in-depth):
   - si le dernier `CronRun` `success` pour `job=actualites` est < 10 minutes => skip `reason:"cooldown"`

Le pipeline garde aussi son lock interne pour prevenir les executions concurrentes.

Les skips (`locked` / `cooldown`) sont journalises en base avec:
- `CronRun.status = "skipped"`
- `CronRun.skipReason = "locked" | "cooldown"`
- `CronRun.trigger = "vercel" | "manual" | "external" | "unknown"`

## Freshness / Staleness (health deep)

`GET /api/health/deep` expose la fraicheur du cron actualites via `deps.cron.actualites`:
- `state = "fresh" | "stale" | "missing" | "error"`
- `lastSuccessAt`, `lastRunAt`, `lastStatus`, `ageMinutes`
- `thresholds.staleMinutes`, `thresholds.failMinutes`

Variables (noms uniquement):
- `CRON_ACTUALITES_STALE_MINUTES` (default: `540` = 9h)
- `CRON_ACTUALITES_FAIL_MINUTES` (default: `1440` = 24h)

Comportement HTTP de `/api/health/deep`:
- cron `stale` => HTTP `200` (warning)
- cron `error` (age >= fail threshold) => HTTP `503`
- cron `missing` => visible dans payload (run jamais execute), sans hard-fail

## Monitoring externe (UptimeRobot / BetterUptime)

Endpoint public dedie au monitoring cron:
- `GET https://www.accesdirectaide.fr/api/monitor/cron/actualites`

Semantique HTTP:
- `200` => cron `fresh`
- `503` => cron `stale`, `missing` ou `error`
- `405` => methode non supportee

Payload JSON minimal:
- `ok`, `job`, `state`, `ageMinutes`, `lastSuccessAt`, `thresholds`, `requestId`

Recommandation de frequence:
- ping toutes les `5-10` minutes
- regle d'alerte: `HTTP != 200`

Difference entre endpoints:
- `/api/health/deep`: endpoint protege admin/cron, diagnostic complet (DB/KV/Storage + freshness)
- `/api/monitor/cron/actualites`: endpoint public minimal, robuste, adapte aux outils uptime

## Observabilite / Incidents

### Verifier rapidement

1. `401 Unauthorized`
   - Secret manquant / invalide
   - Verifier `CRON_SECRET` dans l'environnement (prod/preview)

2. `500 CRON_SECRET is not configured`
   - Variable env manquante
   - Ajouter `CRON_SECRET` dans Vercel (prod/preview/dev)

3. `202 skipped locked` / `202 skipped cooldown`
   - Anti-flood actif (lock ou cooldown)
   - Attendre (TTL lock: 15 minutes) ou verifier les derniers runs en admin

4. `health/deep` indique `state=stale`
   - Cron pas assez recent mais non critique
   - Verifier: Vercel Cron actif + `/api/admin/cron-runs?job=actualites&limit=20`

5. `health/deep` renvoie `503` avec `state=error`
   - Dernier success trop ancien (>= fail threshold) ou erreur d'audit cron
   - Verifier `vercel.json`, redeployer, verifier logs cron, puis declencher un run manuel securise

6. `409 Pipeline already running`
   - Lock actif (prevention des executions concurrentes)
   - Attendre la fin du run (TTL lock: 20 minutes)
   - Si besoin: verifier le backend KV (Upstash) ou redemarrer la stack

7. `500 CronRun table missing` / Prisma "table does not exist"
   - Cause: migrations Prisma pas appliquees en prod
   - Fix: executer `npx prisma migrate deploy` sur la DB prod (voir `docs/RUNBOOK_MIGRATIONS.md`)

### Verifier que le cron tourne vraiment

Verifier les derniers runs dans l'admin:
- `GET /api/admin/cron-runs?job=actualites&limit=20` (auth: `ADMIN_TOKEN`)

Verifier la fraicheur:
- `GET /api/health/deep` (auth admin/cron), puis lire `deps.cron.actualites`
- `GET /api/monitor/cron/actualites` (public), verifie uniquement l'etat cron

Ou utiliser le smoke local:
- `npm run smoke:prod` (utilise `CRON_SECRET` + `ADMIN_TOKEN` depuis ton terminal)

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

## Smoke redirects SEO (post-deploy)

Verifier les redirections canoniques sans secrets:

```bash
curl -I "https://accesdirectaide.fr/aides?utm=test"
curl -I "https://www.accesdirectaide.fr/aides/"
```

Attendu:
- apex -> `www` en redirection permanente, avec conservation path + querystring.
- trailing slash -> URL sans slash final (`/aides/` -> `/aides`).

## Smoke indexability (post-deploy)

Checklist minimal:

```bash
curl -s https://www.accesdirectaide.fr/robots.txt
curl -I https://www.accesdirectaide.fr/api/health | rg -i "x-robots-tag"
curl -I https://www.accesdirectaide.fr/api/monitor/cron/actualites | rg -i "x-robots-tag"
```

Attendu:
- `robots.txt` contient `Disallow: /admin` et `Disallow: /api/`.
- les endpoints techniques renvoient `X-Robots-Tag: noindex, nofollow`.
- les pages admin exposent `meta[name="robots"]` avec `noindex, nofollow`.
