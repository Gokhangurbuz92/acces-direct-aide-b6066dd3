# Issue #140 — Triage `npm test` (suite complète)

## Constat (sur `main`)

- `npm ci`: OK
- `npm test`: OK (0 échec) **dans un environnement local déjà configuré**

⚠️ Problème: la suite n’est pas déterministe aujourd’hui car certains tests DB passent uniquement si une configuration locale (ex: `.env.local`) fournit `DATABASE_URL`. Cela viole l’objectif “tests isolés d’une DB dev/prod” et rend la suite fragile selon environnement/CI.

## Repro “environnement propre” (simule CI sans `.env.local`)

Commande utilisée pour désactiver le chargement implicite de `.env.local` (via `VERCEL_ENV=production`) et observer les dépendances manquantes:

- `VERCEL_ENV=production npm test`

### Tests en échec (liste exacte observée)

| Fichier | Erreur | Cause probable | Fix prévu |
| --- | --- | --- | --- |
| `tests/integration/ingestion-quality.test.js` (8 cas) | `PrismaClientInitializationError: Environment variable not found: DATABASE_URL` | Les tests importent Prisma sans DB configurée; dépendance implicite à `.env.local` / DB existante | Introduire `DATABASE_URL_TEST` + préparation DB deterministic avant Vitest (reset+migrations+seed minimal) + empêcher Prisma de charger `.env.local` en mode test |
| `tests/integration/search_api.test.js` (3 cas) | Statuts `503` au lieu de `400/200` + mocks non appelés | Handler `/api/search` retourne `503` quand DB/env indisponible; la suite ne fournit pas de DB test | Même fix DB + runner de test qui force `DATABASE_URL` à la DB test |
| `tests/integration/rateLimit.test.js` (1 cas) | `allowed` attendu `true`, reçu `false` | En “production” sans KV, le module rate-limit est fail-closed, ce qui est OK en prod mais casse le test | Faire tourner les tests avec `VERCEL_ENV=test` + env stable; ajuster le test pour refléter le mode test (memory backend) |

## Risques de flakiness identifiés (même si “vert” localement)

- Dépendance à une DB distante/dev (état pré-existant, latence, concurrence, données non déterministes).
- Variations timezone/horloge (comparaisons de dates).
- Parallélisme des fichiers de test + DB partagée (risque de courses).

## Findings additionnels (bootstrap DB)

- `prisma migrate reset` **ne peut pas** s’exécuter sur une DB vide aujourd’hui: certaines migrations historiques supposent un état pré-existant (ordre/objets) et échouent sur une DB fraîche.
- Pour rendre `npm test` reproductible en CI et local **sans toucher aux DB externes**, le plan est de:
  - utiliser une DB Postgres locale dédiée (`DATABASE_URL_TEST`)
  - reset déterministe du schéma (`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`)
  - installer les extensions nécessaires (`unaccent`, `pg_trgm`, `vector/pgvector`)
  - appliquer le schéma via `prisma db push` + `prisma db seed`
