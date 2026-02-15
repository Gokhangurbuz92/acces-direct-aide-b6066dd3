# P6-B+ Observability (Health + Cron Audit + Admin)

Cette phase ajoute une base d'observabilite "safe" (redaction + correlation) sans exposer de secrets.

## Endpoints

### Health public (uptime)

- `GET /api/health` (alias `GET /api/healthz`)
- Objectif: verifier que le service repond (pas de check DB/KV/Storage).
- Reponse (extrait):
  - `ok: true`
  - `service`
  - `time` (ISO)
  - `vercelEnv`
  - `release` (sha ou `null`)
  - `requestId`
- Headers:
  - `Cache-Control: no-store`
  - `x-request-id: <id>`

### Health deep (diagnostic dependances, protege)

- `GET /api/health/deep`
- Auth accepte:
  - `Authorization: Bearer <ADMIN_TOKEN>` (recommande)
  - ou `x-cron-secret: <CRON_SECRET>` (fallback)
- Checks (timeout strict ~2s par dep):
  - DB: `SELECT 1`
  - KV: ping set/get/del si configure (sinon `skipped` en dev/test; `KO` en prod/preview)
  - Storage S3: `HeadBucket` si configure, sinon `skipped`
  - Gemini: ne fait aucun appel externe; expose uniquement `geminiKeyPresent` (boolean)
- HTTP:
  - `200` si OK
  - `503` si au moins une dependance critique est KO
- Reponse (extrait):
  - `ok: boolean`
  - `requestId`
  - `deps.db / deps.kv / deps.storage` (ok + durationMs + detail?)
  - `deps.sentry.dsnPresent` (boolean)

## Audit cron en DB (CronRun)

Un nouveau modele Prisma `CronRun` historise l'execution des jobs cron (statut, duree, metriques).

- Table: `CronRun`
- Champs cles:
  - `job`, `status` (`running|success|failed`)
  - `startedAt`, `finishedAt`, `durationMs`
  - `requestId`, `vercelEnv`, `release`
  - `metrics` (JSON), `errorSample` (string redacted/tronquee)

### Job instrumente

- `GET/POST /api/cron/actualites`
  - cree un `CronRun` au debut (apres auth + lock)
  - update en `success` ou `failed` avec metriques

## Admin API

Endpoints proteges par `Authorization: Bearer <ADMIN_TOKEN>`:

- `GET /api/admin/cron-runs?job=actualites&limit=50`
- `GET /api/admin/cron-runs/:id`

## UI admin

- Page: `/admin/observability`
- Contenu:
  - Health public + deep (deps)
  - Etat Sentry (DSN present + env/release)
  - Tableau des derniers `CronRun` pour `actualites`

Note: `/admin/health` redirige vers `/admin/observability`.

## Correlation / redaction

- Le header `x-request-id` est renvoye (quand disponible) pour faciliter la correlation logs/Sentry.
- Les logs structurés (API) appliquent une redaction best-effort:
  - suppression/masquage de cles sensibles: `token|secret|authorization|cookie|password|jwt|key|...`
  - pas de body brut en logs
  - masquage PII basique (email/telephone)

## Variables d'environnement (noms seulement)

- `ADMIN_TOKEN`
- `CRON_SECRET`
- `SENTRY_DSN`
- `DATABASE_URL`, `POSTGRES_URL_NON_POOLING`
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` (aliases Upstash acceptes)
- `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`
- `GEMINI_API_KEY` (optionnel, seulement presence checkee en deep health)

## Alerting / runbook (Sentry + operations)

Recommandations (a configurer dans Sentry UI):

1. Dashboard "API":
   - erreurs 5xx par endpoint (`route`)
2. Alert "Cron actualites failed":
   - filtrer sur tag `cron=actualites` ou message `health.deep.failed` selon usage
3. Alert "Health deep failing":
   - occurrences de `health.deep.failed` (level warning)

Uptime monitoring:

- Ping `GET /api/health` toutes les 2-5 minutes (UptimeRobot/BetterStack).
- Ne pas pinger `/api/health/deep` publiquement (endpoint protege).

Incidents frequents:

- Cron `401`:
  - verifier header `x-cron-secret` / `Authorization: Bearer` et `CRON_SECRET`.
- Cron `500`:
  - verifier `DATABASE_URL` + migrations
  - verifier access RSS (sources)
- Health deep `503`:
  - regarder `deps.db/kv/storage` pour isoler la dependance fautive
  - utiliser `requestId` pour retrouver les logs Vercel/Sentry

