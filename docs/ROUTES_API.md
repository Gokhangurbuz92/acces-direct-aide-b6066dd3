# Routes API

Documentation des endpoints API définis dans `api/routes.js` et gérés via le routeur monolithique `api/index.js`.

## Vue d'ensemble

- **Base URL**: `/api`
- **Format Réponse**: JSON `{ data, meta, error }` (Voir `docs/API_CONTRACT.md`)
- **Authentification**: Bearer Token (JWT) pour Admin/Pro.

## 1. Routes Publiques (Core)

| Path | Handler | Méthodes | Description |
| ---- | ------- | -------- | ----------- |
| `/aides/*` | `_handlers/aides.js` | GET | Liste ou détail d'une aide (par slug/id). |
| `/demarches/*` | `_handlers/demarches.js` | GET | Liste ou détail d'une démarche. |
| `/structures/*` | `_handlers/structures.js` | GET | Annuaire structures. |
| `/actualites/*` | `_handlers/actualites.js` | GET | Actualités. |
| `/guides/*` | `_handlers/guides.js` | GET | Guides. |
| `/tools/*` | `_handlers/tools.js` | GET | Outils. |
| `/dispositifs/*` | `_handlers/dispositifs/index.js` | GET | Dispositifs. |
| `/taxonomy` | `_handlers/taxonomy.js` | GET | Catégories, Tags, Publics. |

## 2. Publiques (Fonctionnel)

| Path | Handler | Méthodes | Description |
| ---- | ------- | -------- | ----------- |
| `/health` | `_handlers/health.js` | GET | Healthcheck. |
| `/robots.txt` | `_handlers/robots.js` | GET | SEO Robots. |
| `/sitemap.xml` | `_handlers/sitemap.js` | GET | SEO Sitemap. |
| `/upload` | `_handlers/upload.js` | POST | Upload fichier (Memory/Mock). |
| `/download` | `_handlers/download.js` | GET | Téléchargement fichier. |
| `/public/stats` | `_handlers/public/stats.js` | GET | Statistiques publiques. |
| `/public/availability` | `_handlers/public/availability.js` | GET | Disponibilité créneaux RDV. |
| `/public/messages` | `_handlers/public/messages.js` | POST | Envoi message (contact/benef). |
| `/public/suggest-structure` | `_handlers/public/suggest-structure.js` | POST | Suggestion structure. |
| `/appointments` | `_handlers/public/appointments/create.js` | POST | **Création RDV**. |
| `/appointments/cancel` | `_handlers/public/appointments/cancel.js` | POST | Annulation RDV (Token). |

## 3. Espace Pro (`/pro`)

Nécessite généralement un token Pro.

| Path | Handler | Description |
| ---- | ------- | ----------- |
| `/pro/auth/login` | `_handlers/pro/auth/login.js` | Connexion Pro. |
| `/pro/auth/register` | `_handlers/pro/auth/register.js` | Inscription Pro. |
| `/pro/me` | `_handlers/pro/me.js` | Profil courant. |
| `/pro/messages` | `_handlers/pro/messages.js` | Messagerie Pro. |
| `/pro/appointments` | `_handlers/pro/appointments/list.js` | Liste RDV structure. |
| `/pro/appointments/cancel` | `_handlers/pro/appointments/cancel.js` | Annulation côté Pro. |
| `/pro/availability` | `_handlers/pro/availability.js` | Gestion disponibilités. |

## 4. Admin (`/admin`)

Nécessite authentification Admin (Cookie/Token).

| Path | Handler | Description |
| ---- | ------- | ----------- |
| `/auth/login` | `_handlers/auth/login.js` | Connexion Admin. |
| `/auth/me` | `_handlers/auth/me.js` | Session Admin. |
| `/admin/inbox` | `_handlers/admin/inbox.js` | Gestion messages entrants. |
| `/admin/actions` | `_handlers/admin/actions.js` | Actions manuelles. |
| `/admin/runs` | `_handlers/admin/runs.js` | Logs Cron/Jobs. |
| `/admin/partnerships` | `_handlers/admin/partnerships.js` | Gestion partenaires. |
| `/admin/privacy/export` | `_handlers/admin/privacy/export.js` | Export RGPD. |
| `/admin/privacy/delete` | `_handlers/admin/privacy/delete.js` | Suppression RGPD. |

## 5. Cron / Système

| Path | Handler | Description |
| ---- | ------- | ----------- |
| `/cron/pipeline` | `_handlers/cron/pipeline.js` | Orchestrateur sync. |
| `/cron/ingest-structures` | `_handlers/cron/ingest-structures.js` | Import structures. |
| `/cron/ingest-aids` | `_handlers/cron/ingest-aids.js` | Import aides. |
| `/cron/purge` | `_handlers/cron/purge.js` | Nettoyage données. |
