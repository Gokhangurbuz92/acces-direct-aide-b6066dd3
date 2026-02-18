# Cartographie du Répertoire

Ce document décrit l'organisation du code source du projet AccesDirectAide.
Il est généré à partir de l'inventaire technique `docs/REPO_FILES.txt` et de la documentation d'architecture.

## 1. Racine et Configuration

| Chemin | Rôle | Propriétaire | Risques Principaux |
|---|---|---|---|
| `README.md` | Point d'entrée projet | Ops | Doit refléter scripts & archi réelle |
| `package.json`, `package-lock.json` | Scripts + dépendances | Ops | Versions strictes (Node 20) |
| `vite.config.js`, `index.html` | Build Frontend (Vite) | Front | Configuration rewrites SPA |
| `postcss.config.js`, `tailwind.config.js` | Configuration CSS | Front | Performance build CSS |
| `vercel.json` | Configuration Vercel | Ops | Routes API, Headers, Crons |
| `eslint.config.js` | Configuration Linting | Dev | Règles strictes (CI gate) |
| `.env.example` | Modèle variables d'environnement | Ops | Secrets manquants en prod |
| `.gitignore` | Exclusion Git | Ops | Fuite de secrets |

## 2. Frontend (`src/`)

| Chemin | Rôle | Propriétaire | Risques Principaux |
|---|---|---|---|
| `src/main.jsx` | Point d'entrée React | Front | Hydration errors |
| `src/App.jsx` | Composant racine | Front | Providers manquants |
| `src/pages/index.jsx` | Routeur principal | Front | Routes orphelines, redirects |
| `src/pages/` | Pages de l'application | Front | Performance (Code splitting) |
| `src/components/` | Composants réutilisables | Front | Accessibilité (A11y) |
| `src/api/client.js` | Client API Frontend (Unique source) | Front | Alignement avec API backend |
| `src/utils/` | Utilitaires Frontend | Front | Logique dupliquée |
| `src/styles/` | Styles globaux et tokens | Front | Conflits CSS |

## 3. API (`api/`)

| Chemin | Rôle | Propriétaire | Risques Principaux |
|---|---|---|---|
| `api/index.js` | Point d'entrée Serverless | Backend | Cold starts |
| `api/routes.js` | Mapping Routes -> Handlers | Backend | Sécurité, Auth bypass |
| `api/_handlers/` | Handlers métier | Backend | Validation inputs, Error handling |
| `api/_utils/` | Utilitaires transverses | Backend | Fuite données (Logs), Auth |
| `api/lib/falc-summarizer.js` | Moteur FALC (Unique source) | Backend | Qualité génération |
| `api/cron/` | Scripts planifiés | Backend | Timeout, Mémoire, Doublons |

## 4. Base de Données (`prisma/`)

| Chemin | Rôle | Propriétaire | Risques Principaux |
|---|---|---|---|
| `prisma/schema.prisma` | Modèle de données | DB | Intégrité, Migrations destructives |
| `prisma/migrations/` | Historique migrations | DB | Conflits, Rollback impossible |
| `prisma/seed.js` | Données initiales | DB | Données obsolètes |

## 5. Scripts et Données (`scripts/`, `data/`)

| Chemin | Rôle | Propriétaire | Risques Principaux |
|---|---|---|---|
| `scripts/` | Scripts maintenance/vérification | Ops | Effets de bord prod |
| `data/` | Sources statiques (CSV/JSON) | Data | Format invalide, Encodage |
| `config/` | Configuration métier (RSS, etc.) | Data | Sources mortes |

## 6. Documentation (`docs/`)

| Chemin | Rôle | Propriétaire | Risques Principaux |
|---|---|---|---|
| `docs/REPO_MAP.md` | Cartographie officielle | Ops | Obsolescence |
| `docs/REPO_FILES.txt` | Inventaire technique auto-généré | Ops | |
| `docs/ROUTES_FRONT.md` | Documentation routes Front | Front | Désynchro code |
| `docs/ROUTES_API.md` | Documentation routes API | Backend | Désynchro code |
| `docs/ADMIN_GUIDE.md` | Guide administrateur (Unique) | Produit | |
| `docs/RUNBOOK.md` | Procédures d'exploitation | Ops | Procédures non testées |

## 7. Tests (`tests/`, `e2e/`)

| Chemin | Rôle | Propriétaire | Risques Principaux |
|---|---|---|---|
| `e2e/` | Tests End-to-End (Playwright) | QA | Flaky tests, faux positifs |
| `tests/` | Tests d'intégration / Unitaires | Dev | Couverture insuffisante |

---
*Généré par `scripts/generate-repo-map.sh` et maintenu par l'équipe technique.*
