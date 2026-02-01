# Carte du Répertoire (Repository Map)

Ce document décrit l'organisation du code source du projet **AccesDirectAide**.
Il sert de référence pour comprendre la structure, les responsabilités et les risques associés à chaque dossier.

Pour la liste exhaustive des fichiers, voir `docs/REPO_FILES.txt`.

## 1. Racine & Configuration

| Fichier / Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| ----------------- | ---- | ----------- | ----- | ------------------ |
| `README.md` | Point d'entrée, documentation générale. | - | Tech Lead | Obsolescence. |
| `package.json` | Définition des dépendances et scripts NPM. | NPM | Tech Lead | Upgrade bloquant, failles sécu. |
| `vite.config.js` | Configuration du bundler Vite (Frontend). | Vite | Frontend | Build cassé, performances. |
| `vercel.json` | Configuration Vercel (rewrites, crons, headers). | Vercel | DevOps | Routage incorrect (404/500), Cron échecs. |
| `eslint.config.js` | Configuration du linter ESLint. | ESLint | All | "Bruit" excessif, règles ignorées. |
| `.gitignore` | Exclusions Git. | Git | All | Versionnage de secrets (`.env`) ou artifacts. |
| `.env.example` | Modèle des variables d'environnement. | - | DevOps | Manque de variables critiques en prod. |

## 2. Frontend (`src/`)

Single Page Application (SPA) React.

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| ------- | ---- | ----------- | ----- | ------------------ |
| `src/pages/` | Composants de pages et Router (`index.jsx`). | React Router | Frontend | Routes orphelines, Navigation cassée. |
| `src/components/` | Composants UI et Business réutilisables. | shadcn/ui | Frontend | Régression visuelle, Props drilling. |
| `src/api/` | Client API (appels backend). | Fetch / Axios | Frontend | Désynchronisation avec le contrat API. |
| `src/hooks/` | Hooks React personnalisés. | React | Frontend | Boucles de rendu infinies. |
| `src/lib/` | Utilitaires frontend. | - | Frontend | Duplication de logique. |
| `src/utils/` | Fonctions partagées (mix JS/TS). | - | Frontend | Typage incohérent. |

## 3. API Backend (`api/`)

Architecture Serverless (Vercel Functions) avec routeur monolithique.

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| ------- | ---- | ----------- | ----- | ------------------ |
| `api/index.js` | Point d'entrée serverless. | Vercel | Backend | Timeout, Cold start. |
| `api/routes.js` | Routeur central. | - | Backend | **Shadowing** de routes, Ordre incorrect. |
| `api/_handlers/` | Logique métier (Endpoints). | Prisma, Libs | Backend | Erreurs 500, Validation manquante. |
| `api/_utils/` | Auth, RateLimit, Crypto, Sentry. | Redis (KV) | Backend | **Faille de sécurité** (Auth bypass), Fuite mémoire. |
| `api/lib/` | Services (Search, FALC, Storage). | - | Backend | Logique métier complexe non testée. |

## 4. Base de Données (`prisma/`)

ORM Prisma et PostgreSQL.

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| ------- | ---- | ----------- | ----- | ------------------ |
| `prisma/schema.prisma` | Modèle de données. | Postgres | Backend | Migrations destructives, Incohérence données. |
| `prisma/migrations/` | Historique des migrations. | - | Backend | Conflits de migration, Rollback impossible. |
| `prisma/seed.js` | Script de seed. | - | Backend | Données de test périmées. |

## 5. Scripts & Outillage (`scripts/`)

Automatisation, Ingestion, Vérification.

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| ------- | ---- | ----------- | ----- | ------------------ |
| `scripts/` | Ingestion, Maintenance, CI checks. | Node.js | DevOps | Scripts cassés en CI, Corruption données (ingest). |

## 6. Documentation (`docs/`)

Base de connaissance.

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| ------- | ---- | ----------- | ----- | ------------------ |
| `docs/` | Guides, Plans, Architecture. | - | All | Documentation obsolète vs Code. |

## 7. Données (`data/`)

Sources de données statiques.

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| ------- | ---- | ----------- | ----- | ------------------ |
| `data/` | CSV/JSON pour seed/ingest. | - | Data | Format invalide bloquant l'ingest. |

## 8. Tests

Assurance qualité.

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| ------- | ---- | ----------- | ----- | ------------------ |
| `e2e/` | Tests End-to-End (Playwright). | Playwright | QA | Tests "Flaky", Maintenance coûteuse. |
| `tests/` | Tests unitaires et intégration API. | Vitest | Backend | Faux positifs, Couverture insuffisante. |
