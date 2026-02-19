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

### Prisma P3009 recovery (hotfix deploy)

Le build de production utilise un flux de migration resilient:

- `scripts/prisma-migrate-safe.mjs`
- etape 1: tente `prisma migrate deploy`
- etape 2 (strictement ciblee): si Prisma renvoie `P3009` pour la migration
  `20260303000000_add_actualite_source_document_fk`, le script:
  - applique une reparation de schema idempotente (colonne/index/FK sur `Actualite` + index `SourceDocument`)
  - execute `prisma migrate resolve --applied 20260303000000_add_actualite_source_document_fk`
  - relance `prisma migrate deploy`
- pour toute autre erreur migration: le build echoue normalement (pas de masquage).

Ce comportement est automatique en production via `npm run vercel-build` et ne requiert aucune action manuelle SQL.

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

## Smoke SEO global (post-deploy)

Commande unique (sans secrets):

```bash
npm run smoke:seo:prod
```

Variables optionnelles:
- `PROD_URL` (default `https://www.accesdirectaide.fr`)
- `APEX_URL` (default `https://accesdirectaide.fr`)

Le script vérifie:
- redirect apex -> www
- policy `robots.txt`
- contract `sitemap.xml` (origin canonique)
- header `x-robots-tag` sur endpoints techniques
- meta noindex admin (best effort SPA)
- OG defaults sur `/` (`og:image`, `twitter:image`, `og:image:alt`)
- noindex + canonical sur route inconnue
- noindex sur fiche aide inexistante

## Verification performance / cache (P8-A)

Objectif:
- mettre en cache CDN uniquement les endpoints publics safe
- garantir `no-store` sur endpoints techniques/sensibles
- ne jamais mettre en cache les erreurs (4xx/5xx)

Checks rapides:
```bash
# Public content (200 -> CDN cache attendu)
curl -I "https://www.accesdirectaide.fr/api/aides?limit=1"
curl -I "https://www.accesdirectaide.fr/api/demarches?limit=1"
curl -I "https://www.accesdirectaide.fr/api/structures?limit=1"
curl -I "https://www.accesdirectaide.fr/api/actualites?limit=1"

# Technique (toujours no-store)
curl -I "https://www.accesdirectaide.fr/api/health"
curl -I "https://www.accesdirectaide.fr/api/monitor/cron/actualites"

# Sitemap
curl -I "https://www.accesdirectaide.fr/sitemap.xml"
```

Attendu:
- `aides/demarches/structures`: `Cache-Control` contient `s-maxage=3600` et `stale-while-revalidate=86400`
- `actualites`: `Cache-Control` contient `s-maxage=300` et `stale-while-revalidate=21600`
- endpoints techniques: `Cache-Control` contient `no-store`
- `sitemap.xml`: cache public sur `200`, et `no-store` si `503`

## Observability smoke (P8-B)

Commande unique (sans secrets):

```bash
npm run smoke:obs:prod
```

Variables optionnelles:
- `PROD_URL` (default `https://www.accesdirectaide.fr`)
- `TIMEOUT_MS` (default `8000`)

Le script verifie:
- `/api/monitor/core` (attendu `HTTP=200`)
- `/api/monitor/cron/actualites` (attendu `HTTP=200` ou `HTTP=503` selon freshness)
- `/api/health` (`HTTP=200` + `Cache-Control: no-store`)
- `X-Robots-Tag: noindex, nofollow` sur `/api/monitor/core` et `/api/health`

En cas d'alerte:
1. `monitor/core` down: verifier DB/KV en priorite.
2. `monitor/cron/actualites` degrade: verifier cron runs + scheduling.

## Triage + status + smoke CI (P8-G)

Nouveautes:
- endpoint admin bulk: `PATCH /api/admin/review-queue/bulk`
- page publique `noindex`: `/status`
- workflow planifie: `.github/workflows/obs-smoke-prod.yml`

Checklist post-deploy:
1. Ouvrir `/status` et verifier les 2 cartes:
   - `Data Quality`
   - `Ingestion Freshness`
2. Verifier `meta robots` noindex sur `/status`.
3. Executer localement:
   ```bash
   npm run smoke:obs:prod
   ```
