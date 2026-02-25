# Cartographie du dépôt (Repo Map)

Ce document est la source de vérité sur l'organisation des fichiers et dossiers du dépôt `AccesDirectAide`.
Il est généré/maintenu manuellement, mais s'appuie sur `docs/REPO_FILES.txt` (généré automatiquement) pour l'inventaire technique.

## 1. Racine & Configuration

| Dossier / Fichier | Rôle | Dépendances | Owner | Risques Principaux |
| :--- | :--- | :--- | :--- | :--- |
| `package.json` | Manifeste du projet, scripts NPM, dépendances | N/A | Tech Lead | Scripts de build/test fragiles si modifiés sans test |
| `vercel.json` | Configuration de déploiement Vercel (rewrites, cron, headers) | Vercel | DevOps | Une erreur ici casse tout le routing ou les crons |
| `vite.config.js` | Configuration du bundler Vite (React) | Vite | Front | Problèmes de build ou de proxy dev |
| `.env.example` | Modèle des variables d'environnement requises | N/A | Tech Lead | Manque de secrets en prod si mal suivi |
| `eslint.config.js` | Configuration du linter ESLint | ESLint | Tech Lead | Bruit dans la CI si trop strict |
| `.gitignore` | Exclusions Git | Git | Tech Lead | Fuite de secrets ou artefacts |

## 2. Frontend (`src/`)

L'application React (SPA).

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| :--- | :--- | :--- | :--- | :--- |
| `src/pages/` | Composants Page et routeur (`index.jsx`) | React Router | Front | Lazy loading cassé, routes orphelines |
| `src/components/` | Composants UI réutilisables | UI Lib (Radix/Shadcn) | Front | Régression visuelle globale |
| `src/api/` | Client API front (`client.js`) | Fetch | Front | Désynchronisation avec l'API Backend |
| `src/lib/` | Utilitaires purement front (et types .ts incrémentaux) | N/A | Front | Duplication de logique avec l'API |
| `src/assets/` | Images, styles globaux | N/A | Front | Poids du bundle |

## 3. API (`api/`)

Le backend Node.js Serverless (Vercel Functions).

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| :--- | :--- | :--- | :--- | :--- |
| `api/index.js` | Point d'entrée Vercel | Vercel | API | Erreur 500 globale |
| `api/routes.js` | Routeur central API (mappage path -> handler) | N/A | API | Shadowing de routes, 404 inattendues |
| `api/_handlers/` | Logique métier (endpoints) | Prisma | API | Failles de sécu, validation manquante |
| `api/_utils/` | Sécurité, Auth, Rate Limit, Sentry | JWT, Redis | API | Contournement sécu, crash DB |
| `api/lib/` | Services (FALC, Storage, Ingestion) | Ext. Services | API | Coûts API, pannes externes |

## 4. Base de Données (`prisma/`)

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| :--- | :--- | :--- | :--- | :--- |
| `prisma/schema.prisma` | Définition des modèles de données | Prisma | DB | Migrations destructives, perte de données |
| `prisma/migrations/` | Historique des changements SQL | Postgres | DB | Conflits de migration, downtime |
| `prisma/seed.js` | Données initiales | N/A | DB | Données de dev en prod |

## 5. Scripts Ops (`scripts/`)

Outils de maintenance, vérification et CI.

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| :--- | :--- | :--- | :--- | :--- |
| `scripts/verify-*.js` | Scripts de vérification (smoke tests, sanity checks) | Node | DevOps | Faux positifs/négatifs en CI |
| `scripts/generate-repo-map.sh`| Génération de l'inventaire | Bash | DevOps | Inventaire obsolète |

## 6. Documentation (`docs/`)

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| :--- | :--- | :--- | :--- | :--- |
| `docs/REPO_FILES.txt` | Liste automatique des fichiers | Script | DevOps | - |
| `docs/REPO_MAP.md` | Ce document | - | DevOps | Obsolescence |

## 7. Données (`data/`)

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| :--- | :--- | :--- | :--- | :--- |
| `data/taxonomy.json` | Source de vérité pour les catégories | - | Product | Incohérence Front/Back |

## 8. Tests (`tests/`, `e2e/`)

| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
| :--- | :--- | :--- | :--- | :--- |
| `e2e/` | Tests bout-en-bout (Playwright) | Playwright | QA | Tests flaky, temps d'exécution long |
| `tests/` | Tests unitaires/intégration | Vitest | Dev | Couverture insuffisante |

## 9. Décisions Techniques Structurantes

| Décision | Contexte | Statut |
| :--- | :--- | :--- |
| **JS vs TS** | Le projet est majoritairement JS. Pas de migration globale. TS autorisé incrémentalement si strict et isolé (fichiers `.ts` dans `src/lib/` ou types `.d.ts`). | **Stable** (JS dominant, TS incrémental) |
| **API Client** | `src/api/client.js` est l'unique client API pour le front. Pas de version `.jsx`. | **Appliqué** |
| **FALC Logic** | `api/lib/falc-summarizer.js` est la source de vérité pour le résumé FALC (côté serveur). `src/lib/falc.ts` gère l'affichage/types côté client. | **Appliqué** |
