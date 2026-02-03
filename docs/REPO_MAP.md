# Cartographie du Dépôt (Official Repository Map)

## 1. Racine / Configuration
**Dossier :** `/`
- **Rôle :** Configuration globale du projet, dépendances, règles de build et de déploiement.
- **Dépendances :** Node.js, NPM, Vercel CLI.
- **Fichiers clés :**
  - `package.json` : Dépendances et scripts NPM.
  - `vite.config.js` : Configuration du build Front (Vite).
  - `vercel.json` : Configuration du déploiement Vercel (rewrites, crons, headers).
  - `.env.example` : Template des variables d'environnement.
  - `eslint.config.js` : Règles de linting.
- **Owner :** DevOps / Tech Lead.
- **Risques :** Une mauvaise configuration ici casse le build ou le déploiement (ex: variables manquantes).

## 2. Front App (SPA)
**Dossier :** `src/`
- **Rôle :** Application React (SPA) côté client.
- **Dépendances :** React, Vite, Tailwind CSS, Radix UI, API Backend.
- **Sous-dossiers :**
  - `pages/` : Composants pages (vues).
  - `components/` : Composants UI réutilisables.
  - `api/` : Client API (fetch wrappers).
  - `hooks/` : Hooks React personnalisés.
  - `utils/` : Utilitaires front-end.
- **Owner :** Front-end Developer.
- **Risques :** Routes orphelines, erreurs de rendu, appels API incorrects, bundle size trop lourd.

## 3. API (Serverless)
**Dossier :** `api/`
- **Rôle :** Backend serverless (Vercel Functions).
- **Dépendances :** Node.js Runtime, Prisma Client, Vercel KV/Postgres, Sentry.
- **Structure :**
  - `index.js` : Point d'entrée unique (monolithic entrypoint).
  - `routes.js` : Mapping centralisé des routes vers les handlers.
  - `_handlers/` : Logique métier par domaine (aides, demarches, booking...).
  - `_utils/` : Fonctions transverses (auth, rateLimit, crypto).
  - `lib/` : Bibliothèques métier (ex: falc-summarizer).
- **Owner :** Back-end Developer.
- **Risques :** Shadowing de routes, failles de sécurité (auth bypass), timeouts, exhaustion de connexions DB.

## 4. Prisma (Base de données)
**Dossier :** `prisma/`
- **Rôle :** ORM, Schéma de base de données et Migrations.
- **Dépendances :** PostgreSQL (Neon), Prisma CLI.
- **Fichiers clés :**
  - `schema.prisma` : Définition des modèles de données.
  - `migrations/` : Historique des changements de schéma SQL.
  - `seed.js` : Script de peuplement initial.
- **Owner :** Database Engineer / Back-end.
- **Risques :** Perte de données, migrations destructives, désynchronisation code/DB.

## 5. Scripts (Ops & CI)
**Dossier :** `scripts/`
- **Rôle :** Scripts d'automatisation, vérification, ingestion de données et maintenance.
- **Dépendances :** Bash, Node.js, `curl`, `jq`.
- **Types de scripts :**
  - `verify-*.js` : Tests de santé et vérifications post-déploiement.
  - `seed-*.js` : Scripts d'import de données.
  - `generate-*.js` : Génération d'artefacts (build-info, repo-map).
- **Owner :** Ops / DevOps.
- **Risques :** Scripts obsolètes, corruption de données en prod si mal utilisés.

## 6. Documentation
**Dossier :** `docs/`
- **Rôle :** Documentation technique, fonctionnelle et opérationnelle.
- **Dépendances :** Markdown.
- **Fichiers clés :** `REPO_MAP.md`, `ROUTES_API.md`, `ROUTES_FRONT.md`, `RUNBOOK.md`.
- **Owner :** Tout le monde.
- **Risques :** Documentation obsolète induisant en erreur (Source of Truth corrompue).

## 7. Data
**Dossier :** `data/`
- **Rôle :** Données statiques brutes (CSV, JSON) pour les seeds ou les tests.
- **Dépendances :** Aucune.
- **Owner :** Product Manager / Data.
- **Risques :** Données sensibles versionnées par erreur (PII).

## 8. Tests
**Dossiers :** `tests/` (Unit/Integration), `e2e/` (End-to-End)
- **Rôle :** Assurance qualité.
- **Dépendances :** Vitest, Playwright, Node.js.
- **Outils :** Vitest (Unit), Playwright (E2E).
- **Owner :** QA / Dev.
- **Risques :** Tests instables (flaky) bloquant la CI, faux positifs.
