# Routes API

Ce document liste les routes définies dans le backend Serverless (`api/routes.js`).

## 1. Routes Publiques (Core)

Accessibles sans authentification.

| Method | Path | Handler File | Rôle |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | `api/_handlers/health.js` | Check santé service |
| `GET` | `/api/aides*` | `api/_handlers/aides.js` | Recherche/Détail aides |
| `GET` | `/api/demarches*` | `api/_handlers/demarches.js` | Recherche/Détail démarches |
| `GET` | `/api/structures*` | `api/_handlers/structures.js` | Annuaire structures |
| `GET` | `/api/actualites*` | `api/_handlers/actualites.js` | Actualités |
| `GET` | `/api/guides*` | `api/_handlers/guides.js` | Guides |
| `GET` | `/api/tools*` | `api/_handlers/tools.js` | Outils |
| `GET` | `/api/dispositifs*` | `api/_handlers/dispositifs/index.js` | Dispositifs |
| `GET` | `/api/ressources*` | `api/_handlers/ressources.js` | Ressources documentaires |
| `POST` | `/api/search` | `api/_handlers/search.js` | Recherche globale |
| `GET` | `/api/taxonomy` | `api/_handlers/taxonomy.js` | Taxonomie (catégories) |
| `GET` | `/api/public/stats` | `api/_handlers/public/stats.js` | Statistiques publiques |
| `POST` | `/api/public/messages` | `api/_handlers/public/messages.js` | Envoi message contact |
| `POST` | `/api/public/suggest-structure` | `api/_handlers/public/suggest-structure.js` | Suggestion ajout structure |

## 2. Routes Rendez-vous (Public)

| Method | Path | Handler File | Rôle |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/public/availability` | `api/_handlers/public/availability.js` | Disponibilités structure |
| `POST` | `/api/appointments` | `api/_handlers/public/appointments/create.js` | Création RDV |
| `POST` | `/api/appointments/cancel` | `api/_handlers/public/appointments/cancel.js` | Annulation RDV |
| `GET` | `/api/messages*` | `api/_handlers/messages.js` | Messagerie RDV |

## 3. Routes Pro (Authentifiées)

Authentification via JWT (Header `Authorization: Bearer <token>`).

| Method | Path | Handler File | Rôle |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/pro/auth/login` | `api/_handlers/pro/auth/login.js` | Login Pro |
| `POST` | `/api/pro/auth/register` | `api/_handlers/pro/auth/register.js` | Inscription Pro |
| `GET` | `/api/pro/me` | `api/_handlers/pro/me.js` | Profil courant |
| `GET` | `/api/pro/appointments` | `api/_handlers/pro/appointments/index.js` | Liste RDV |
| `POST` | `/api/pro/appointments/cancel` | `api/_handlers/pro/appointments/cancel.js` | Annuler RDV |
| `GET/POST` | `/api/pro/availability` | `api/_handlers/pro/availability.js` | Gestion dispos |
| `GET/POST` | `/api/pro/services` | `api/_handlers/pro/services.js` | Gestion services |
| `GET/POST` | `/api/pro/slots` | `api/_handlers/pro/slots.js` | Gestion créneaux |
| `GET/POST` | `/api/pro/messages` | `api/_handlers/pro/messages.js` | Messagerie Pro |
| `GET` | `/api/pro/messages/conversations` | `api/_handlers/pro/messages-conversations.js` | Conversations |

## 4. Routes Admin (Authentifiées)

Authentification via Token statique ou Session Admin.

| Method | Path | Handler File | Rôle |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | `api/_handlers/auth/login.js` | Login Admin |
| `GET` | `/api/auth/me` | `api/_handlers/auth/me.js` | Profil Admin |
| `GET` | `/api/admin/inbox` | `api/_handlers/admin/inbox.js` | Boîte réception |
| `POST` | `/api/admin/actions` | `api/_handlers/admin/actions.js` | Actions manuelles |
| `GET` | `/api/admin/runs` | `api/_handlers/admin/runs.js` | Logs jobs |
| `GET` | `/api/admin/cron-runs` | `api/_handlers/admin/cron-runs.js` | Détail cron |
| `POST` | `/api/admin/link-checks` | `api/_handlers/admin/link-checks.js` | Vérification liens |
| `GET` | `/api/admin/review-queue` | `api/_handlers/admin/review-queue.js` | File de révision |

## 5. Cron & System

Routes appelées par Vercel Cron ou scripts de maintenance.

| Method | Path | Handler File | Rôle |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cron/pipeline` | `api/_handlers/cron/pipeline.js` | Pipeline global |
| `GET` | `/api/cron/actualites` | `api/_handlers/cron/actualites.js` | Ingestion Actus |
| `GET` | `/api/cron/ingest-aids` | `api/_handlers/cron/ingest-aids.js` | Ingestion Aides |
| `GET` | `/api/cron/ingest-structures` | `api/_handlers/cron/ingest-structures.js` | Ingestion Structures |
| `GET` | `/api/cron/link-check` | `api/_handlers/cron/link-check.js` | Check liens morts |
| `GET` | `/api/cron/purge` | `api/_handlers/cron/purge.js` | Purge RGPD |
| `GET` | `/api/sitemap.xml` | `api/_handlers/sitemap.js` | Sitemap |
| `GET` | `/api/robots.txt` | `api/_handlers/robots.js` | Robots.txt |
| `GET` | `/api/upload` | `api/_handlers/upload.js` | Upload fichier |
| `GET` | `/api/download` | `api/_handlers/download.js` | Téléchargement |
