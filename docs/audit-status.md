# Audit Status — Mars 2026

> Audit initial : 23 mars 2026 · Vérification finale : 24 mars 2026

## Métriques finales

| Métrique | Valeur |
|----------|--------|
| **Tests** | 781 passent, 0 failures |
| **Fichiers test** | 105 |
| **Coverage** | Statements 58% · Branches 49% · Lines 60% |
| **Routes API** | 170+ (131 dans routes.js) |
| **Tables DB** | 59 (pgTable) |
| **Migrations** | 7 versionnées |
| **Docs** | 18 fichiers markdown |
| **Version** | 1.0.0 |
| **npm audit** | 0 vulnérabilités |
| **Security headers** | 6/6 |
| **Monitors** | 4/4 healthy |
| **Health** | 87ms |

## Score par dimension

| Dimension | Audit (23/03) | Réel (24/03) | Preuve |
|-----------|:---:|:---:|--------|
| Tests | 55% | **80%** | 781 tests, coverage 58%, 105 fichiers, 0 exclusions |
| Sécurité | 55% | **75%** | Rate limit 12 types, lockout, CSRF, CSP+HSTS, password policy, PII blocking |
| RGPD | 45% | **70%** | Purge cron, export, delete, consent, cookie banner, doc RGPD |
| Auth | 65% | **78%** | Lockout, MFA admin, scrypt, rate limit, password policy |
| DevOps | 40% | **65%** | CI vert, backup, DR, monitoring, 7 migrations |
| Observabilité | 35% | **60%** | Sentry, Pino, health-alert, 6 monitors, response times doc |
| Maintenabilité | 55% | **80%** | 18 docs, CHANGELOG, onboarding, API ref, testing guide |
| CI/CD | 70% | **82%** | GH Actions, lint 0, coverage CI, artifact upload |
| **Global** | **52%** | **~78%** | **+26 points** |

## Items confirmés FAITS (l'audit les pensait absents)

| Item | Audit disait | Réalité |
|------|-------------|---------|
| Lockout citoyen | 🔴 Absent | ✅ `failedLoginAttempts` + `lockoutUntil` + 15min |
| Rate limiting global | 🟠 Non vérifié | ✅ 50+ fichiers, 12 action types, IP+clé |
| CSRF middleware | 🟡 Absent | ✅ `api/_utils/csrf.js` double-submit cookie |
| RGPD export | 🔴 Absent | ✅ `api/_handlers/auth/export-data.js` |
| Migrations DB | 🔴 push sans versions | ✅ 7 migrations dans `drizzle/` |
| Secrets rotation | 🟠 Absent | ✅ `docs/secrets-rotation.md` (100 lignes) |
| OpenAPI spec | 🟡 Non vérifié | ✅ `api/_handlers/openapi.js` + `docs/openapi.json` |
| Pino logger | 🟠 Non vérifié | ✅ `api/_utils/logger.js` Pino structuré |
| Alerting | 🟠 Absent | ✅ `cron/health-alert.js` + Sentry alerts |
| Coverage CI | 🔴 Absent | ✅ CI step + artifact upload |

## Items restants

### 🟡 Moyenne (semaine prochaine)
- [ ] Token refresh citoyen
- [ ] Bundle optimization (pdf-vendor 560KB)
- [ ] E2E Playwright contre vraie API
- [ ] Logging drain centralisé (Pino → Axiom)

### 🟢 Basse (mois prochain)
- [ ] Pen test externe
- [ ] Migration JS → TS
- [ ] Fusionner 3 agents discovery
