# Observability

## Objectif
Diagnostiquer rapidement les incidents runtime sans exposer de donnees sensibles.

## Endpoints de monitoring recommandes

1. `GET /api/monitor/core` (public)
- Usage: monitor uptime infra core (DB + KV) via BetterUptime/UptimeRobot/StatusCake.
- Semantique:
  - `200`: DB + KV OK.
  - `503`: DB ou KV indisponible (ou timeout).
  - `405`: methode non supportee.
- Header attendu: `Cache-Control: no-store`
- Header attendu: `X-Robots-Tag: noindex, nofollow`

2. `GET /api/monitor/cron/actualites` (public)
- Usage: monitor freshness du cron actualites.
- Semantique:
  - `200`: cron fresh.
  - `503`: cron stale/missing/error.

3. `GET /api/monitor/data-quality` (public)
- Usage: monitor volume review queue sans token admin.
- Semantique:
  - `200`: seuils data quality OK.
  - `503`: `openTotal`/`openP0` au-dessus des seuils, ou DB indisponible.

4. `GET /api/monitor/ingestion-freshness` (public)
- Usage: monitor freshness globale ingestion depuis `SourceDocument`.
- Semantique:
  - `200`: derniere collecte recente.
  - `503`: stale/missing/error.

5. `GET /status` (public, front noindex)
- Usage: vue publique temps reel de l'etat monitor (`data-quality` + `ingestion-freshness`).
- Semantique:
  - carte `Data Quality`: agrege `openTotal/openP0` et status `OK/KO`.
  - carte `Ingestion Freshness`: agrege `latestFetchedAt/ageHours` et status `OK/KO`.
- SEO:
  - `meta robots` force `noindex, nofollow`.

## Endpoint diagnostique protege

`GET /api/health/deep` reste l'endpoint admin/cron pour diagnostic detaille (DB/KV/Storage + freshness cron).

## Telemetrie Sentry (safe tags)

Les requetes API ajoutent des tags Sentry filtrables:
- `request_id`
- `route`
- `route_group` (`public|admin|cron|monitor|health|other`)
- `vercel_env`
- `release`
- `http.method`

Pour les erreurs capturees centralement, `http.status_code` est ajoute quand disponible.

Contraintes de securite:
- pas de corps de requete dans les events
- pas d'Authorization/Cookie/token en clair
- pas de valeurs d'env dans les logs/events

## Alerting manuel conseille

1. API errors spike
- Filtre: `level:error` + `http.status_code:500` (ou 5xx selon dashboard).
- Scope: `route_group:public` ou `route_group:monitor` selon besoin.

2. Core monitor down
- Uptime monitor sur `/api/monitor/core` avec alerte si `HTTP != 200`.

3. Cron freshness degradee
- Uptime monitor sur `/api/monitor/cron/actualites` avec alerte si `HTTP != 200`.

4. Data quality degradee
- Uptime monitor sur `/api/monitor/data-quality` avec alerte si `HTTP != 200`.

5. Ingestion stale
- Uptime monitor sur `/api/monitor/ingestion-freshness` avec alerte si `HTTP != 200`.

## Smoke observeability (local / runbook)

Commande:
```bash
npm run smoke:obs:prod
```

Options supportees:
- `--base-url <url>` (ex: URL preview/prod explicite)
- `--json` (sortie machine-readable)
- env fallback: `PROD_URL`, `TIMEOUT_MS`

Codes de sortie:
- `0`: checks critiques OK
- `2`: echec de checks critiques
- `1`: erreur d'usage (arguments invalides)

Exemple JSON:
```bash
node scripts/obs-smoke.mjs --base-url "https://www.accesdirectaide.fr" --json
```

## Scheduled CI smoke (GitHub Actions)

Workflow: `.github/workflows/obs-smoke-prod.yml`

- declenchement: toutes les heures + manuel (`workflow_dispatch`)
- execution: `node scripts/obs-smoke.mjs --base-url $PROD_BASE_URL --json`
- en cas d'echec:
  - ouverture (ou commentaire) d'une issue unique `🚨 PROD smoke failed`
  - run marque en failed

Secret GitHub Actions requis (names only):
- `PROD_BASE_URL`

## Diagnostic rapide

1. `/api/monitor/core` en `503`
- verifier DB
- verifier KV
- verifier latence/timeouts reseau

2. `/api/monitor/cron/actualites` en `503`
- verifier `/api/admin/cron-runs?job=actualites&limit=20`
- verifier scheduling Vercel cron
- verifier logs ingestion

3. `/api/monitor/data-quality` en `503`
- verifier `MONITOR_DQ_OPEN_TOTAL_MAX` et `MONITOR_DQ_OPEN_P0_MAX`
- lancer un scan manuel review queue puis traiter les items critiques

4. `/api/monitor/ingestion-freshness` en `503`
- verifier cron ingestion (`/api/cron/actualites`, `/api/cron/review-queue/scan`)
- verifier presence/recence de `SourceDocument.fetched_at`

3. Correlation
- recuperer `x-request-id` et filtrer logs/Sentry avec `request_id`.

## Review Queue (Data Quality)

Objectif:
- detecter les contenus a risque (verification manquante/trop ancienne, slug invalide, champs obligatoires manquants)
- alimenter une file de traitement humaine en admin

Endpoints admin (token requis):
- `POST /api/admin/review-queue/scan`
- `GET /api/admin/review-queue?status=open&limit=50`
- `PATCH /api/admin/review-queue/:id` avec `{ \"status\": \"resolved\" | \"ignored\" }`

UI:
- `/admin/review-queue`

Signaux utiles:
- `reason` (ex: `MISSING_VERIFICATION`, `STALE_VERIFICATION`, `MISSING_SLUG`)
- drift ingestion: `MISSING_SOURCE_DOCUMENT`, `MISSING_SOURCE_URL`
- `severity` (`P0`, `P1`, `P2`)
- `status` (`open`, `resolved`, `ignored`)

Seuils data quality (env, names only):
- `DATA_AIDES_STALE_DAYS`
- `DATA_DEMARCHES_STALE_DAYS`
- `DATA_STRUCTURES_STALE_DAYS`
- `DATA_REVIEW_SCAN_LIMIT_PER_TYPE`
- `DATA_REVIEW_SCAN_CRON_LIMIT_PER_TYPE`
- `DATA_REVIEW_SCAN_CRON_ENABLED`
- `MONITOR_DQ_OPEN_TOTAL_MAX`
- `MONITOR_DQ_OPEN_P0_MAX`
- `MONITOR_INGEST_FRESHNESS_MAX_AGE_HOURS`

Signaux ingestion hardening:
- les runs cron exposent `created/updated/skippedExisting` pour surveiller l'anti-churn
- les entites ingerees doivent pointer vers `SourceDocument` (traceability)
