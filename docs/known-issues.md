# Known Issues

## Tests exclus du CI

Les tests suivants sont exclus de la suite Vitest principale :

- `tests/components/**` — utilisent `@testing-library` avec environment jsdom per-file
- `e2e/**` — tests Playwright E2E
- `tests/a11y/**` — tests Playwright accessibilité

```bash
npx playwright test             # E2E (48 fichiers)
npx playwright test tests/a11y  # Accessibilité (3 fichiers)
```

## TODOs dans le code

| Fichier | Ligne | Description | Status |
|---------|-------|-------------|:---:|
| ~~`src/pages/CompteParametres.jsx`~~ | ~~457~~ | ~~Account deletion API~~ | ✅ Connecté |

## Feature Flags

| Flag | Default | Description | Activation |
|------|---------|-------------|------------|
| `ENABLE_AI_AGENT` | `false` | Active les agents IA Pro (discovery, scheduler) | Vercel → Env vars → `true` → redéployer |
| `ENABLE_DS_INGESTION` | `false` | Active l'ingestion Démarches Simplifiées | Vercel → Env vars → `true` → redéployer |

## Limitations connues

- **Backup script** (`scripts/backup-db.js`) vérifie les counts mais ne fait pas de dump complet. Neon PITR est le vrai backup.
- **Métriques IA** en mémoire sont perdues au redéploiement (la table `AiMetric` en DB compense).
- **Rate limiting** utilise un backend mémoire en test, Upstash KV en production.
- **Pipeline test** (`tests/unit/pipeline.test.js`) est skip car il nécessite une DB.

## Score du projet

- **Tests** : 752 passent, 0 exclusions unitaires
- **Coverage** : Statements 58% · Branches 49% · Functions 57% · Lines 60%
- **Build** : ✅ OK
- **Lint** : ✅ 0 erreurs
- **Prod** : ✅ healthy
- **Monitors** : 6/6 vert
- **Security headers** : 6/6 présents
- **Lockout citoyen** : ✅ 5 tentatives, 15min lockout
- **DB migrations** : ✅ 7 migrations versionnées
- **Secrets rotation** : ✅ Documentée
- **Dernière vérification** : 2026-03-24

## Bundle Size

| Chunk | Taille | Lazy loaded? |
|-------|--------|:---:|
| `pdf-vendor` | 560 KB | ✅ `await import('jspdf')` |
| `charts-vendor` | 344 KB | ✅ `React.lazy()` (Pro pages) |
| `vendor` (React core) | 240 KB | ❌ (incompressible) |
| `react-vendor` | 144 KB | ❌ (incompressible) |
| `ui-vendor` | 140 KB | ❌ (UI components) |
| `motion-vendor` | 92 KB | ✅ `React.lazy()` |
| `index.css` | 140 KB | N/A |
| **Total dist/** | **14 MB** | |

**Analyse** : Les 2 plus gros chunks (PDF 560KB, Charts 344KB) sont déjà lazy loaded.
Le reste est incompressible (React core, UI). Le bundle est **bien optimisé**.

Date : 2026-03-24

## Token Refresh Citoyen

- **Status** : Non implémenté (décision consciente)
- **JWT citoyen** : 7 jours, HttpOnly cookie, pas de refresh
- **Risque** : **Faible** — lockout (5 tentatives/15min) + rate limiting IP+email protègent déjà contre le vol de token
- **Prochaine étape** : Implémenter quand le nombre d'utilisateurs dépasse 1000+

## npm audit

- **Date** : 2026-03-24
- **Résultat** : 0 vulnérabilités (production)
