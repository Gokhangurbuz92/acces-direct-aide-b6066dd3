# 01 - Repo Map AS-IS

**Date:** 2026-01-27
**Etat:** Current (AS-IS)
**Preuves:** `/release/v1.0.0/proofs/00-mapping/`

## 1. Arborescence & Responsabilités

L'architecture actuelle est un monorepo hybride "Vite SPA + Vercel Serverless API".

### Structure Principale

| Dossier | Type | Description |
| :--- | :--- | :--- |
| **`src/`** | **Frontend** | Application React (Vite). Routes définies dans `src/pages/index.jsx`. Entrée via `src/main.jsx`. |
| **`api/`** | **Backend** | API Node.js Serverless. Entrée principale `api/index.js` (dispatch) ou handlers individuels dans `api/_handlers/`. |
| **`prisma/`** | **Data** | Schéma de base de données (PostgreSQL), migrations, et scripts de seed. |
| **`scripts/`** | **Ops** | Scripts de maintenance, ingestion, vérification (`verify-*.js`), et CI. |
| **`public/`** | **Assets** | Fichiers statiques servis à la racine (robots.txt, images, etc.). |
| **`.github/`** | **CI/CD** | Workflows GitHub Actions. |
| **`docs/`** | **Doc** | Documentation projet. |
| **`e2e/`, `tests/`** | **QA** | Tests End-to-End (Playwright) et Unitaires (Vitest). |

### Fichiers de Configuration Clés

- `package.json` : Dépendances, scripts NPM.
- `vercel.json` : Configuration déploiement Vercel (rewrites, crons, headers).
- `vite.config.js` : Configuration build Frontend.
- `.env.*` : Variables d'environnement (locale, example).

## 2. Points d'Entrée (Entry Points)

### Frontend (React Router)
*Source: `proofs/00-mapping/routes-front.txt`*

Les routes sont définies centralement dans `src/pages/index.jsx`.
- **Public**: `/`, `/aides`, `/demarches`, `/structures`, `/actualites`.
- **Pro** (`/pro/*`): `/login`, `/dashboard`, `/appointments`.
- **Admin** (`/admin/*`): `/aides`, `/structures`, `/review`, `/sync` (protégé par `AdminRoute`).

### API (Serverless Routes)
*Source: `proofs/00-mapping/endpoints-api.txt`*

L'API utilise un pattern hybride : dispatch centralisé via `api/index.js` ET handlers serverless directs.

- **Handlers Directs** (`api/_handlers/`):
    - `api/_handlers/auth/*`: Login, Me.
    - `api/_handlers/pro/*`: Authentification et gestion Pro.
    - `api/_handlers/public/*`: Endpoints publics (appointments, stats).
    - `api/_handlers/cron/*`: Tâches planifiées (ingest, purge).
    - `api/_handlers/sitemap.js`, `robots.js`: SEO.

### Jobs & Ingestion
- **Crons**: Configurés dans `vercel.json`.
- **Scripts**: `api/_handlers/cron/pipeline.js` orchestre l'ingestion.

## 3. Variables d'Environnement (Env Vars)

*Source: `proofs/00-mapping/env-usage.txt`*

| Variable | Usage | Risque |
| :--- | :--- | :--- |
| `DATABASE_URL` / `POSTGRES_PRISMA_URL` | Connexion DB Prisma | Critique |
| `JWT_SECRET` | Signature Tokens Auth | Critique |
| `ADMIN_TOKEN` | Auth Admin Simple (Legacy?) | Critique |
| `CRON_SECRET` | Protection Endpoints Cron | Critique |
| `ENCRYPTION_KEY` | Chiffrement Données (Crypto) | Critique |
| `VITE_SENTRY_DSN` / `SENTRY_DSN` | Monitoring Sentry | Moyen |
| `VITE_DEV_LOGIN_ENABLED` | Bypass Auth en Dev | **STOP LIST** (Si true en prod) |
| `KV_REST_API_*` / `REDIS_URL` | Rate Limiting / Cache | Moyen |
| `VITE_GIT_COMMIT_SHA` / `VERCEL_...` | Versioning / Traceability | Info |

## 4. STOP LIST (Risques Identifiés)

Les éléments suivants nécessitent une attention immédiate (P0) :

| Fichier | Problème | Gravité |
| :--- | :--- | :--- |
| `api/lib/crypto.js` | **Hardcoded Fallback Key**: `default-long-secret-key-32-chars-!!` si `ENCRYPTION_KEY` manquant. | **CRITIQUE** |
| `api/_utils/auth.js` | **Weak Auth Check**: `token === process.env.ADMIN_TOKEN`. Auth statique sans rotation facile. | Élevée |
| `api/_handlers/tools.js` | **Backdoor**: `if (process.env.VITE_DEV_LOGIN_ENABLED === 'true') return true;`. Risque majeur si activé en prod. | **CRITIQUE** |
| `api/_handlers/sentry-test.js` | **Exposition DSN?**: Vérifier si d'autres secrets ne sont pas exposés via ce handler de test. | Moyenne |
| `src/main.jsx` | **Logs Environment**: `import.meta.env.MODE` exposé côté client (normal mais à surveiller). | Faible |

---
**Note**: Cette cartographie est basée strictement sur l'analyse statique du code au 27/01/2026.
