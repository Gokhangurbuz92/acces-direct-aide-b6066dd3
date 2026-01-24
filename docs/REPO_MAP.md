# Cartographie du Dépôt (Repo Map)

Ce document décrit l'organisation du code source, les responsabilités de chaque dossier et les points de vigilance.

## Racine / Configuration
**Chemin:** `./`
**Rôle:** Point d'entrée, configuration globale, build, dépendances.
**Responsable:** Infra / Devops
**Fichiers clés:**
- `package.json`: Dépendances et scripts NPM.
- `vercel.json`: Configuration du déploiement Vercel (rewrites, crons, headers).
- `vite.config.js`: Configuration du bundler Frontend (React).
- `eslint.config.js`: Règles de linting.
- `.env.example`: Modèle des variables d'environnement.

## Front App
**Chemin:** `src/`
**Rôle:** Application Single Page (SPA) React + Vite.
**Responsable:** Frontend
**Dépendances:** React, TailwindCSS, Radix UI (via `src/components/ui`).
**Sous-dossiers:**
- `pages/`: Composants de haut niveau correspondant aux routes.
- `components/`: Composants réutilisables (UI, business).
- `api/`: Clients API (Attention: doublon `client.js` / `client.jsx` à résoudre).
- `lib/` & `utils/`: Utilitaires (formatage, etc.).
- `hooks/`: Custom hooks React.

## API (Serverless)
**Chemin:** `api/`
**Rôle:** Backend Node.js déployé en Serverless Functions sur Vercel.
**Responsable:** Backend
**Sous-dossiers:**
- `index.js`: Point d'entrée principal (dispatch).
- `routes.js`: Mapping centralisé URL -> Handler.
- `_handlers/`: Logique métier par domaine (aides, users, booking, etc.).
- `_utils/`: Fonctions transverses sécurisées (Auth, RateLimit, Crypto).
- `lib/`: Bibliothèques internes (Search, Emails, etc.).
**Points de vigilance:**
- La sécurité (Auth, RBAC) est gérée dans `_utils/auth.js` et doit être appliquée dans chaque handler.
- Les fichiers dans `_utils` et `lib` sont partagés entre les fonctions serverless.

## Prisma (Database)
**Chemin:** `prisma/`
**Rôle:** Définition du schéma de données et migrations.
**Responsable:** Backend / Data
**Fichiers clés:**
- `schema.prisma`: Source de vérité du modèle de données.
- `migrations/`: Historique des changements de schéma SQL.
- `seed.js`: Script de peuplement de la base (dev/staging).

## Scripts (Ops & Tools)
**Chemin:** `scripts/`
**Rôle:** Utilitaires de maintenance, ingestion de données, vérifications CI.
**Responsable:** Ops / Backend
**Usage:**
- `verify-*.js`: Scripts de "smoke test" pour vérifier la santé du projet.
- `seed-*.js`: Scripts de data seeding spécifiques.
- `generate-repo-map.sh`: Génération de l'inventaire de fichiers.

## Documentation
**Chemin:** `docs/`
**Rôle:** Documentation technique, fonctionnelle et d'exploitation.
**Responsable:** Toute l'équipe
**Fichiers clés:**
- `REPO_MAP.md`: Ce fichier.
- `REPO_FILES.txt`: Arborescence générée automatiquement.
- `INFRASTRUCTURE.md`: Détails sur l'hébergement et les services externes.

## Data
**Chemin:** `data/`
**Rôle:** Fichiers statiques (CSV/JSON) pour l'initialisation ou l'import.
**Responsable:** Produit / Data
**Contenu:** CSV d'imports (Aides, Structures, etc.).

## Tests
**Chemin:** `tests/` (Intégration) et `e2e/` (End-to-End)
**Rôle:** Assurance qualité automatisée.
**Responsable:** QA / Dev
**Outils:**
- `tests/`: Vitest (Backend/Unit).
- `e2e/`: Playwright (Scénarios utilisateurs complets).

---
*Généré le: $(date +%Y-%m-%d)*
