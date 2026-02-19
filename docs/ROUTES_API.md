# Documentation des Routes API

Ce document liste toutes les routes API définies dans `api/routes.js`.
L'authentification et les autorisations sont gérées par les handlers ou des middlewares.

## 1. Routes Système & Racine

| Méthode | Chemin | Handler | Description | Auth |
|---|---|---|---|---|
| ALL | `/api/upload` | `_handlers/upload.js` | Upload de fichiers (Memory/Busboy) | Public / Admin (selon action) |
| GET | `/api/download` | `_handlers/download.js` | Téléchargement fichiers | Public |
| GET | `/api/health` | `_handlers/health.js` | Vérification santé simple | Public |
| GET | `/api/health/deep` | `_handlers/health-deep.js` | Vérification santé complète (DB, etc) | Admin |
| GET | `/api/monitor/cron/actualites` | `_handlers/monitor/cron-actualites.js` | Monitoring public freshness cron actualités | Public |
| GET | `/api/monitor/core` | `_handlers/monitor/core.js` | Monitoring public uptime core (DB + KV) | Public |
| GET | `/api/monitor/data-quality` | `_handlers/monitor/data-quality.js` | Monitoring public de la review queue (seuils P0/total) | Public |
| GET | `/api/monitor/ingestion-freshness` | `_handlers/monitor/ingestion-freshness.js` | Monitoring public de fraicheur ingestion (SourceDocument) | Public |
| GET | `/api/monitor/pro-rdv` | `_handlers/monitor/pro-rdv.js` | Readiness DB du module RDV Pro (`ProRdvService`, `ProAvailabilityRule`, `ProAppointment`, `ProTimeOff`) | Public |
| GET | `/api/healthz` | `_handlers/health.js` | Alias Health | Public |
| GET | `/api/robots.txt` | `_handlers/robots.js` | Robots API (root servi en statique via `public/robots.txt`) | Public |
| GET | `/api/sitemap.xml` | `_handlers/sitemap.js` | Sitemap dynamique (exposé en root via `/sitemap.xml`) | Public |
| GET | `/api/login-pro-guard` | `_handlers/login-pro-guard.js` | Guard redirection Pro | Public |
| GET | `/api/taxonomy` | `_handlers/taxonomy.js` | Référentiel taxonomies | Public |

## 2. Authentification (Admin)

| Méthode | Chemin | Handler | Description | Auth |
|---|---|---|---|---|
| POST | `/api/auth/login` | `_handlers/auth/login.js` | Connexion Admin (`AUTH_MODE=token|jwt`) | Public |
| GET | `/api/auth/me` | `_handlers/auth/me.js` | Introspection session (`session.kind=admin|pro`) | Bearer Token |

## 3. Espace Pro

> Contrat P9-B: les routes `/api/pro/*` acceptent **uniquement** un Pro JWT valide.
> `ADMIN_TOKEN` et les JWT admin sont explicitement refuses.

| Méthode | Chemin | Handler | Description | Auth |
|---|---|---|---|---|
| POST | `/api/pro/auth/login` | `_handlers/pro/auth/login.js` | Connexion Pro | Public |
| POST | `/api/pro/auth/register` | `_handlers/pro/auth/register.js` | Inscription Pro | Public |
| POST | `/api/pro/auth/forgot-password` | `_handlers/pro/auth/forgot-password.js` | Oubli mot de passe | Public |
| POST | `/api/pro/auth/reset-password` | `_handlers/pro/auth/reset-password.js` | Reset mot de passe | Public |
| GET | `/api/pro/me` | `_handlers/pro/me.js` | Profil Pro | Pro JWT |
| GET/POST/PATCH/PUT/DELETE | `/api/pro/services` | `_handlers/pro/services.js` | CRUD motifs RDV (scope structure Pro) | Pro JWT |
| GET/PUT/POST | `/api/pro/availability` | `_handlers/pro/availability.js` | Règles de disponibilités (`rules` / `slots_json`) | Pro JWT |
| GET | `/api/pro/slots` | `_handlers/pro/slots.js` | Génération de créneaux (`serviceId`, `from`, `to`) | Pro JWT |
| GET/POST/PATCH | `/api/pro/appointments` | `_handlers/pro/appointments/index.js` | Liste + création + mise à jour statut RDV | Pro JWT |
| POST | `/api/pro/appointments/cancel` | `_handlers/pro/appointments/cancel.js` | Annulation RDV (compat héritée) | Pro JWT |
| GET/POST/PATCH/PUT/DELETE | `/api/pro/timeoff` | `_handlers/pro/timeoff.js` | CRUD absences structure (impact slots) | Pro JWT |
| GET/POST | `/api/pro/messages` | `_handlers/pro/messages.js` | Messagerie Pro | Pro JWT |

Codes de réponse attendus sur le coeur P9-C/P9-D (`/api/pro/services`, `/api/pro/availability`, `/api/pro/slots`, `/api/pro/appointments`, `/api/pro/timeoff`):
- `200`/`201`: succès.
- `400`: paramètres invalides (date range, payload incomplet, etc.).
- `401`: token Pro manquant/invalide.
- `403`: tentative cross-tenant (structure différente).

## 4. Contenu Public (Métier)

