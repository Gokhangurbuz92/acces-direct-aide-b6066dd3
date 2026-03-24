# Changelog

## [Unreleased] — 2026-03-24

### Added
- docs/monitoring.md — documentation monitoring
- docs/disaster-recovery.md — procédure DR
- docs/known-issues.md — issues connues
- docs/database.md — schema, migrations, procédures DB
- docs/CONTRIBUTING.md — guide contribution (session précédente)
- docs/architecture.md — architecture technique (session précédente)
- Prompt sanitizer (api/lib/prompt-sanitizer.js)
- Log store centralisé (api/lib/log-store.js)
- Dashboard opérationnel (/api/admin/dashboard)
- Feature flag ENABLE_AI_AGENT dans les 3 agents
- recordMetric dans les 3 agents IA
- k6 load testing scripts
- Schema DB splitté en 8 modules
- 8 variables manquantes ajoutées à `.env.example`
- Rate limiting documenté (9 action types, 50+ fichiers protégés)
- `tests/unit/prompt-sanitizer.test.js` — 12 tests pour le sanitizer

### Fixed
- `scripts/backup-db.js` — réécrit en standalone `pg` (plus de bug import Drizzle)
- 32 tests réactivés (705 → 749) via correction d'imports et ajout de mocks
- 7 exclusions vitest supprimées → 0 exclusions unit
- `@vitejs/plugin-react` ajouté à `vitest.config.js` pour JSX automatic transform
- `tests/integration/p10-public-credibility.test.js` — ajout beforeEach/afterEach cleanup DB
- `tests/unit/errorboundary.test.js` doublon supprimé

### Security
- Security headers vérifiés en production (6/6 : HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy)
- Monitoring endpoints vérifiés (6/6 OK)
- Password policy citoyen (8+ chars, majuscule, minuscule, chiffre)
- Coverage code v8 configuré (58% statements, 60% lines)

### Changed
- `vitest.config.js` — nettoyage exclude list, ajout plugin React
- `.env.example` — 8 variables d'environnement manquantes documentées
