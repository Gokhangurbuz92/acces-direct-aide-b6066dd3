# Routes API

Ce document recense l'ensemble des routes définies dans `api/routes.js`.

Toutes les routes sont préfixées par `/api` (ex: `/api/health`).

## 1. Routes Système & Utilitaires

| Path | Handler | Auth | Description |
|---|---|---|---|
| `/health` | `_handlers/health.js` | None | Vérification de santé (status 200) |
| `/healthz` | `_handlers/health.js` | None | Alias Health |
| `/robots.txt` | `_handlers/robots.js` | None | Robots.txt dynamique |
| `/robots` | `_handlers/robots.js` | None | Alias Robots |
| `/sitemap.xml` | `_handlers/sitemap.js` | None | Sitemap XML dynamique |
| `/sitemap` | `_handlers/sitemap.js` | None | Alias Sitemap |
| `/search` | `_handlers/search.js` | None | Recherche hybride aides (POST) |
| `/upload` | `_handlers/upload.js` | Admin/Pro | Upload de fichiers (mock ou stockage) |
| `/download` | `_handlers/download.js` | Admin/Pro | Téléchargement / Export |
| `/taxonomy` | `_handlers/taxonomy.js` | None | Référentiel (tags, catégories) |
| `/login-pro-guard` | `_handlers/login-pro-guard.js` | None | Check Pro Login availability |

## 2. Authentification & Pro

| Path | Handler | Auth | Description |
|---|---|---|---|
| `/auth/login` | `_handlers/auth/login.js` | None | Login Admin |
| `/auth/me` | `_handlers/auth/me.js` | Token | Profil Admin connecté |
| `/pro/auth/login` | `_handlers/pro/auth/login.js` | None | Login Pro |
| `/pro/auth/register` | `_handlers/pro/auth/register.js` | None | Inscription Pro |
| `/pro/auth/forgot-password` | `_handlers/pro/auth/forgot-password.js` | None | Oubli mot de passe |
| `/pro/auth/reset-password` | `_handlers/pro/auth/reset-password.js` | None | Reset mot de passe |
| `/pro/me` | `_handlers/pro/me.js` | Pro | Profil Pro connecté |
| `/pro/messages` | `_handlers/pro/messages.js` | Pro | Messagerie Pro |
| `/pro/appointments` | `_handlers/pro/appointments/list.js` | Pro | Liste RDV Pro |
| `/pro/appointments/cancel` | `_handlers/pro/appointments/cancel.js` | Pro | Annulation RDV par Pro |
| `/pro/availability` | `_handlers/pro/availability.js` | Pro | Gestion disponibilités |

## 3. Contenu Public (Core Data)

Ces routes gèrent le CRUD (Lecture publique, Écriture Admin).

| Path | Handler | Auth | Description |
|---|---|---|---|
| `/aides` | `_handlers/aides.js` | None / Admin | Liste Aides, Détail (/:slug) |
| `/structures` | `_handlers/structures.js` | None / Admin | Annuaire, Détail |
| `/demarches` | `_handlers/demarches.js` | None / Admin | Liste Démarches, Détail |
| `/actualites` | `_handlers/actualites.js` | None / Admin | Actualités |
| `/guides` | `_handlers/guides.js` | None / Admin | Bonnes pratiques |
| `/tools` | `_handlers/tools.js` | None / Admin | Outils |
| `/dispositifs` | `_handlers/dispositifs/index.js` | None / Admin | Dispositifs |
| `/ressources` | `_handlers/ressources.js` | None / Admin | Ressources (Générique) |
| `/reports` | `_handlers/reports.js` | None / Admin | Signalements de contenu |
| `/public/stats` | `_handlers/public/stats.js` | None | Statistiques publiques |
| `/public/messages` | `_handlers/public/messages.js` | None | Envoi message (Contact) |
| `/public/suggest-structure` | `_handlers/public/suggest-structure.js` | None | Suggestion ajout structure |

## 4. Prise de Rendez-vous (Public)

| Path | Handler | Auth | Description |
|---|---|---|---|
| `/public/availability` | `_handlers/public/availability.js` | None | Disponibilités publiques |
| `/appointments` | `_handlers/public/appointments/create.js` | None | Création RDV |
| `/appointments/cancel` | `_handlers/public/appointments/cancel.js` | Token | Annulation RDV (Bénéficiaire) |

## 5. Administration & Cron

| Path | Handler | Auth | Description |
|---|---|---|---|
| `/cron/pipeline` | `_handlers/cron/pipeline.js` | Cron Secret | Pipeline de synchro |
| `/cron/ingest-structures` | `_handlers/cron/ingest-structures.js` | Cron Secret | Ingestion structures |
| `/cron/ingest-aids` | `_handlers/cron/ingest-aids.js` | Cron Secret | Ingestion aides |
| `/cron/purge` | `_handlers/cron/purge.js` | Cron Secret | Purge RGPD |
| `/cron/link-check` | `_handlers/cron/link-check.js` | Cron Secret | Vérification liens morts |
| `/admin/privacy/export` | `_handlers/admin/privacy/export.js` | Admin | Export données personnelles |
| `/admin/privacy/delete` | `_handlers/admin/privacy/delete.js` | Admin | Suppression données |
| `/admin/inbox` | `_handlers/admin/inbox.js` | Admin | Boîte réception admin |
| `/admin/actions` | `_handlers/admin/actions.js` | Admin | Actions diverses (test sync) |
| `/admin/runs` | `_handlers/admin/runs.js` | Admin | Historique Jobs/Runs |
| `/admin/partnerships` | `_handlers/admin/partnerships.js` | Admin | Gestion Partenariats |
| `/admin/link-checks` | `_handlers/admin/link-checks.js` | Admin | Rapport liens morts |
| `/admin/validate-publication` | `_handlers/admin/validate-publication.js` | Admin | Validation contenu modéré |

## Conventions de Réponse

```json
{
  "data": { ... },     // Objet ou Tableau de résultats
  "meta": {            // Métadonnées (pagination, version)
    "total": 100,
    "page": 1
  },
  "error": null        // Présent si erreur (code, message)
}
```

## Codes HTTP Standards
- `200 OK` : Succès
- `201 Created` : Création réussie
- `400 Bad Request` : Erreur de validation
- `401 Unauthorized` : Token manquant ou invalide
- `403 Forbidden` : Droits insuffisants
- `404 Not Found` : Ressource introuvable
- `500 Internal Server Error` : Erreur serveur non gérée
