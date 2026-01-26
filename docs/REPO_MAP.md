# Cartographie du Répertoire

Ce document décrit la structure de haut niveau du repository `AccesDirectAide`.

## Vue d'ensemble

Le projet est une application web composée d'un frontend React (Vite SPA) et d'une API Serverless (Node.js/Vercel) connectée à une base de données PostgreSQL via Prisma.

## Structure détaillée

### Racine / Config
*Fichiers: `package.json`, `vercel.json`, `vite.config.js`, `eslint.config.js`, `.env*`, `playwright.config.js`*

* **Rôle**: Configuration globale du projet, gestion des dépendances, pipeline de build, règles de déploiement (Vercel) et de qualité de code (ESLint).
* **Dépendances**: Node.js, npm, Vercel CLI.
* **Owner**: Tech Lead / DevOps.
* **Risques Principaux**:
    * Mauvaise configuration des rewrites/redirects dans `vercel.json` (impact SEO/API).
    * Fuite de secrets via `.env` commis par erreur.
    * Conflits de versions de dépendances (`package-lock.json`).

### Front Source (`src/`)
*Dossiers: `src/pages`, `src/components`, `src/api`, `src/hooks`, `src/lib`, `src/utils`*

* **Rôle**: Code source de l'application SPA (Single Page Application). Contient le routeur, les vues (pages), les composants UI, et le client API.
* **Dépendances**: React, Vite, Tailwind CSS, Radix UI.
* **Owner**: Frontend Developer.
* **Risques Principaux**:
    * Performance (taille du bundle, re-renders inutiles).
    * Accessibilité (non-respect des normes RGAA/FALC).
    * Gestion d'état complexe et erreurs d'hydratation/rendu.
    * "Clics morts" (liens cassés ou pages orphelines).

### API (`api/`)
*Dossiers: `api/_handlers`, `api/_utils`, `api/lib`, `api/routes.js`*

* **Rôle**: Backend Serverless hébergé sur Vercel. Gère la logique métier, l'authentification, les interactions avec la DB et les services tiers.
* **Dépendances**: Node.js, Prisma Client, bibliothèques de crypto/auth.
* **Owner**: Backend Developer.
* **Risques Principaux**:
    * Sécurité (Authentification, RBAC, Injection SQL via Prisma raw queries).
    * Performance (Cold starts, latence DB).
    * Gestion des erreurs (500 silencieuses).
    * Shadowing de routes (ordre de déclaration dans `routes.js`).

### Prisma (`prisma/`)
*Fichiers: `schema.prisma`, `migrations/`, `seed.js`*

* **Rôle**: Définition du modèle de données (ORM), historique des migrations de schéma, et scripts d'initialisation de la base (seeding).
* **Dépendances**: PostgreSQL, Prisma CLI.
* **Owner**: Backend / Database Engineer.
* **Risques Principaux**:
    * Migrations destructives (perte de données).
    * Désynchronisation entre le code (`Prisma Client`) et la DB réelle.
    * Requêtes non optimisées (N+1, indexes manquants).

### Scripts (`scripts/`)
*Fichiers: `verify-*.js`, `ingest-*.js`, `seed-*.js`, `generate-repo-map.sh`*

* **Rôle**: Outils d'automatisation pour le développement, la CI/CD, la vérification de l'intégrité, et l'ingestion de données.
* **Dépendances**: Bash, Node.js, Python (outils legacy).
* **Owner**: DevOps / Tous.
* **Risques Principaux**:
    * Scripts obsolètes ne reflétant plus la structure actuelle.
    * Exécution accidentelle en production (purge, seed destructif).
    * Dépendances locales non documentées.

### Docs (`docs/`)
*Fichiers: `*.md`, `REPO_FILES.txt`, `REPO_MAP.md`*

* **Rôle**: Documentation technique, architecture, procédures d'exploitation (Runbook), et suivi des livrables (Lots).
* **Dépendances**: Markdown.
* **Owner**: Tous.
* **Risques Principaux**:
    * Documentation obsolète (Désynchronisation avec le code).
    * Information dispersée ou dupliquée.

### Data (`data/`)
*Fichiers: `*.csv`, `*.json`*

* **Rôle**: Fichiers de données statiques, sources pour l'ingestion ou le seeding initial (Aides, Structures, Démarches).
* **Dépendances**: Aucune.
* **Owner**: Product Owner / Data.
* **Risques Principaux**:
    * Données sensibles (PII) commises par erreur.
    * Formats incohérents cassant les scripts d'import.

### Tests / E2E (`tests/`, `e2e/`)
*Fichiers: `*.test.js`, `*.spec.js`, `playwright.config.js`*

* **Rôle**: Assurance qualité. Tests unitaires (Vitest) pour l'API/Libs et tests End-to-End (Playwright) pour les parcours critiques.
* **Dépendances**: Vitest, Playwright.
* **Owner**: QA / Developer.
* **Risques Principaux**:
    * Tests instables ("flaky") ralentissant la CI.
    * Faux sentiment de sécurité (couverture faible sur les cas limites).
