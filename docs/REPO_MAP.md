# Cartographie du Répertoire (Repo Map)

Ce document recense l'organisation officielle du projet AccesDirectAide.
Il est généré et maintenu pour servir de source de vérité sur l'architecture.

**Inventaire technique** : Voir `docs/REPO_FILES.txt` (généré par `scripts/generate-repo-map.sh`).

## 1. Racine / Configuration
**Chemin** : `./`
**Rôle** : Configuration globale, dépendances, scripts de build et de déploiement.
**Fichiers clés** :
- `package.json` : Dépendances et scripts NPM.
- `vercel.json` : Configuration du déploiement (headers, rewrites, crons).
- `vite.config.js` : Build system du frontend.
- `.env.example` : Modèle des variables d'environnement.
**Owner** : Infra / Tech Lead
**Risques** : Une mauvaise config ici casse le build ou le déploiement (Vercel).

## 2. Frontend (SPA)
**Chemin** : `src/`
**Rôle** : Application React (Single Page Application).
**Structure** :
- `src/pages/` : Composants de page (routage).
- `src/components/` : Composants UI réutilisables.
- `src/api/` : Client API (voir `src/api/client.js`).
- `src/utils/` : Utilitaires frontend purs.
**Owner** : Frontend Team
**Risques** : Régression UX, performance (bundle size), accessibilité.

## 3. API (Serverless)
**Chemin** : `api/`
**Rôle** : Backend serverless hébergé sur Vercel Functions.
**Structure** :
- `api/index.js` : Point d'entrée unique.
- `api/routes.js` : Définition centrale des routes et mapping vers handlers.
- `api/_handlers/` : Logique métier par endpoint.
- `api/_utils/` : Sécurité (Auth, RateLimit), Sentry, Helpers.
- `api/lib/` : Services partagés (Ingestion, Crypto, FALC).
**Owner** : Backend Team
**Risques** : Sécurité (Auth bypass), Performance (Cold starts, DB connections), Intégrité données.

## 4. Base de Données (Prisma)
**Chemin** : `prisma/`
**Rôle** : Définition du schéma de données et migrations.
**Fichiers clés** :
- `schema.prisma` : Modèle de données (Postgres).
- `migrations/` : Historique des changements de schéma.
**Owner** : Backend Team
**Risques** : Perte de données, blocage déploiement (migration échouée).

## 5. Scripts d'Exploitation
**Chemin** : `scripts/`
**Rôle** : Maintenance, ingestion, vérification, seeding.
**Types** :
- `verify-*.js` : Scripts de vérification post-déploiement.
- `seed-*.js` : Peuplement de la base (dev/staging).
- `fix_*.py` : Outils de maintenance ponctuels.
**Owner** : DevOps / Backend
**Risques** : Corruption de données en prod si mal utilisés.

## 6. Documentation
**Chemin** : `docs/`
**Rôle** : Documentation technique, fonctionnelle et opérationnelle.
**Owner** : Tout le monde
**Risques** : Obsolescence (la doc doit être tenue à jour).

## 7. Données Statiques
**Chemin** : `data/`, `config/`
**Rôle** : Fichiers CSV/JSON sources (taxonomy, RSS sources, seeds).
**Owner** : Data Manager
**Risques** : Données obsolètes embarquées.

## 8. Tests
**Chemin** : `tests/` (Intégration/Unitaire), `e2e/` (Playwright)
**Rôle** : Assurance qualité automatisée.
**Owner** : QA / Dev
**Risques** : Tests instables (flaky) bloquant la CI.

---
## 9. Pages Orphelines / Drafts
Certains fichiers présents dans `src/pages/` ne sont pas routés (voir `docs/ROUTES_FRONT.md`). Ils sont conservés comme référence ou "draft" :
- `src/pages/AideDetailBlueprintTrust.jsx`
- `src/pages/BlueprintTrustDemo.jsx`
- `src/pages/HomeBlueprintTrust.jsx`
- `src/pages/admin/AdminReports.jsx`

---
## 10. Décisions Techniques (Standards)
- **API Client** : `src/api/client.js` est la source unique. Pas de version `.jsx`.
- **FALC Logic** : `api/lib/falc-summarizer.js` est la source de vérité pour la logique de résumé.
- **JS vs TS** : Le projet est majoritairement JavaScript. L'introduction de TypeScript se fait de manière incrémentale et optionnelle (ex: `tsconfig.typecheck.json`), sans migration massive pour éviter les risques de régression.

---
**Note sur les fichiers ignorés** :
Les dossiers `venv/`, `node_modules/`, `test-results/` et les fichiers `.env` sont strictement exclus du versionning pour des raisons de sécurité et de propreté.
