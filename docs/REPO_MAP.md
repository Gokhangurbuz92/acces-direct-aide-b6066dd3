# Carte du Répertoire (Repository Map)

Ce document décrit l'organisation du code source du projet **AccesDirectAide**.

## 1. Racine & Configuration

| Fichier / Dossier | Rôle |
| ----------------- | ---- |
| `README.md` | Point d'entrée, documentation générale. |
| `package.json` | Définition des dépendances et scripts NPM. |
| `vite.config.js` | Configuration du bundler Vite (Frontend). |
| `vercel.json` | Configuration du déploiement Vercel (rewrites, crons, headers). |
| `eslint.config.js` | Configuration du linter ESLint. |
| `.gitignore` | Exclusions Git (fichiers générés, secrets). |
| `.env.example` | Modèle des variables d'environnement requises. |

## 2. Frontend (`src/`)

L'application est une Single Page Application (SPA) React construite avec Vite.

| Dossier | Contenu |
| ------- | ------- |
| `src/pages/` | Composants de pages (Vues). Contient aussi le routeur `index.jsx`. |
| `src/components/` | Composants React réutilisables (UI, Layout, Business). |
| `src/api/` | Client API frontend (appels vers le backend). |
| `src/hooks/` | Hooks React personnalisés. |
| `src/lib/` | Utilitaires frontend (ex: `utils.js`). |
| `src/utils/` | Fonctions utilitaires partagées. |

## 3. API Backend (`api/`)

Architecture Serverless (Vercel Functions) simulant une API monolithique via un routeur central.

| Dossier | Contenu |
| ------- | ------- |
| `api/index.js` | Point d'entrée de la fonction serverless. |
| `api/routes.js` | Définition centralisée des routes et mapping vers les handlers. |
| `api/_handlers/` | Logique métier des endpoints (Aides, Démarches, Structures, etc.). |
| `api/_utils/` | Utilitaires transverses (Auth, RateLimit, Crypto, Sentry). |
| `api/lib/` | Services et bibliothèques métier (Storage, Search, FALC). |

## 4. Base de Données (`prisma/`)

Le projet utilise Prisma comme ORM avec une base PostgreSQL (Neon).

| Fichier / Dossier | Rôle |
| ----------------- | ---- |
| `prisma/schema.prisma` | Définition du modèle de données. |
| `prisma/migrations/` | Historique des migrations de base de données. |
| `prisma/seed.js` | Script de peuplement initial de la base de données. |

## 5. Scripts & Outillage (`scripts/`)

Scripts de maintenance, vérification, ingestion de données et CI.

| Type | Exemples |
| ---- | -------- |
| **Ingestion** | `import-csv.js`, `seed-*.js` |
| **Vérification** | `verify-*.js`, `ci-healthcheck.js` |
| **Maintenance** | `generate-repo-map.sh`, `backfill-slugs.js` |

## 6. Documentation (`docs/`)

Documentation technique et fonctionnelle du projet.

| Fichier | Sujet |
| ------- | ----- |
| `REPO_MAP.md` | Cette carte. |
| `ROUTES_FRONT.md` | Liste des routes frontend et pages associées. |
| `ROUTES_API.md` | Documentation des endpoints API. |
| `RUNBOOK.md` | Procédures d'exploitation et gestion d'incidents. |

## 7. Données (`data/`)

Fichiers de données statiques ou sources pour l'ingestion (CSV, JSON).

## 8. Tests (`e2e/`, `tests/`)

| Dossier | Type de test |
| ------- | ------------ |
| `e2e/` | Tests End-to-End (Playwright). |
| `tests/` | Tests d'intégration et unitaires. |

---
**Note:** Ce fichier est maintenu manuellement pour décrire la structure logique. Pour la liste exhaustive des fichiers, voir `docs/REPO_FILES.txt`.
