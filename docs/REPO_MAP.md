# Cartographie du Répertoire (Repo Map)

Ce document fournit la cartographie officielle du dépôt `AccesDirectAide`. Il est généré et maintenu pour servir de référence lors des maintenances et évolutions.

L'inventaire technique complet est disponible dans [REPO_FILES.txt](./REPO_FILES.txt).

## 1. Racine / Configuration

| Dossier / Fichiers | Rôle | Dépendances Clés | Owner | Risques Principaux |
| ------------------ | ---- | ---------------- | ----- | ------------------ |
| `.` (root) | Point d'entrée, conf CI/CD, conf env | Node.js, NPM | Tech Lead | Configuration Vercel incorrecte, variables d'env manquantes. |
| `package.json` | Gestion des dépendances et scripts | npm | Tech Lead | Versions incompatibles, scripts obsolètes. |
| `vercel.json` | Configuration du déploiement Vercel | Vercel CLI | Infra | Headers de sécurité manquants, CRONs qui échouent. |
| `vite.config.js` | Build tool pour le frontend | Vite | Front | Problèmes de build prod vs dev, proxy API local. |
| `.github/` | Workflows CI/CD (GitHub Actions) | Actions | Infra | Pipeline cassé bloquant les merges. |

## 2. Frontend (`src/`)

| Dossier | Rôle | Dépendances Clés | Owner | Risques Principaux |
| ------- | ---- | ---------------- | ----- | ------------------ |
| `src/pages/` | Pages de l'application (Router) | React Router | Front | Pages orphelines, logique métier dans les vues. |
| `src/components/` | Composants UI réutilisables | Radix UI, Tailwind | Front | Accessibilité (A11y), composants non standards. |
| `src/api/` | Client HTTP pour consommer l'API | fetch / axios | Front | Désynchronisation avec l'API Backend, duplication `client.js`/`.jsx`. |
| `src/contexts/` | Gestion d'état global (ex: FALC) | React Context | Front | Rerenders inutiles. |
| `src/lib/` & `src/utils/` | Utilitaires frontend | date-fns, etc. | Front | Duplication de logique avec le backend. |

## 3. API Serverless (`api/`)

| Dossier | Rôle | Dépendances Clés | Owner | Risques Principaux |
| ------- | ---- | ---------------- | ----- | ------------------ |
| `api/index.js` | Point d'entrée Vercel Function | Vercel | API | Cold starts, timeout. |
| `api/routes.js` | Définition centrale des routes | - | API | Shadowing de routes, ordre incorrect. |
| `api/_handlers/` | Logique métier des endpoints | Prisma Client | API | Erreurs non catchées (500), validation manquante. |
| `api/_utils/` | Sécurité, Auth, Rate Limit | JWT, Upstash | API | Failles de sécurité, bypass d'auth. |
| `api/cron/` | Tâches planifiées (Ingest, Purge) | - | Backend | Échec silencieux, dépassement de temps d'exécution. |
| `api/lib/` | Logique métier partagée (Ingestion) | - | Backend | Divergence de logique (ex: FALC). |

## 4. Base de Données (`prisma/`)

| Dossier | Rôle | Dépendances Clés | Owner | Risques Principaux |
| ------- | ---- | ---------------- | ----- | ------------------ |
| `prisma/schema.prisma` | Définition du schéma DB | Prisma | DB | Migrations destructives, incohérence Types. |
| `prisma/migrations/` | Historique des changements DB | SQL | DB | Conflits de migration, rollback difficile. |
| `prisma/seed.js` | Données initiales / Test | - | DB | Données de seed obsolètes cassant le dev. |

## 5. Scripts d'Exploitation (`scripts/`)

| Dossier | Rôle | Dépendances Clés | Owner | Risques Principaux |
| ------- | ---- | ---------------- | ----- | ------------------ |
| `scripts/` | Maintenance, Verification, Ingestion | Node, Python | Ops | Scripts non maintenus, dépendances locales (venv). |
| `scripts/verify-*.js` | Scripts de "Quality Gate" | - | QA/Ops | Faux positifs donnant une fausse confiance. |

## 6. Documentation (`docs/`)

| Dossier | Rôle | Dépendances Clés | Owner | Risques Principaux |
| ------- | ---- | ---------------- | ----- | ------------------ |
| `docs/` | Documentation projet, API, Runbook | Markdown | All | Documentation obsolète induisant en erreur. |
| `docs/reports/` | Rapports d'audit et d'exécution | - | Auto | Bruit dans le repo. |

## 7. Données (`data/`, `config/`)

| Dossier | Rôle | Dépendances Clés | Owner | Risques Principaux |
| ------- | ---- | ---------------- | ----- | ------------------ |
| `data/` | Fichiers CSV/JSON statiques | - | Data | Données sensibles committées par erreur. |
| `config/` | Configuration métier (ex: sources RSS) | - | Product | Mauvaise config impactant la prod. |

## 8. Tests (`tests/`, `e2e/`)

| Dossier | Rôle | Dépendances Clés | Owner | Risques Principaux |
| ------- | ---- | ---------------- | ----- | ------------------ |
| `e2e/` | Tests bout-en-bout | Playwright | QA | Tests "flaky", couverture insuffisante. |
| `tests/` | Tests unitaires / intégration API | Vitest | Dev | Tests cassés ignorés. |
