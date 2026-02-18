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

## Diagnostic rapide

1. `/api/monitor/core` en `503`
- verifier DB
- verifier KV
- verifier latence/timeouts reseau

2. `/api/monitor/cron/actualites` en `503`
- verifier `/api/admin/cron-runs?job=actualites&limit=20`
- verifier scheduling Vercel cron
- verifier logs ingestion

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

Signaux ingestion hardening:
- les runs cron exposent `created/updated/skippedExisting` pour surveiller l'anti-churn
- les entites ingerees doivent pointer vers `SourceDocument` (traceability)