4. Verifier le workflow GitHub `Obs Smoke PROD`:
   - run horaire present
   - issue `🚨 PROD smoke failed` creee/commentee en cas d'echec

Note CI (names only):
- secret GitHub Actions requis: `PROD_BASE_URL`

## Data quality alerting loop (P8-F)

Nouveaux endpoints monitorables (public, no-store + noindex):
- `/api/monitor/data-quality`:
  - `200` si la review queue est sous les seuils
  - `503` si `openTotal` ou `openP0` depassent les seuils, ou si DB indisponible
- `/api/monitor/ingestion-freshness`:
  - `200` si la derniere collecte (`SourceDocument.fetched_at`) est recente
  - `503` si stale/missing/error

Cron automatique de scan quality:
- endpoint: `/api/cron/review-queue/scan`
- scheduling Vercel (UTC) dans `vercel.json`
- auth: cron secret (manuel) ou User-Agent `vercel-cron/*` en production

Variables associees (names only):
- `DATA_REVIEW_SCAN_CRON_LIMIT_PER_TYPE`
- `DATA_REVIEW_SCAN_CRON_ENABLED`
- `MONITOR_DQ_OPEN_TOTAL_MAX`
- `MONITOR_DQ_OPEN_P0_MAX`
- `MONITOR_INGEST_FRESHNESS_MAX_AGE_HOURS`

Smoke post-deploy:
```bash
npm run smoke:obs:prod
```

Le smoke verifie notamment:
- `/api/monitor/core`
- `/api/monitor/cron/actualites`
- `/api/monitor/data-quality`
- `/api/monitor/ingestion-freshness`
- et tente `/api/cron/review-queue/scan` si `CRON_SECRET` est present dans le terminal.

## Verification SEO finale (post-deploy)

Checklist:
- `npm run smoke:seo:prod`
- verifier une URL inexistante (`/route-qui-nexiste-pas-123`) -> meta robots `noindex`
- verifier une aide inexistante (`/aides/slug-inexistant-123`) -> page introuvable + noindex
- verifier OG preview sur `/` (image par defaut absolue)
- verifier `sitemap.xml` avec origin canonique `https://www.accesdirectaide.fr`

## Data quality scan (P8-C)

Objectif:
- executer un scan humain de qualite de donnees
- alimenter la review queue admin
- traiter les items (`open` -> `resolved` ou `ignored`)

Endpoints admin (token requis, names only):
- `POST /api/admin/review-queue/scan`
- `GET /api/admin/review-queue?status=open&limit=50`
- `PATCH /api/admin/review-queue/:id`

Exemple de scan manuel (sans valeurs en clair):

```bash
export PROD_URL="https://www.accesdirectaide.fr"
export ADMIN_TOKEN="(dans ton terminal)"

curl -sS \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"limitPerType":200}' \
  "$PROD_URL/api/admin/review-queue/scan"
```

Verification rapide:
- ouvrir `/admin/review-queue`
- verifier que des items `open` apparaissent
- traiter un item en `resolved` ou `ignored`

Variables env concernees (names only):
- `DATA_AIDES_STALE_DAYS`
- `DATA_DEMARCHES_STALE_DAYS`
- `DATA_STRUCTURES_STALE_DAYS`
- `DATA_REVIEW_SCAN_LIMIT_PER_TYPE`

## Ingestion hardening verification (P8-D)

Objectif:
- garantir la tracabilite via `SourceDocument`
- verifier l'idempotence (`created/updated/skippedExisting`)
- detecter la derive via Review Queue

Checks rapides:

```bash
# 1) declencher un run cron actualites (secret dans terminal uniquement)
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.accesdirectaide.fr/api/cron/actualites"

# 2) verifier que les items de review queue drift existent si besoin
curl -sS -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://www.accesdirectaide.fr/api/admin/review-queue?status=open&limit=50&reason=MISSING_SOURCE_DOCUMENT"
```

Attendu:
- le cron retourne des stats avec `created`, `updated`, `skippedExisting`
- les relances a payload identique augmentent surtout `skippedExisting`
- la review queue remonte `MISSING_SOURCE_DOCUMENT` / `MISSING_SOURCE_URL` si la traceability manque

Variables ingestion (names only):
- `INGESTION_PARSER_VERSION`
- `INGESTION_DRY_RUN`
- `INGESTION_MAX_ITEMS_PER_RUN`

