# Cartographie des Routes API

Ce document liste l'ensemble des routes API définies dans `api/routes.js`, point d'entrée du routeur serverless.

## Définition des Routes

Le fichier `api/routes.js` mappe les chemins d'URL vers les fonctions "handlers" situées dans `api/_handlers/`.

| Path (Prefix `/api/`) | Handler File | Auth Required | Description |
|-----------------------|--------------|---------------|-------------|
| `/upload` | `_handlers/upload.js` | Pro/Admin | Upload de fichiers (vers Mock ou Storage) |
| `/download` | `_handlers/download.js` | Token | Téléchargement sécurisé de fichiers |
| `/health`, `/healthz` | `_handlers/health.js` | None | Statut de santé de l'API |
| `/robots.txt`, `/robots` | `_handlers/robots.js` | None | Génération dynamique robots.txt |
| `/sitemap.xml`, `/sitemap` | `_handlers/sitemap.js` | None | Génération dynamique sitemap.xml |
| `/login-pro-guard` | `_handlers/login-pro-guard.js` | None | Vérification état login pro |
| `/taxonomy` | `_handlers/taxonomy.js` | None | Taxonomie (catégories, tags) |
| `/auth/login` | `_handlers/auth/login.js` | None | Login Admin (Magic Link / Password) |
| `/auth/me` | `_handlers/auth/me.js` | Bearer | Profil Admin courant |
| `/pro/auth/login` | `_handlers/pro/auth/login.js` | None | Login Pro |
| `/pro/auth/register` | `_handlers/pro/auth/register.js` | None | Inscription Pro |
| `/pro/auth/forgot-password` | `_handlers/pro/auth/forgot-password.js` | None | Oubli mot de passe Pro |
| `/pro/auth/reset-password` | `_handlers/pro/auth/reset-password.js` | None | Reset mot de passe Pro |
| `/pro/me` | `_handlers/pro/me.js` | Bearer (Pro) | Profil Pro courant |
| `/pro/messages` | `_handlers/pro/messages.js` | Bearer (Pro) | Messagerie Pro |
| `/pro/appointments` | `_handlers/pro/appointments/list.js` | Bearer (Pro) | Liste RDV Pro |
| `/pro/appointments/cancel` | `_handlers/pro/appointments/cancel.js` | Bearer (Pro) | Annulation RDV Pro |
| `/pro/availability` | `_handlers/pro/availability.js` | Bearer (Pro) | Disponibilité Pro |
| `/public/messages` | `_handlers/public/messages.js` | Token | Messagerie Bénéficiaire (Lecture/Réponse) |
| `/public/suggest-structure` | `_handlers/public/suggest-structure.js` | None | Suggestion de structure |
| `/public/stats` | `_handlers/public/stats.js` | None | Statistiques publiques |
| `/public/availability` | `_handlers/public/availability.js` | None | Disponibilité publique RDV |
| `/appointments` | `_handlers/public/appointments/create.js` | None | Création RDV Public |
| `/appointments/cancel` | `_handlers/public/appointments/cancel.js` | Token | Annulation RDV Public |
| `/aides` | `_handlers/aides.js` | None (Get) | Aides (Liste/Détail). Admin pour Write. |
| `/structures` | `_handlers/structures.js` | None (Get) | Structures (Liste/Détail). Admin pour Write. |
| `/demarches` | `_handlers/demarches.js` | None (Get) | Démarches (Liste/Détail). Admin pour Write. |
| `/actualites` | `_handlers/actualites.js` | None (Get) | Actualités (Liste/Détail). |
| `/guides` | `_handlers/guides.js` | None (Get) | Guides. |
| `/tools` | `_handlers/tools.js` | None (Get) | Outils. |
| `/dispositifs` | `_handlers/dispositifs/index.js` | None (Get) | Dispositifs. |
| `/cron/pipeline` | `_handlers/cron/pipeline.js` | Cron Secret | Pipeline de synchro |
| `/cron/ingest-structures` | `_handlers/cron/ingest-structures.js` | Cron Secret | Ingestion structures |
| `/cron/purge` | `_handlers/cron/purge.js` | Cron Secret | Purge RGPD |
| `/admin/privacy/export` | `_handlers/admin/privacy/export.js` | Admin | Export Données Admin |
| `/admin/privacy/delete` | `_handlers/admin/privacy/delete.js` | Admin | Suppression Données Admin |
| `/admin/inbox` | `_handlers/admin/inbox.js` | Admin | Inbox Admin |
| `/admin/actions` | `_handlers/admin/actions.js` | Admin | Actions Admin (Test Sync, etc) |
| `/admin/runs` | `_handlers/admin/runs.js` | Admin | Historique Jobs |
| `/admin/partnerships` | `_handlers/admin/partnerships.js` | Admin | Gestion Partenariats |

**Note**: La colonne "Auth Required" est indicative. La vérification réelle se fait dans le handler via `requireAuth` ou `verifyToken`.
