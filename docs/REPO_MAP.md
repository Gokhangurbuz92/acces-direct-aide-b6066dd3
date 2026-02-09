# Cartographie du Répertoire (REPO_MAP)

Ce document est la source de vérité pour la structure du projet `AccesDirectAide`.

## Vue d'ensemble

Le projet est une architecture Monorepo "Serverless" hébergée sur Vercel.
- **Front**: React SPA (Vite)
- **API**: Node.js Serverless Functions (dossier `api/`)
- **DB**: PostgreSQL (Neon) géré via Prisma

## Structure détaillée

### Racine / Config
**Chemin**: `./`
- **Rôle**: Configuration globale du projet, du déploiement et des outils de développement.
- **Dépendances**: `package.json`, `vercel.json`
- **Owner**: Tech Lead
- **Risques Principaux**:
  - Une modification de `vercel.json` peut casser le routing API ou les headers de sécurité.
  - `package.json` gère les dépendances unifiées (Front + API), risque de conflits de versions.

### Front (Source)
**Chemin**: `src/`
- **Rôle**: Code source de l'application React (SPA).
- **Organisation**:
  - `pages/`: Composants de pages (liés au routeur)
  - `components/`: Composants réutilisables (UI, Layout)
  - `api/`: Client API frontend (fetch wrappers)
  - `utils/`: Utilitaires purs JS (Décision: Projet 100% JS, pas de TS strict)
- **Dépendances**: React, Tailwind, Vite (build)
- **Owner**: Frontend
- **Risques Principaux**:
  - Le routing (`pages/index.jsx`) doit être synchronisé avec l'API.
  - Performance (Bundle size) si imports non optimisés.

### API (Backend)
**Chemin**: `api/`
- **Rôle**: Backend Serverless. Expose les endpoints REST et gère la logique métier.
- **Organisation**:
  - `index.js` & `routes.js`: Point d'entrée et définition du routeur monolithique.
  - `client.js`: Client API unique (src/api/client.js), pas de version JSX.
  - `_handlers/`: Logique métier par domaine (aides, structures, booking...).
  - `_utils/`: Sécurité, Middleware, Sentry, Rate Limit.
  - `lib/`: Services techniques (Ingestion, Crypto, Logger).
    - Note: `api/lib/falc-summarizer.js` est la source de vérité pour le FALC (pas de doublon racine).
- **Dépendances**: Node.js, Prisma Client
- **Owner**: API
- **Risques Principaux**:
  - "Shadowing" des routes Vercel si `routes.js` est mal ordonné.
  - Cold starts si les handlers sont trop lourds.
  - Sécurité (Auth) gérée manuellement dans `_utils/auth.js`.

### Prisma (Base de Données)
**Chemin**: `prisma/`
- **Rôle**: Définition du schéma de base de données et migrations.
- **Fichiers clés**: `schema.prisma`, `migrations/`
- **Owner**: DB / Backend
- **Risques Principaux**:
  - Migrations destructives en production.
  - Désynchronisation entre le client généré (`@prisma/client`) et la DB réelle.

### Scripts (Ops & Maintenance)
**Chemin**: `scripts/`
- **Rôle**: Scripts de maintenance, verification, seed, et ingestion manuelle.
- **Fichiers clés**: `generate-repo-map.sh` (génère l'inventaire).
- **Dépendances**: Node.js, Shell, Python (parfois)
- **Owner**: DevOps / Ops
- **Risques Principaux**:
  - Scripts obsolètes pouvant corrompre les données.
  - Doivent être exécutés avec les bonnes variables d'environnement.

### Docs (Documentation)
**Chemin**: `docs/`
- **Rôle**: Documentation projet, guides d'exploitation, rapports d'exécution.
- **Fichiers clés**:
  - `REPO_MAP.md` (Cartographie fonctionnelle)
  - `REPO_FILES.txt` (Inventaire technique exhaustif)
  - `API_CONTRACT.md`, `RUNBOOK.md`
- **Owner**: Tous
- **Risques Principaux**: Documentation obsolète induisant en erreur.

### Data (Données Statiques)
**Chemin**: `data/`
- **Rôle**: Sources de données statiques (CSV, JSON) pour l'initialisation ou les tests.
- **Owner**: Data
- **Risques Principaux**: Données sensibles committées par erreur (PII).

### Tests & E2E
**Chemin**: `tests/` (unitaires), `e2e/` (Playwright)
- **Rôle**: Assurance qualité.
- **Owner**: QA / Dev
- **Risques Principaux**:
  - Tests flakiess (instables) bloquant la CI.
  - Couverture insuffisante sur les parcours critiques (RDV, Aides).

## Fichiers à ignorer (Git Hygiene)
Les dossiers suivants sont strictement ignorés par Git :
- `node_modules/`
- `venv/` (Python env)
- `test-results/`, `playwright-report/`
- `dist/`, `.vercel/`
- `.env`, `.env.local` (seul `.env.example` est versionné)
- `cookies*.txt`, `test-img*.jpg`
- `uploads_mock/` (stockage temporaire dev)
