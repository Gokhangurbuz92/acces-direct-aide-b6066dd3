# Cartographie du Répertoire

Ce document décrit l'organisation du code source du projet AccesDirectAide.
Il est généré à partir de l'inventaire technique `docs/REPO_FILES.txt` et de la documentation d'architecture.

## 1. Racine et Configuration

| Chemin | Rôle | Propriétaire | Notes / Vigilance |
|---|---|---|---|
| `README.md` | Point d'entrée projet | Ops | Doit refléter scripts & archi réelle |
| `package.json`, `package-lock.json` | Scripts + dépendances | Ops | |
| `vite.config.js`, `index.html` | Build Frontend (Vite) | Front | Attention aux rewrites SPA |
| `postcss.config.js`, `tailwind.config.js` | Configuration CSS | Front | |
| `vercel.json` | Configuration Vercel | Ops | Rewrites, headers, crons |
| `eslint.config.js` | Configuration Linting | Dev | |
| `.env.example` | Modèle variables d'environnement | Ops | Doit lister toutes les variables requises |
| `.gitignore` | Exclusion Git | Ops | |
| `prisma/schema.prisma` | Modèle de données | Backend | Slugs uniques, indexes |

## 2. Frontend (`src/`)

| Chemin | Rôle | Propriétaire | Notes / Vigilance |
|---|---|---|---|
| `src/main.jsx` | Point d'entrée React | Front | |
| `src/App.jsx` | Composant racine | Front | |
| `src/pages/index.jsx` | Routeur principal | Front | Définit toutes les routes |
| `src/pages/` | Pages de l'application | Front | |
| `src/components/` | Composants réutilisables | Front | |
| `src/contexts/` | Contextes React (Falc, etc.) | Front | |
| `src/hooks/` | Hooks personnalisés | Front | |
| `src/api/` | Client API Frontend | Front | `client.js` |
| `src/utils/` | Utilitaires Frontend | Front | |
| `src/styles/` | Styles globaux et tokens | Front | |

## 3. API (`api/`)

| Chemin | Rôle | Propriétaire | Notes / Vigilance |
|---|---|---|---|
| `api/index.js` | Point d'entrée Serverless | Backend | |
| `api/routes.js` | Mapping Routes -> Handlers | Backend | Point critique de sécurité |
| `api/_handlers/` | Handlers métier | Backend | Logique des endpoints |
| `api/_utils/` | Utilitaires transverses | Backend | Auth, RateLimit, Sentry, DB |
| `api/lib/` | Bibliothèques métier | Backend | Ingestion, Search, Crypto |
| `api/cron/` | Scripts planifiés | Backend | Ingestion, maintenance |

## 4. Données et Scripts

| Chemin | Rôle | Propriétaire | Notes / Vigilance |
|---|---|---|---|
| `prisma/migrations/` | Migrations de base de données | Backend | Ordre strict |
| `scripts/` | Scripts de maintenance/vérification | Ops | Seeds, verify, ingest |
| `data/` | Données statiques / Seed | Data | CSV sources |
| `config/` | Configuration métier | Data | Sources RSS, etc. |

## 5. Documentation (`docs/`)

| Chemin | Rôle | Propriétaire | Notes / Vigilance |
|---|---|---|---|
| `docs/REPO_MAP.md` | Cartographie (ce fichier) | Ops | |
| `docs/REPO_FILES.txt` | Inventaire technique généré | Ops | Ne pas éditer manuellement |
| `docs/ROUTES_FRONT.md` | Documentation routes Front | Front | |
| `docs/ROUTES_API.md` | Documentation routes API | Backend | |
| `docs/ADMIN_GUIDE.md` | Guide administrateur | Produit | |
| `docs/RUNBOOK.md` | Procédures d'exploitation | Ops | Incidents, Rollback |

## 6. Tests

| Chemin | Rôle | Propriétaire | Notes / Vigilance |
|---|---|---|---|
| `e2e/` | Tests End-to-End (Playwright) | QA | Parcours critiques |
| `tests/` | Tests d'intégration / Unitaires | Dev | |
| `api/tests/` | Tests spécifiques API | Backend | |

---
*Dernière mise à jour : via `scripts/generate-repo-map.sh`*