## Provenance & Freshness UI (P8-E)

Objectif:
- rendre visible la fraicheur (`date_verification`) et la provenance (`SourceDocument`) sur les pages publiques
- verifier rapidement le rendu detail + listing sans exposer de donnees internes

Checklist visuelle:
1. Ouvrir une fiche publique (`/aides/:slug`, `/demarches/:slug`, `/structures/:slug`, `/actualites/:slug`).
2. Verifier le bloc `Provenance et fraicheur`:
   - badge `A jour` / `A verifier` / `A risque` / `Non verifie`
   - date `Derniere verification`
   - date `Derniere collecte`
   - lien `Source` (host visible, ouvre un lien externe)
3. Sur les listings publics (`/aides`, `/demarches`, `/annuaire`, `/actualites`), verifier la ligne compacte:
   - `Verifie: dd/MM/yyyy` si disponible
   - `Source: <host>` si disponible

Contrat API associe (public):
- `provenance.verifiedAt`
- `provenance.fetchedAt`
- `provenance.sourceUrl`
- `provenance.sourceHost`

## Doctolib social pro API core (P9-C)

Objectif:
- activer le socle DB + API pro-only pour motifs, disponibilites, slots et rendez-vous
- conserver un scope strict par structure (`requireProStructureContext`) et refuser le cross-tenant

Checklist migration (additive only):
1. Deployer les migrations Prisma en environnement cible.
2. Verifier que les nouvelles tables existent:
   - `ProRdvService`
   - `ProAvailabilityRule`
   - `ProAppointment`
   - `ProTimeOff`
3. Verifier qu'aucune table historique n'a ete alteree/supprimee.

Sanity API (token Pro dans le terminal uniquement):

```bash
# 1) services
curl -sS -H "Authorization: Bearer $PRO_JWT" \
  "https://www.accesdirectaide.fr/api/pro/services"

# 2) disponibilites
curl -sS -H "Authorization: Bearer $PRO_JWT" \
  "https://www.accesdirectaide.fr/api/pro/availability"

# 3) slots
curl -sS -H "Authorization: Bearer $PRO_JWT" \
  "https://www.accesdirectaide.fr/api/pro/slots?serviceId=<SERVICE_ID>&from=2026-03-01T00:00:00.000Z&to=2026-03-03T00:00:00.000Z"

# 4) appointments
curl -sS -H "Authorization: Bearer $PRO_JWT" \
  "https://www.accesdirectaide.fr/api/pro/appointments?from=2026-03-01T00:00:00.000Z&to=2026-03-03T00:00:00.000Z"
```

Attendu:
- `401` sans JWT pro.
- `403` en cross-tenant.
- `200/201` pour les operations valides sur la structure du ProUser.

## Doctolib social pro UI + readiness DB (P9-D)

Objectif:
- livrer une UI Pro minimale sous `/pro/rdv/*` (agenda, services, disponibilites, absences, creation RDV)
- verifier rapidement que les tables P9-C sont bien presentes via un endpoint readiness

Routes front principales:
- `/pro/rdv/agenda`
- `/pro/rdv/services`
- `/pro/rdv/disponibilites`
- `/pro/rdv/new`
- `/pro/rdv/absences`

Endpoint readiness:
- `GET /api/monitor/pro-rdv`
  - `200`: toutes les tables RDV sont presentes
  - `503`: au moins une table manque (`missingTables`)

Checklist de deploiement:
1. Appliquer la migration SQL P9-C sur staging/prod:
   - `prisma/migrations/20260305000000_add_pro_rdv_core/migration.sql`
2. Verifier l'endpoint readiness:
   - `curl -sS "https://www.accesdirectaide.fr/api/monitor/pro-rdv"`
3. Verifier l'espace Pro:
   - connexion Pro JWT
   - acces `/pro/rdv/agenda`
   - creation d'un RDV via `/pro/rdv/new`
   - creation d'une absence via `/pro/rdv/absences`

Sanity API timeoff (token Pro dans le terminal uniquement):

```bash
curl -sS -H "Authorization: Bearer $PRO_JWT" \
  "https://www.accesdirectaide.fr/api/pro/timeoff"
```
