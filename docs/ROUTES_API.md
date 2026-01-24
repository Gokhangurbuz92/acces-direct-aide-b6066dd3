# Routes API

Ce document recense les endpoints de l'API Serverless (`api/routes.js`).

## Standards
- **Authentification**: `Authorization: Bearer <token>`
- **Rate Limit**: X-RateLimit-* headers
- **Format**: JSON `{ data, meta, error }` ou JSON standard.

## Codes Erreur Communs
- `200 OK`: Succès.
- `201 Created`: Ressource créée.
- `400 Bad Request`: Validation échouée (paramètres manquants ou invalides).
- `401 Unauthorized`: Token manquant ou invalide.
- `403 Forbidden`: Droits insuffisants (ex: Pro accédant à une autre structure).
- `404 Not Found`: Ressource inexistante.
- `409 Conflict`: Conflit d'état (ex: Double booking, email déjà utilisé).
- `429 Too Many Requests`: Rate limit dépassé.
- `500 Internal Server Error`: Bug serveur.

## Endpoints

| Path | Method | Handler | Auth | Description |
|------|--------|---------|------|-------------|
| **Core / Root** | | | | |
| `/api/health` | GET | `_handlers/health.js` | Public | Vérification état santé |
| `/api/upload` | POST | `_handlers/upload.js` | Pro/Token | Upload fichier crypté |
| `/api/download` | GET | `_handlers/download.js` | Pro/Token | Download fichier crypté |
| `/api/taxonomy` | GET | `_handlers/taxonomy.js` | Public | Catégories, situations, types |
| **Auth** | | | | |
| `/api/auth/login` | POST | `_handlers/auth/login.js` | Public | Login Admin |
| `/api/auth/me` | GET | `_handlers/auth/me.js` | Admin | Profil Admin |
| **Espace Pro** | | | | |
| `/api/pro/auth/login` | POST | `_handlers/pro/auth/login.js` | Public | Login Pro |
| `/api/pro/auth/register` | POST | `_handlers/pro/auth/register.js` | Public | Inscription Pro |
| `/api/pro/me` | GET | `_handlers/pro/me.js` | Pro | Profil Pro courant |
| `/api/pro/appointments` | GET | `_handlers/pro/appointments/list.js` | Pro | Liste RDV structure |
| `/api/pro/appointments/cancel` | POST | `_handlers/pro/appointments/cancel.js` | Pro | Annulation RDV par Pro |
| `/api/pro/availability` | GET, POST | `_handlers/pro/availability.js` | Pro | Gestion créneaux |
| `/api/pro/messages` | GET, POST | `_handlers/pro/messages.js` | Pro | Messagerie Pro |
| **Espace Public / RDV** | | | | |
| `/api/appointments` | POST | `_handlers/booking/create.js` | Public | Prise RDV (Tokenized) |
| `/api/appointments/cancel` | POST | `_handlers/public/appointments/cancel.js` | Token | Annulation par Bénéficiaire |
| `/api/public/availability` | GET | `_handlers/public/availability.js` | Public | Disponibilités structure |
| `/api/public/messages` | GET, POST | `_handlers/public/messages.js` | Token | Messagerie Bénéficiaire |
| **Entités Publiques** | | | | |
| `/api/aides` | GET | `_handlers/aides.js` | Public | Liste/Recherche Aides |
| `/api/demarches` | GET | `_handlers/demarches.js` | Public | Liste/Recherche Démarches |
| `/api/structures` | GET | `_handlers/structures.js` | Public | Annuaire Structures |
| `/api/actualites` | GET | `_handlers/actualites.js` | Public | Actualités |
| `/api/guides` | GET | `_handlers/guides.js` | Public | Guides (Bonnes pratiques) |
| `/api/tools` | GET | `_handlers/tools.js` | Public | Outils |
| `/api/dispositifs` | GET | `_handlers/dispositifs/index.js` | Public | Dispositifs |
| **Admin** | | | | |
| `/api/admin/inbox` | GET | `_handlers/admin/inbox.js` | Admin | Boîte de réception Admin |
| `/api/admin/actions` | POST | `_handlers/admin/actions.js` | Admin | Actions (validate, reject) |
| `/api/admin/runs` | GET | `_handlers/admin/runs.js` | Admin | Historique Cron |
| `/api/admin/privacy/export` | GET | `_handlers/admin/privacy/export.js` | Admin | Export RGPD |
| `/api/admin/privacy/delete` | POST | `_handlers/admin/privacy/delete.js` | Admin | Suppression RGPD |
| **Cron** | | | | |
| `/api/cron/pipeline` | GET | `_handlers/cron/pipeline.js` | Vercel | Pipeline ingestion principal |
| `/api/cron/purge` | GET | `_handlers/cron/purge.js` | Vercel | Purge logs/temps |

---
*Généré automatiquement le: $(date +%Y-%m-%d)*
