# Audit Status — Mars 2026

> Audit initial : 23 mars 2026 · Vérification : 24 mars 2026

## Score par dimension

| Dimension | Audit (23/03) | Réel (24/03) | Preuve |
|-----------|:---:|:---:|--------|
| Tests | 55% | **75%** | 749 tests, coverage 58% stmts / 60% lines |
| Sécurité | 55% | **72%** | Rate limit 12 types (50+ fichiers), lockout citoyen, CSRF double-submit, CSP+HSTS, password policy |
| RGPD | 45% | **65%** | Purge cron, export endpoint, delete-account, consent log, cookie banner |
| Auth | 65% | **75%** | Lockout (5 tentatives/15min), MFA admin, scrypt hash, rate limit IP+email |
| DevOps | 40% | **60%** | CI vert, backup script OK, DR doc, monitoring doc, 7 migrations versionnées |
| Observabilité | 35% | **55%** | Sentry DSN, Pino logger, health-alert cron, 6 monitors vérifiés |
| Maintenabilité | 55% | **72%** | Docs complètes (8 fichiers), CHANGELOG, secrets rotation, database doc |
| CI/CD | 70% | **80%** | GH Actions, lint 0, 749 tests, build OK, coverage v8 |
| **Global** | **52%** | **~72%** | **+20 points** |

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
| Pino logger | 🟠 Configuré non vérifié | ✅ `api/_utils/logger.js` Pino structuré |
| Alerting | 🟠 Absent | ✅ `cron/health-alert.js` + Sentry alerts |

## Ce qu'on a ajouté dans cette PR

- ✅ 44 tests réactivés (705 → 749)
- ✅ 0 exclusions unit (était 7)
- ✅ Coverage v8 configuré (58% statements)
- ✅ Password policy citoyen (8+ chars, A-Z, a-z, 0-9)
- ✅ Backup script corrigé (standalone pg)
- ✅ 4 docs créés (monitoring, DR, known-issues, database)
- ✅ CHANGELOG + semver `1.0.0`
- ✅ `.env.example` complété (+8 vars)
- ✅ Rate limiting documenté
- ✅ Security headers vérifiés (6/6)
- ✅ `@vitejs/plugin-react` pour JSX transform

## Items restants par priorité

### 🟠 Haute (cette semaine)
- [ ] Coverage seuil en CI (40% minimum)
- [ ] Bundle optimization (11 vendor chunks)
- [ ] E2E contre vraie API (pas mocks)

### 🟡 Moyenne (semaine prochaine)
- [ ] Token refresh citoyen (JWT statique actuellement)
- [ ] CSP nonce (sha256 est OK mais fragile si script change)
- [ ] Logging drain centralisé (Pino → Axiom/Vercel Logs)

### 🟢 Basse (mois prochain)
- [ ] Pen test externe
- [ ] Migration JS → TS complète
- [ ] Queue processing pour ingestion
- [ ] Multi-RulePacks pour chat IA
- [ ] Fusionner 3 agents discovery en 1
