# Carte du Dépôt (Repository Map)

Cette documentation décrit la structure du dépôt `AccesDirectAide`, les rôles de chaque dossier, et les propriétaires techniques.

Fichier généré automatiquement associé : `docs/REPO_FILES.txt` (inventaire exhaustif).

## 1. Racine & Configuration
| Dossier / Fichier | Rôle | Dépendances | Owner | Risques Principaux |
|---|---|---|---|---|
| `README.md` | Point d'entrée, documentation rapide. | - | Shared | Obsolescence |
| `package.json` | Gestion des dépendances et scripts NPM. | NPM | Shared | Vulnérabilités, Conflits de versions |
| `vercel.json` | Configuration du déploiement Vercel (rewrites, cron). | Vercel | DevOps | Routage incorrect, Cron silencieux |
| `.env.example` | Modèle des variables d'environnement requises. | - | DevOps | Manque de variables critiques |
| `vite.config.js` | Configuration du build Frontend. | Vite | Front | Build failure, Proxy dev incorrect |
| `.gitignore` | Exclusion des fichiers non versionnés. | Git | DevOps | Commit de secrets |

## 2. Frontend (`src/`)
| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
|---|---|---|---|---|
| `src/pages/` | Pages de l'application (Router). | React Router | Front | Routes orphelines, Layout broken |
| `src/components/` | Composants UI réutilisables. | Tailwind | Front | Regressions visuelles |
| `src/api/` | Client API pour le frontend. | Fetch | Front | Désynchronisation avec API |
| `src/hooks/` | Logique React partagée. | React | Front | Effets de bord |
| `src/utils/` | Fonctions utilitaires frontend. | - | Front | Duplication de code |

## 3. API Serverless (`api/`)
| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
|---|---|---|---|---|
| `api/index.js` | Point d'entrée Vercel Function. | Express/Node | API | Cold starts, Timeout |
| `api/routes.js` | Définition centrale des routes API. | Handlers | API | Shadowing de routes, 404 |
| `api/_handlers/` | Logique métier des endpoints. | Prisma, Libs | API | Validation manquante, Auth bypass |
| `api/_utils/` | Utilitaires transverses (Auth, RateLimit, Sentry). | - | API | Fail-open security |
| `api/lib/` | Services métier (Ingestion, Crypto, Summarizer). | - | API | Logique métier dupliquée |

## 4. Base de Données (`prisma/`)
| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
|---|---|---|---|---|
| `schema.prisma` | Définition du schéma de données. | PostgreSQL | DB | Migrations destructives |
| `migrations/` | Historique des changements de schéma. | - | DB | Conflits de migration |

## 5. Scripts Ops (`scripts/`)
| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
|---|---|---|---|---|
| `scripts/` | Scripts de maintenance, vérification, ingestion manuelle. | Node/Bash/Python | DevOps | Exécution en prod sans précaution |

## 6. Documentation (`docs/`)
| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
|---|---|---|---|---|
| `docs/` | Documentation projet, architecture, runbooks. | - | All | Documentation obsolète |

## 7. Données Statiques (`data/`)
| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
|---|---|---|---|---|
| `data/` | Fichiers sources (CSV, JSON) pour l'ingestion ou taxonomie. | - | Data | Données périmées |

## 8. Tests (`e2e/`, `tests/`)
| Dossier | Rôle | Dépendances | Owner | Risques Principaux |
|---|---|---|---|---|
| `e2e/` | Tests End-to-End (Playwright). | Playwright | QA | Tests flaky, faux positifs |
| `tests/` | Tests unitaires / intégration. | Vitest | Dev | Couverture insuffisante |