| Méthode | Chemin | Handler | Description | Auth |
|---|---|---|---|---|
| GET | `/api/aides` | `_handlers/aides.js` | Liste/Recherche Aides | Public |
| GET | `/api/aides/:slug` | `_handlers/aides.js` | Détail Aide | Public |
| POST | `/api/search` | `_handlers/search.js` | Recherche globale | Public |
| GET | `/api/structures` | `_handlers/structures.js` | Annuaire Structures | Public |
| GET | `/api/structures/:slug` | `_handlers/structures.js` | Détail Structure | Public |
| GET | `/api/demarches` | `_handlers/demarches.js` | Liste Démarches | Public |
| GET | `/api/actualites` | `_handlers/actualites.js` | Liste Actualités | Public |
| GET | `/api/guides` | `_handlers/guides.js` | Guides | Public |
| GET | `/api/tools` | `_handlers/tools.js` | Outils | Public |
| GET | `/api/dispositifs` | `_handlers/dispositifs/index.js` | Dispositifs | Public |
| GET | `/api/ressources` | `_handlers/ressources.js` | Ressources | Public |
| GET | `/api/reports` | `_handlers/reports.js` | Rapports / Stats publiques | Public |

### Contrat Provenance Public (P8-E)

Les endpoints publics de contenu (`/api/aides`, `/api/demarches`, `/api/structures`, `/api/actualites`, en list + detail) exposent un bloc `provenance` minimal:

```json
{
  "provenance": {
    "verifiedAt": "ISO string | null",
    "fetchedAt": "ISO string | null",
    "sourceUrl": "string | null",
    "sourceHost": "string | null"
  }
}
```

Notes:
- `verifiedAt` provient de `date_verification` si disponible.
- `fetchedAt` et `sourceUrl` proviennent prioritairement de `SourceDocument`.
- `sourceHost` est derive de `sourceUrl` (hostname safe).
- Le payload public n'expose pas `raw_content`, `content_hash` ni metadata volumineuses de `SourceDocument`.

## 5. Interactions Publiques

| Méthode | Chemin | Handler | Description | Auth |
|---|---|---|---|---|
| POST | `/api/public/messages` | `_handlers/public/messages.js` | Envoi message contact | Public |
| POST | `/api/public/suggest-structure` | `_handlers/public/suggest-structure.js` | Suggestion structure | Public |
| GET | `/api/public/stats` | `_handlers/public/stats.js` | Statistiques usage | Public |
| GET | `/api/public/availability` | `_handlers/public/availability.js` | Créneaux disponibles | Public |
| POST | `/api/appointments` | `_handlers/public/appointments/create.js` | Prise de RDV | Public |
| POST | `/api/appointments/cancel` | `_handlers/public/appointments/cancel.js` | Annulation RDV (Token) | Public (Token) |

## 6. Cron & Maintenance

| Méthode | Chemin | Handler | Description | Auth |
|---|---|---|---|---|
| GET | `/api/cron/pipeline` | `_handlers/cron/pipeline.js` | Orchestrateur ingestion | Cron Secret |
| GET | `/api/cron/actualites` | `_handlers/cron/actualites.js` | Ingestion actus | Cron Secret |
| GET/POST | `/api/cron/review-queue/scan` | `_handlers/cron/review-queue-scan.js` | Scan data quality automatise (cron) | Cron Secret / Vercel Cron (prod) |
| GET | `/api/cron/ingest-structures` | `_handlers/cron/ingest-structures.js` | Ingestion structures | Cron Secret |
| GET | `/api/cron/ingest-aids` | `_handlers/cron/ingest-aids.js` | Ingestion aides | Cron Secret |
| GET | `/api/cron/purge` | `_handlers/cron/purge.js` | Purge données | Cron Secret |
| GET | `/api/cron/link-check` | `_handlers/cron/link-check.js` | Vérification liens | Cron Secret |

## 7. Administration (Back-office)

> Contrat P9-B: les routes `/api/admin/*` acceptent uniquement les credentials admin
> (token statique admin ou session admin JWT). Les Pro JWT sont refuses.

| Méthode | Chemin | Handler | Description | Auth |
|---|---|---|---|---|
| GET | `/api/admin/privacy/export` | `_handlers/admin/privacy/export.js` | Export RGPD | Admin |
| POST | `/api/admin/privacy/delete` | `_handlers/admin/privacy/delete.js` | Suppression RGPD | Admin |
| GET | `/api/admin/inbox` | `_handlers/admin/inbox.js` | Boîte de réception | Admin |
| POST | `/api/admin/actions` | `_handlers/admin/actions.js` | Actions génériques | Admin |
| GET | `/api/admin/runs` | `_handlers/admin/runs.js` | Liste runs cron | Admin |
| GET | `/api/admin/cron-runs` | `_handlers/admin/cron-runs.js` | Détail runs cron | Admin |
| GET | `/api/admin/partnerships` | `_handlers/admin/partnerships.js` | Partenariats | Admin |
| POST | `/api/admin/link-checks` | `_handlers/admin/link-checks.js` | Lance link check | Admin |
| POST | `/api/admin/validate-publication` | `_handlers/admin/validate-publication.js` | Validation contenu | Admin |
| POST | `/api/admin/review-queue/scan` | `_handlers/admin/review-queue.js` | Lance un scan data quality | Admin |
| GET | `/api/admin/review-queue` | `_handlers/admin/review-queue.js` | Liste review queue (filtres status/entityType/reason) | Admin |
| PATCH | `/api/admin/review-queue/bulk` | `_handlers/admin/review-queue.js` | Action de masse (`resolved`/`ignored`) sur une liste d'ids | Admin |
| PATCH | `/api/admin/review-queue/:id` | `_handlers/admin/review-queue.js` | Met a jour le statut d'un item (`resolved`/`ignored`) | Admin |

---
*Généré à partir de `api/routes.js`.*
