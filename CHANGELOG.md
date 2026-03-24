# Changelog

## [Unreleased] — 2026-03-24

### Added
- `docs/monitoring.md` — monitoring endpoints, security headers, alerting
- `docs/disaster-recovery.md` — procédure DR, backup status
- `docs/known-issues.md` — exclusions, TODOs, score projet
- `docs/CONTRIBUTING.md` — guide contribution (session précédente)
- `docs/architecture.md` — architecture technique (session précédente)
- `tests/unit/prompt-sanitizer.test.js` — 12 tests pour le sanitizer
- 8 variables manquantes ajoutées à `.env.example`

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

### Changed
- `vitest.config.js` — nettoyage exclude list, ajout plugin React
- `.env.example` — 8 variables d'environnement manquantes documentées
