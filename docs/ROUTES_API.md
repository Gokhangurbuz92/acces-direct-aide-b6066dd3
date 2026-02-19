# Documentation API Routes

Ce fichier est généré automatiquement à partir de `api/routes.js`.
Il liste les routes définies et leurs gestionnaires.

| Path | Match | Handler File | Auth (Estimé) | Description |
|---|---|---|---|---|
| `/api/upload` | `exact` | `./_handlers/upload.js` | Public | - |
| `/api/download` | `exact` | `./_handlers/download.js` | Public | - |
| `/api/health` | `exact` | `./_handlers/health.js` | Public | - |
| `/api/health/deep` | `exact` | `./_handlers/health-deep.js` | Public | - |
| `/api/monitor/cron/actualites` | `exact` | `./_handlers/monitor/cron-actualites.js` | Public | - |
| `/api/monitor/core` | `exact` | `./_handlers/monitor/core.js` | Public | - |
| `/api/monitor/data-quality` | `exact` | `./_handlers/monitor/data-quality.js` | Public | - |
| `/api/monitor/ingestion-freshness` | `exact` | `./_handlers/monitor/ingestion-freshness.js` | Public | - |
| `/api/monitor/pro-rdv` | `exact` | `./_handlers/monitor/pro-rdv.js` | Public | - |
| `/api/healthz` | `exact` | `./_handlers/health.js` | Public | - |
| `/api/robots.txt` | `exact` | `./_handlers/robots.js` | Public | - |
| `/api/robots` | `exact` | `./_handlers/robots.js` | Public | - |
| `/api/sitemap.xml` | `exact` | `./_handlers/sitemap.js` | Public | - |
| `/api/sitemap` | `exact` | `./_handlers/sitemap.js` | Public | - |
| `/api/login-pro-guard` | `exact` | `./_handlers/login-pro-guard.js` | Public | - |
| `/api/taxonomy` | `exact` | `./_handlers/taxonomy.js` | Public | - |
| `/api/auth/login` | `exact` | `./_handlers/auth/login.js` | Public/Auth | - |
| `/api/auth/me` | `exact` | `./_handlers/auth/me.js` | Public/Auth | - |
| `/api/pro/auth/login` | `exact` | `./_handlers/pro/auth/login.js` | Pro | - |
| `/api/pro/auth/register` | `exact` | `./_handlers/pro/auth/register.js` | Pro | - |
| `/api/pro/auth/forgot-password` | `exact` | `./_handlers/pro/auth/forgot-password.js` | Pro | - |
| `/api/pro/auth/reset-password` | `exact` | `./_handlers/pro/auth/reset-password.js` | Pro | - |
| `/api/pro/me` | `exact` | `./_handlers/pro/me.js` | Pro | - |
| `/api/pro/services` | `exact` | `./_handlers/pro/services.js` | Pro | - |
| `/api/pro/slots` | `exact` | `./_handlers/pro/slots.js` | Pro | - |
| `/api/pro/messages` | `exact` | `./_handlers/pro/messages.js` | Pro | - |
| `/api/pro/appointments` | `exact` | `./_handlers/pro/appointments/index.js` | Pro | - |
| `/api/pro/appointments/cancel` | `exact` | `./_handlers/pro/appointments/cancel.js` | Pro | - |
| `/api/pro/availability` | `exact` | `./_handlers/pro/availability.js` | Pro | - |
| `/api/pro/timeoff` | `exact` | `./_handlers/pro/timeoff.js` | Pro | - |
| `/api/public/messages` | `exact` | `./_handlers/public/messages.js` | Public | - |
| `/api/public/suggest-structure` | `exact` | `./_handlers/public/suggest-structure.js` | Public | - |
| `/api/public/stats` | `exact` | `./_handlers/public/stats.js` | Public | - |
| `/api/public/availability` | `exact` | `./_handlers/public/availability.js` | Public | - |
| `/api/appointments` | `exact` | `./_handlers/public/appointments/create.js` | Public | - |
| `/api/appointments/cancel` | `exact` | `./_handlers/public/appointments/cancel.js` | Public | - |
| `/api/aides` | `prefix` | `./_handlers/aides.js` | Public | - |
| `/api/search` | `exact` | `./_handlers/search.js` | Public | - |
| `/api/structures` | `prefix` | `./_handlers/structures.js` | Public | - |
| `/api/demarches` | `prefix` | `./_handlers/demarches.js` | Public | Filtre les titres de test sur la surface publique |
| `/api/actualites` | `prefix` | `./_handlers/actualites.js` | Public | - |
| `/api/guides` | `prefix` | `./_handlers/guides.js` | Public | - |
| `/api/tools` | `prefix` | `./_handlers/tools.js` | Public | - |
| `/api/dispositifs` | `prefix` | `./_handlers/dispositifs/index.js` | Public | - |
| `/api/ressources` | `prefix` | `./_handlers/ressources.js` | Public | - |
| `/api/reports` | `prefix` | `./_handlers/reports.js` | Public | - |
| `/api/cron/pipeline` | `exact` | `./_handlers/cron/pipeline.js` | Public | - |
| `/api/cron/actualites` | `exact` | `./_handlers/cron/actualites.js` | Public | - |
| `/api/cron/review-queue/scan` | `exact` | `./_handlers/cron/review-queue-scan.js` | Public | - |
| `/api/cron/ingest-structures` | `exact` | `./_handlers/cron/ingest-structures.js` | Public | - |
| `/api/cron/ingest-aids` | `exact` | `./_handlers/cron/ingest-aids.js` | Public | - |
| `/api/cron/purge` | `exact` | `./_handlers/cron/purge.js` | Public | - |
| `/api/cron/link-check` | `exact` | `./_handlers/cron/link-check.js` | Public | - |
| `/api/admin/privacy/export` | `exact` | `./_handlers/admin/privacy/export.js` | Admin | - |
| `/api/admin/privacy/delete` | `exact` | `./_handlers/admin/privacy/delete.js` | Admin | - |
| `/api/admin/inbox` | `exact` | `./_handlers/admin/inbox.js` | Admin | - |
| `/api/admin/actions` | `exact` | `./_handlers/admin/actions.js` | Admin | - |
| `/api/admin/runs` | `exact` | `./_handlers/admin/runs.js` | Admin | - |
| `/api/admin/cron-runs` | `prefix` | `./_handlers/admin/cron-runs.js` | Admin | - |
| `/api/admin/partnerships` | `exact` | `./_handlers/admin/partnerships.js` | Admin | - |
| `/api/admin/link-checks` | `exact` | `./_handlers/admin/link-checks.js` | Admin | - |
| `/api/admin/validate-publication` | `exact` | `./_handlers/admin/validate-publication.js` | Admin | - |
| `/api/admin/review-queue` | `prefix` | `./_handlers/admin/review-queue.js` | Admin | - |
