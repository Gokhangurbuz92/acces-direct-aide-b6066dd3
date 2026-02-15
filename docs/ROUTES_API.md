# API Routes

Ce document liste les routes API définies dans `api/routes.js`.
L'architecture est "Monolithic Serverless" : un seul point d'entrée `api/index.js` qui dispatch vers les handlers.

## Special / Root

| Method | Path | Handler | Description |
|---|---|---|---|
| POST | `/api/upload` | `_handlers/upload.js` | Upload de fichiers (in-memory/storage) |
| GET | `/api/download` | `_handlers/download.js` | Téléchargement de fichiers |
| GET | `/api/health`, `/api/healthz` | `_handlers/health.js` | Healthcheck public minimal (uptime, no-store) |
| GET | `/api/health/deep` | `_handlers/health-deep.js` | Healthcheck deep (protégé Admin/Cron) : DB/KV/Storage + diagnostics |
| GET | `/api/robots.txt`, `/api/robots` | `_handlers/robots.js` | SEO robots.txt |
| GET | `/api/sitemap.xml`, `/api/sitemap` | `_handlers/sitemap.js` | SEO sitemap.xml |
| GET | `/api/login-pro-guard` | `_handlers/login-pro-guard.js` | Guard check |
| GET | `/api/taxonomy` | `_handlers/taxonomy.js` | Taxonomie (catégories, thèmes) |

## Auth (Admin)

| Method | Path | Handler | Description |
|---|---|---|---|
| POST | `/api/auth/login` | `_handlers/auth/login.js` | Connexion Admin |
| GET | `/api/auth/me` | `_handlers/auth/me.js` | Profil Admin |

## Pro Module

| Method | Path | Handler | Description |
|---|---|---|---|
| POST | `/api/pro/auth/login` | `_handlers/pro/auth/login.js` | Connexion Pro |
| POST | `/api/pro/auth/register` | `_handlers/pro/auth/register.js` | Inscription Pro |
| POST | `/api/pro/auth/forgot-password` | `_handlers/pro/auth/forgot-password.js` | Mot de passe oublié |
| POST | `/api/pro/auth/reset-password` | `_handlers/pro/auth/reset-password.js` | Reset mot de passe |
| GET | `/api/pro/me` | `_handlers/pro/me.js` | Profil Pro |
| GET | `/api/pro/messages` | `_handlers/pro/messages.js` | Messagerie Pro |
| GET | `/api/pro/appointments` | `_handlers/pro/appointments/list.js` | Liste RDV Pro |
| POST | `/api/pro/appointments/cancel` | `_handlers/pro/appointments/cancel.js` | Annulation RDV Pro |
| GET | `/api/pro/availability` | `_handlers/pro/availability.js` | Disponibilités Pro |

## Public Content & Interactive

| Method | Path | Handler | Description |
|---|---|---|---|
| POST | `/api/public/messages` | `_handlers/public/messages.js` | Envoi message public |
| POST | `/api/public/suggest-structure` | `_handlers/public/suggest-structure.js` | Suggestion structure |
| GET | `/api/public/stats` | `_handlers/public/stats.js` | Statistiques publiques |
| GET | `/api/public/availability` | `_handlers/public/availability.js` | Disponibilité publique RDV |
| POST | `/api/appointments` | `_handlers/public/appointments/create.js` | Prise de RDV |
| POST | `/api/appointments/cancel` | `_handlers/public/appointments/cancel.js` | Annulation RDV (Public) |

## Core Data Resources

Ces routes gèrent souvent GET (list/detail) et parfois POST/PUT/DELETE (admin).

| Path (Prefix) | Handler | Description |
|---|---|---|
| `/api/aides` | `_handlers/aides.js` | Aides (Listing, Détail via `?slug=` ou `/api/aides/:slug`) |
| `/api/search` | `_handlers/search.js` | Recherche globale |
| `/api/structures` | `_handlers/structures.js` | Structures (Annuaire) (Listing, Détail via `?slug=` ou `/api/structures/:slug`) |
| `/api/demarches` | `_handlers/demarches.js` | Démarches (Listing, Détail via `?slug=` ou `/api/demarches/:slug`) |
| `/api/actualites` | `_handlers/actualites.js` | Actualités (Listing, Détail via `?slug=` ou `/api/actualites/:slug`) |
| `/api/guides` | `_handlers/guides.js` | Guides |
| `/api/tools` | `_handlers/tools.js` | Outils |
| `/api/dispositifs` | `_handlers/dispositifs/index.js` | Dispositifs |
| `/api/ressources` | `_handlers/ressources.js` | Ressources documentaires |
| `/api/reports` | `_handlers/reports.js` | Signalements / Rapports |

## Cron Jobs (Vercel)

| Path | Handler | Schedule (vercel.json) |
|---|---|---|
| `/api/cron/actualites` | `_handlers/cron/actualites.js` | `0 * * * *` (Hourly) |
| `/api/cron/pipeline` | `_handlers/cron/pipeline.js` | (Manuel / Triggered) |
| `/api/cron/ingest-structures` | `_handlers/cron/ingest-structures.js` | `0 2 * * 0` (Weekly) |
| `/api/cron/ingest-aids` | `_handlers/cron/ingest-aids.js` | (Manuel / Triggered) |
| `/api/cron/purge` | `_handlers/cron/purge.js` | (Manuel / Triggered) |
| `/api/cron/link-check` | `_handlers/cron/link-check.js` | (Manuel / Triggered) |

## Admin Utilities

| Path | Handler | Description |
|---|---|---|
| `/api/admin/privacy/export` | `_handlers/admin/privacy/export.js` | Export RGPD |
| `/api/admin/privacy/delete` | `_handlers/admin/privacy/delete.js` | Suppression RGPD |
| `/api/admin/inbox` | `_handlers/admin/inbox.js` | Inbox Admin |
| `/api/admin/actions` | `_handlers/admin/actions.js` | Actions en masse |
| `/api/admin/runs` | `_handlers/admin/runs.js` | Historique Jobs |
| `/api/admin/cron-runs` | `_handlers/admin/cron-runs.js` | Historique des runs cron (CronRun) |
| `/api/admin/partnerships` | `_handlers/admin/partnerships.js` | Partenariats |
| `/api/admin/link-checks` | `_handlers/admin/link-checks.js` | Vérification liens |
| `/api/admin/validate-publication` | `_handlers/admin/validate-publication.js` | Validation publication |
