# Routes API

Ce document liste toutes les routes définies dans `api/routes.js` et leur contrat.

## Public Endpoints

| Method | Path | Handler | Auth | Response | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | `_handlers/health.js` | None | `{ status: "ok", env: "..." }` | - |
| `GET` | `/api/taxonomy` | `_handlers/taxonomy.js` | None | `{ categories: [], situations: [] }` | - |
| `GET` | `/api/aides` | `_handlers/aides.js` | None | `{ data: [], meta: {} }` | 400 |
| `GET` | `/api/aides/:slug` | `_handlers/aides.js` | None | `{ data: {} }` | 404 |
| `GET` | `/api/demarches` | `_handlers/demarches.js` | None | `{ data: [], meta: {} }` | 400 |
| `GET` | `/api/demarches/:slug` | `_handlers/demarches.js` | None | `{ data: {} }` | 404 |
| `GET` | `/api/structures` | `_handlers/structures.js` | None | `{ data: [], meta: {} }` | 400 |
| `GET` | `/api/structures/:slug` | `_handlers/structures.js` | None | `{ data: {} }` | 404 |
| `GET` | `/api/actualites` | `_handlers/actualites.js` | None | `{ data: [], meta: {} }` | 400 |
| `GET` | `/api/actualites/:slug` | `_handlers/actualites.js` | None | `{ data: {} }` | 404 |
| `GET` | `/api/search` | `_handlers/search.js` | None | `{ data: [], meta: {} }` | 400 |
| `POST` | `/api/public/messages` | `_handlers/public/messages.js` | None | `{ success: true }` | 400 |
| `POST` | `/api/public/suggest-structure` | `_handlers/public/suggest-structure.js` | None | `{ success: true }` | 400 |
| `POST` | `/api/appointments` | `_handlers/public/appointments/create.js` | None | `{ appointmentId: "..." }` | 400, 409 |
| `GET` | `/api/public/availability` | `_handlers/public/availability.js` | None | `{ slots: [] }` | 400 |
| `POST` | `/api/appointments/cancel` | `_handlers/public/appointments/cancel.js` | Token | `{ success: true }` | 400, 404 |

## Pro Endpoints (`/api/pro`)

| Method | Path | Handler | Auth | Response | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/pro/auth/login` | `_handlers/pro/auth/login.js` | None | `{ token: "..." }` | 401 |
| `GET` | `/api/pro/me` | `_handlers/pro/me.js` | JWT (Pro) | `{ user: {}, structure: {} }` | 401 |
| `GET` | `/api/pro/appointments` | `_handlers/pro/appointments/index.js` | JWT (Pro) | `{ data: [] }` | 401 |
| `POST` | `/api/pro/availability` | `_handlers/pro/availability.js` | JWT (Pro) | `{ success: true }` | 400 |
| `GET` | `/api/pro/messages` | `_handlers/pro/messages.js` | JWT (Pro) | `{ data: [] }` | 401 |

## Admin Endpoints (`/api/admin`)

| Method | Path | Handler | Auth | Response | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | `_handlers/auth/login.js` | None | `{ token: "..." }` | 401 |
| `GET` | `/api/auth/me` | `_handlers/auth/me.js` | Bearer (Admin) | `{ user: "admin" }` | 401 |
| `GET` | `/api/admin/inbox` | `_handlers/admin/inbox.js` | Bearer (Admin) | `{ messages: [] }` | 401 |
| `POST` | `/api/admin/actions` | `_handlers/admin/actions.js` | Bearer (Admin) | `{ success: true }` | 401 |
| `GET` | `/api/admin/runs` | `_handlers/admin/runs.js` | Bearer (Admin) | `{ runs: [] }` | 401 |

## Cron Endpoints (`/api/cron`)

Ces endpoints sont protégés par `CRON_SECRET` dans les headers.

| Method | Path | Handler | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cron/pipeline` | `_handlers/cron/pipeline.js` | Cron Secret | Pipeline global d'ingestion |
| `GET` | `/api/cron/ingest-structures` | `_handlers/cron/ingest-structures.js` | Cron Secret | Ingestion structures |
| `GET` | `/api/cron/ingest-aids` | `_handlers/cron/ingest-aids.js` | Cron Secret | Ingestion aides |
| `GET` | `/api/cron/link-check` | `_handlers/cron/link-check.js` | Cron Secret | Vérification liens morts |

## Monitoring Endpoints

| Method | Path | Handler | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/monitor/core` | `_handlers/monitor/core.js` | None | Métriques de base |
| `GET` | `/api/monitor/pro-rdv` | `_handlers/monitor/pro-rdv.js` | None | Métriques RDV Pro |
