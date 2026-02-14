# Carte du dépôt (Repository Map)

Ce document recense les dossiers et fichiers principaux du projet `AccesDirectAide`, leur rôle, leur propriétaire (Front/API/DB) et les points de vigilance.
Il est généré manuellement mais validé par le script `scripts/generate-repo-map.sh` qui produit `docs/REPO_FILES.txt` (inventaire technique exhaustif).

## 1. Racine & Configuration

| Chemin | Rôle | Owner | Risques / Notes |
| :--- | :--- | :--- | :--- |
| `README.md` | Point d'entrée documentation projet | All | Doit refléter l'architecture réelle. |
| `package.json` | Dépendances & scripts NPM | All | Point critique CI/CD. |
| `vite.config.js` | Configuration Build Front (Vite) | Front | Gestion des proxy dev vs prod. |
| `vercel.json` | Configuration déploiement Vercel | Ops | Headers, Rewrites, Cron Jobs. |
| `.env.example` | Modèle des variables d'environnement | Ops | Ne doit contenir aucun secret. |
| `.gitignore` | Exclusions Git | All | Doit exclure venv, .env, artefacts. |
| `eslint.config.js` | Configuration Linter | All | Qualité du code. |

## 2. Frontend (`src/`)

Application Single Page (SPA) React + Vite.

| Chemin | Rôle | Owner | Risques / Notes |
| :--- | :--- | :--- | :--- |
| `src/main.jsx` | Point d'entrée React | Front | Montage de l'app. |
| `src/App.jsx` | Composant racine | Front | |
| `src/pages/index.jsx` | **Routeur Principal** | Front | Définition des routes & Lazy loading. Point critique de navigation. |
| `src/pages/` | Composants Page | Front | Une page par route (ex: `Home.jsx`, `Aides.jsx`). |
| `src/api/client.js` | Client API Axios/Fetch | Front | Centralise les appels API (à unifier avec client.jsx). |
| `src/components/` | Composants réutilisables | Front | UI Kit, Layouts, Guards. |
| `src/contexts/` | React Contexts | Front | État global (ex: FALC). |

## 3. API (`api/`)

Backend Serverless (Vercel Functions).

| Chemin | Rôle | Owner | Risques / Notes |
| :--- | :--- | :--- | :--- |
| `api/index.js` | Point d'entrée Serverless | API | |
| `api/routes.js` | **Routeur API** | API | Mapping URL -> Handler. Doit correspondre à `docs/ROUTES_API.md`. |
| `api/_handlers/` | Logique métier (Endpoints) | API | Un fichier par domaine/action. |
| `api/_utils/` | Utilitaires transverses | API | Auth, RateLimit, Prisma Singleton (`prisma.js`). |
| `api/lib/` | Services métier | API | Ingestion, Crypto, FALC. |
| `api/cron/` | Tâches planifiées | API | Ingestion de données, maintenance. |

## 4. Base de données (`prisma/`)

ORM Prisma + PostgreSQL.

| Chemin | Rôle | Owner | Risques / Notes |
| :--- | :--- | :--- | :--- |
| `prisma/schema.prisma` | Définition du modèle de données | DB | Source de vérité structure DB. |
| `prisma/migrations/` | Historique des migrations SQL | DB | Ne jamais modifier manuellement une migration appliquée. |
| `prisma/seed.js` | Script de peuplement initial | DB | Données de test/dev. |

## 5. Scripts & Ops (`scripts/`)

Outils de maintenance, vérification et ingestion manuelle.

| Chemin | Rôle | Owner | Risques / Notes |
| :--- | :--- | :--- | :--- |
| `scripts/generate-repo-map.sh`| Génère l'inventaire `docs/REPO_FILES.txt` | Ops | |
| `scripts/verify-*.js` | Scripts de vérification (Smoke tests) | Ops | Utilisés pour valider les déploiements. |
| `scripts/seed-*.js` | Scripts de seed spécifiques | DB | |
| `scripts/fix_*.py` | Outils Python de maintenance | Ops | Usage ponctuel. |

## 6. Documentation (`docs/`)

Base de connaissance du projet.

| Chemin | Rôle | Owner | Risques / Notes |
| :--- | :--- | :--- | :--- |
| `docs/REPO_MAP.md` | Ce fichier | Ops | Carte du territoire. |
| `docs/REPO_FILES.txt` | Inventaire technique auto-généré | Ops | Ne pas éditer manuellement. |
| `docs/ROUTES_FRONT.md` | Cartographie des routes Front | Front | (À venir) |
| `docs/ROUTES_API.md` | Cartographie des routes API | API | (À venir) |
| `docs/ADMIN_GUIDE.md` | Guide administrateur | Product | |

## 7. Données (`data/`)

Fichiers de données statiques ou sources.

| Chemin | Rôle | Owner | Risques / Notes |
| :--- | :--- | :--- | :--- |
| `data/*.csv` | Sources de données (Alsace, etc.) | Data | |
| `config/rss-sources.json` | Sources RSS pour ingestion | Data | Config critique pour le contenu "Actualités". |

## 8. Tests (`tests/`, `e2e/`)

| Chemin | Rôle | Owner | Risques / Notes |
| :--- | :--- | :--- | :--- |
| `e2e/` | Tests End-to-End (Playwright) | QA | Tests parcours critiques (Booking, Public). |
| `tests/` | Tests d'intégration/unitaires | Dev | |
