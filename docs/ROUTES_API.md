# Cartographie des Routes API

Ce document liste les endpoints de l'API Serverless définis dans `api/routes.js`.

## Core Data (Publique)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/aides` | `_handlers/aides.js` | None | Liste et recherche des aides |
| GET | `/api/structures` | `_handlers/structures.js` | None | Liste et recherche des structures |
| GET | `/api/demarches` | `_handlers/demarches.js` | None | Liste et recherche des démarches |
| GET | `/api/actualites` | `_handlers/actualites.js` | None | Liste des actualités |
| GET | `/api/guides` | `_handlers/guides.js` | None | Guides et bonnes pratiques |
| GET | `/api/tools` | `_handlers/tools.js` | None | Outils numériques |
| GET | `/api/dispositifs` | `_handlers/dispositifs/index.js` | None | Dispositifs (ex: RSA, APL) |
| GET | `/api/taxonomy` | `_handlers/taxonomy.js` | None | Référentiel (catégories, publics...) |
| GET | `/api/public/stats` | `_handlers/public/stats.js` | None | Statistiques d'usage |
| POST | `/api/public/suggest-structure` | `_handlers/public/suggest-structure.js` | None | Suggestion d'ajout de structure |

## Espace Rendez-vous (Booking)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/api/appointments` | `_handlers/public/appointments/create.js` | None | Création d'un RDV |
| POST | `/api/appointments/cancel` | `_handlers/public/appointments/cancel.js` | Token | Annulation d'un RDV |
| GET | `/api/public/availability` | `_handlers/public/availability.js` | None | Créneaux disponibles (public) |

## Espace Pro

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/api/pro/auth/login` | `_handlers/pro/auth/login.js` | None | Connexion Pro (JWT) |
| POST | `/api/pro/auth/register` | `_handlers/pro/auth/register.js` | None | Inscription Pro |
| POST | `/api/pro/auth/forgot-password` | `_handlers/pro/auth/forgot-password.js` | None | Demande reset mot de passe |
| POST | `/api/pro/auth/reset-password` | `_handlers/pro/auth/reset-password.js` | None | Nouveau mot de passe |
| GET | `/api/pro/me` | `_handlers/pro/me.js` | Bearer | Profil Pro connecté |
| GET/POST | `/api/pro/messages` | `_handlers/pro/messages.js` | Bearer | Messagerie Pro |
| GET | `/api/pro/appointments` | `_handlers/pro/appointments/list.js` | Bearer | Liste des RDV |
| POST | `/api/pro/appointments/cancel` | `_handlers/pro/appointments/cancel.js` | Bearer | Annulation RDV (Côté Pro) |
| GET/POST | `/api/pro/availability` | `_handlers/pro/availability.js` | Bearer | Gestion des disponibilités |
| GET | `/api/pro/team` | `_handlers/pro/team.js` | Bearer | Membres de l'équipe (si structure) |
| GET | `/api/pro/services` | `_handlers/pro/services.js` | Bearer | Services proposés |

## Admin

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/api/auth/login` | `_handlers/auth/login.js` | None | Connexion Admin |
| GET | `/api/auth/me` | `_handlers/auth/me.js` | Session | Profil Admin |
| GET | `/api/admin/inbox` | `_handlers/admin/inbox.js` | Admin | Boîte de réception globale |
| POST | `/api/admin/actions` | `_handlers/admin/actions.js` | Admin | Actions (ex: valider structure) |
| GET | `/api/admin/runs` | `_handlers/admin/runs.js` | Admin | Logs d'exécution Cron |
| GET | `/api/admin/privacy/export` | `_handlers/admin/privacy/export.js` | Admin | Export RGPD |
| POST | `/api/admin/privacy/delete` | `_handlers/admin/privacy/delete.js` | Admin | Suppression RGPD |

## Système / Cron

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/health` | `_handlers/health.js` | None | Healthcheck |
| GET | `/api/cron/pipeline` | `_handlers/cron/pipeline.js` | Cron Secret | Pipeline principal (Sync) |
| GET | `/api/cron/ingest-structures` | `_handlers/cron/ingest-structures.js` | Cron Secret | Ingestion structures |
| GET | `/api/cron/purge` | `_handlers/cron/purge.js` | Cron Secret | Purge (Logs, RGPD) |
| GET | `/api/robots.txt` | `_handlers/robots.js` | None | SEO Robots |
| GET | `/api/sitemap.xml` | `_handlers/sitemap.js` | None | SEO Sitemap |
