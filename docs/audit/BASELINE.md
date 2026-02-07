# BASELINE - État Initial du Projet AccesDirectAide

**Date**: 2026-02-07  
**Auditeur**: Blackbox Remote Code (Staff Engineer + QA Lead + Security/Compliance Lead)  
**Repo**: Gokhangurbuz92/acces-direct-aide-b6066dd3  
**Commit**: 566137e (Merge PR #98)

---

## 📊 RÉSUMÉ EXÉCUTIF

✅ **ÉTAT GLOBAL**: STABLE ET OPÉRATIONNEL

- **Lint**: ✅ PASS (0 erreurs)
- **Typecheck**: ✅ PASS (0 erreurs)
- **Tests**: ✅ PASS (126/126 tests, 28 fichiers)
- **Build**: ✅ SUCCESS (6.03s, 448KB Sentry vendor)
- **Node**: v22.22.0
- **npm**: 10.9.4
- **Prisma**: 5.22.0 (update disponible → 7.3.0)

---

## 🔧 ENVIRONNEMENT TECHNIQUE

### Stack Confirmée

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Frontend** | React + Vite | React 18.2.0, Vite 6.1.0 |
| **Backend** | Vercel Serverless Functions | Node 22 |
| **Database** | Neon Postgres + Prisma | Prisma 5.22.0 |
| **Observabilité** | Sentry | @sentry/react 10.34.0 |
| **Rate Limiting** | Upstash Redis / KV | @upstash/ratelimit 2.0.8 |
| **Tests** | Vitest + Playwright | Vitest 4.0.18, Playwright 1.58.0 |
| **CI/CD** | GitHub Actions | - |
| **Styling** | Tailwind CSS + Radix UI | Tailwind 3.4.17 |

### Node.js Version

```bash
$ node --version
v22.22.0

$ npm --version
10.9.4
```

**Note**: Aucun `.nvmrc` présent. Node 22 est utilisé (compatible avec `package.json` engines non spécifié).

---

## ✅ COMMANDES EXÉCUTÉES ET RÉSULTATS

### 1. Installation

```bash
$ npm ci
✅ SUCCESS
- 957 packages installés
- 0 vulnérabilités
- Prisma Client généré (v5.22.0)
- Build info généré
```

**Note Prisma**: Update disponible 5.22.0 → 7.3.0 (major version, nécessite migration guidée).

### 2. Lint

```bash
$ npm run lint
✅ PASS
- 0 erreurs
- 0 warnings
- ESLint 9.19.0 (flat config)
```

### 3. Typecheck

```bash
$ npm run typecheck
✅ PASS
- 0 erreurs TypeScript
- Configuration: tsconfig.typecheck.json
- Mode: --noEmit (vérification uniquement)
```

### 4. Tests

```bash
$ npm run test
✅ PASS - 126/126 tests (28 fichiers)
Duration: 2.62s
```

**Détail des suites de tests**:

| Suite | Tests | Statut |
|-------|-------|--------|
| `tests/unit/jsonld.test.js` | 10 | ✅ |
| `tests/integration/pipeline_routing.test.js` | 10 | ✅ |
| `api/_handlers/admin/privacy/gdpr.test.js` | 4 | ✅ |
| `tests/unit/queryState.test.js` | 13 | ✅ |
| `tests/integration/ressources.test.js` | 6 | ✅ |
| `tests/integration/api.test.js` | 6 | ✅ |
| `tests/unit/ingestion.test.js` | 7 | ✅ |
| `tests/sitemap.test.js` | 1 | ✅ |
| `tests/integration/api_slug.test.js` | 3 | ✅ |
| `api/_handlers/cron/pipeline.test.js` | 2 | ✅ |
| `tests/integration/aides_v2.test.js` | 4 | ✅ |
| `tests/slug.test.js` | 7 | ✅ |
| `tests/integration/rateLimit.test.js` | 2 | ✅ |
| `api/tests/rbac.test.js` | 4 | ✅ |
| `api/_handlers/cron/pipeline.regression.test.js` | 2 | ✅ |
| `scripts/test-sitemap-handler.test.js` | 3 | ✅ |
| `tests/integration/url_consistency.test.js` | 1 | ✅ |
| `tests/integration/actualites.test.js` | 3 | ✅ |
| `tests/unit/crypto.test.js` | 6 | ✅ |
| `tests/unit/falcsummary.test.js` | 9 | ✅ |
| `tests/auth_crossing.test.js` | 4 | ✅ |
| `tests/unit/pipeline.test.js` | 1 | ✅ |
| `api/lib/search-query.test.js` | 2 | ✅ |
| `tests/unit/errorboundary.test.js` | 5 | ✅ |
| `tests/integration/api_head.test.js` | 1 | ✅ |
| `tests/unit/errorBoundary.test.jsx` | 6 | ✅ |
| `tests/unit/taxonomy.test.js` | 3 | ✅ |
| `api/tests/admin-security.test.js` | 1 | ✅ |

**Observations**:
- ✅ Aucun test flaky détecté
- ✅ Logs structurés (JSON) présents
- ✅ Tests d'intégration invoquent directement les handlers (pas de fetch réseau)
- ✅ Rate limiting testé (MEMORY + KV_REST_API backends)
- ✅ Sécurité testée (token crossing, RBAC, admin auth)
- ✅ Pipeline cron testé (auth, routing, aliases, error handling)

### 5. Build

```bash
$ npm run build
✅ SUCCESS
Duration: 6.03s
```

**Bundles générés** (dist/):

| Fichier | Taille | Gzip | Type |
|---------|--------|------|------|
| `sentry-vendor-CoIjcvB_.js` | 448.13 KB | 148.14 KB | Vendor (Sentry) |
| `vendor-Dw01xqZ7.js` | 238.55 KB | 77.03 KB | Vendor |
| `ui-vendor-zaUsLEYf.js` | 179.09 KB | 53.66 KB | UI (Radix) |
| `react-vendor-G8xDjibz.js` | 143.44 KB | 46.03 KB | React |
| `utils-vendor-36Iqftsx.js` | 56.89 KB | 17.44 KB | Utils |
| `react-ecosystem-CIL9U2SL.js` | 55.83 KB | 17.66 KB | React Query |
| `index-C58hOrtc.js` | 53.59 KB | 15.72 KB | App |
| `react-router-vendor-U56_dN4l.js` | 36.99 KB | 13.46 KB | Router |
| `index-CRRgrz9s.css` | 94.96 KB | 15.28 KB | Styles |

**Observations**:
- ✅ Vendor splitting optimisé (PR #94)
- ✅ Sentry isolé dans son propre chunk
- ⚠️ Sentry vendor = 448KB (148KB gzip) → acceptable mais surveiller
- ✅ Code splitting par route (lazy loading)

---

## 📁 INVENTAIRE PROJET

### Modèles Prisma (28 modèles)

**Portail Public** (7):
- `Aide` (aides sociales)
- `Demarche` (démarches administratives)
- `Structure` (annuaire structures)
- `Dispositif` (dispositifs locaux)
- `Actualite` (actualités RSS)
- `Guide` (guides pratiques)
- `ToolboxItem` (outils téléchargeables)

**Taxonomie** (3):
- `AidCategory`
- `LifeSituation`
- `AidSource`

**Ingestion** (5):
- `ImportLog`
- `RssSource`
- `UpdateLog`
- `Source`
- `SourceSnapshot`

**V2 Service (RDV + Comptes)** (8):
- `ProUser` (professionnels)
- `Service` (services proposés)
- `Availability` (créneaux disponibles)
- `Beneficiary` (bénéficiaires)
- `Appointment` (rendez-vous)
- `Message` (messagerie)
- `Attachment` (pièces jointes)
- `Invitation` (invitations structure)

**Admin & Sécurité** (5):
- `AdminUser`
- `AuditLog`
- `ConsentLog`
- `EntityVersion` (versioning)
- `PartnershipRequest`

**Accessibilité** (1):
- `ResourceAccessibility`

### API Handlers (70 fichiers)

**Répertoires**:
- `admin/` (gestion admin)
- `auth/` (authentification)
- `booking/` (réservation RDV)
- `cron/` (jobs planifiés)
- `dispositifs/` (dispositifs locaux)
- `otp/` (codes OTP)
- `pro/` (espace professionnel)
- `public/` (API publique)

**Handlers racine** (18):
- `actualites.js`, `aides.js`, `demarches.js`, `structures.js`
- `guides.js`, `tools.js`, `ressources.js`
- `sitemap.js`, `robots.js`
- `health.js`, `version.js`
- `categories.js`, `taxonomy.js`
- `upload.js`, `download.js`
- `sentry-test.js`, `ratelimit-test.js`
- `blocked.js`, `login-pro-guard.js`

### Pages Frontend (69 fichiers)

**Portail Public**:
- `Home.jsx`, `Aides.jsx`, `AideDetail.jsx`
- `Demarches.jsx`, `DemarcheDetail.jsx`
- `Annuaire.jsx`, `StructureDetail.jsx`
- `Dispositifs.jsx`, `DispositifDetail.jsx`
- `Actualites.jsx`, `ActualiteDetail.jsx`
- `Guides.jsx`, `GuideDetail.jsx`
- `Tools.jsx`, `ToolDetail.jsx`
- `Ressources.jsx`, `RessourceDetail.jsx`

**Institutionnel**:
- `APropos.jsx`, `Mission.jsx`, `Impact.jsx`, `Method.jsx`
- `Partners.jsx`, `Sources.jsx`, `SourcesMethode.jsx`
- `Contact.jsx`, `SuggestStructure.jsx`

**Légal & Conformité**:
- `MentionsLegales.jsx`, `Confidentialite.jsx`, `Cookies.jsx`
- `Accessibilite.jsx`, `Security.jsx`

**Admin** (13 pages dans `admin/`):
- Dashboard, Sync, TestSync, RecentSyncs, GuideSync
- Aides, AideEdit, Demarches, DemarcheEdit
- Structures, Sources, Messages, Appointments, Review

**Pro** (espace professionnel):
- Login, Dashboard, Appointments, Messages, Team, Services, Structure, Inbox

**Booking**:
- `AppointmentRequest.jsx`, `AppointmentDetail.jsx`, `BeneficiaryMessages.jsx`

**Autres**:
- `Layout.jsx`, `NotFound.jsx`, `StyleguideBranding.jsx`, `SentryTestPage.jsx`
- `SubventionDossier.jsx` (formulaire subvention)

### Composants (73 fichiers estimés)

Répertoire `src/components/` (non détaillé ici, voir INVENTORY.md).

---

## 🔐 VARIABLES D'ENVIRONNEMENT

### Fichier `.env.example`

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
POSTGRES_PRISMA_URL=postgresql://user:password@host:5432/dbname?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/dbname

# Security
ADA_ENCRYPTION_KEY=your-64-char-hex-key-here
JWT_SECRET=your-jwt-secret-here
CRON_SECRET=your-cron-secret-here

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password-here
ADMIN_TOKEN=your-admin-token-here

# Vercel
VERCEL_AUTOMATION_BYPASS_SECRET=your-bypass-secret-here

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Sentry
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# App
PUBLIC_BASE_URL=https://your-domain.com
VITE_BASE_URL=https://your-domain.com
VITE_DEV_LOGIN_ENABLED=false
ALLOW_DEV_TOOLS=false

# Blackbox (optional)
BLACKBOX_API_KEY=your-blackbox-api-key
```

**Variables critiques identifiées**:
- ✅ `ADA_ENCRYPTION_KEY` (64-char hex = 32 bytes, pour chiffrement données sensibles)
- ✅ `JWT_SECRET` (tokens auth)
- ✅ `CRON_SECRET` (protection routes cron)
- ✅ `DATABASE_URL` + `POSTGRES_PRISMA_URL` + `POSTGRES_URL_NON_POOLING` (Neon Postgres)
- ✅ `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate limiting prod)
- ✅ `VITE_SENTRY_DSN` (observabilité)

---

## 🚀 VERCEL CONFIGURATION

### Cron Jobs (2)

```json
{
  "path": "/api/cron/pipeline",
  "schedule": "0 * * * *"  // Toutes les heures
}
{
  "path": "/api/cron/ingest-structures",
  "schedule": "0 2 * * 0"  // Dimanche 2h
}
```

### Redirects (4)

- `/guide/:slug` → `/demarches` (permanent)
- `/aide/:slug` → `/aides/:slug` (permanent)
- `/login/pro` → `/pro/login` (permanent)
- `/home` → `/` (permanent)

### Rewrites (5)

- `/sitemap.xml` → `/api`
- `/robots.txt` → `/api`
- `/__dev/:path*` → `/api` (dev tools)
- `/api/(.*)` → `/api`
- `/((?!api/|.*\\..*).*)` → `/index.html` (SPA fallback)

### Security Headers (6)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy: default-src 'self'; connect-src 'self' https: wss: *.sentry.io; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; img-src 'self' data: https: blob:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;`

**Observations**:
- ✅ Headers de sécurité robustes
- ⚠️ CSP utilise `'unsafe-inline'` et `'unsafe-eval'` (nécessaire pour Vite/React en prod, mais à surveiller)
- ✅ HSTS avec preload
- ✅ Protection XSS, clickjacking, MIME sniffing

---

## 📜 HISTORIQUE GIT RÉCENT

### Commits Clés (30 derniers)

**PR #98** (HEAD, main):
- `8f1fc7a` - chore: Phase 0 & 1 - Inventory and Repo Hygiene

**PR #96** (Phase 8 - SEO & Accessibility):
- `293b56c` - docs(final): add final execution report with all PR links
- `cf923ab` - docs(a11y): add comprehensive accessibility audit

**PR #95** (Phase 5 - Portal Public Polish):
- `4229349` - docs(phase5): add phase 5 completion summary
- `5ac438b` - feat(actualites): add pagination with URL persistence

**PR #94** (Phase 4 - CI Stability):
- `c24fbea` - docs(phase4): add phase 4 completion summary
- `7c7df84` - feat(ci): make typecheck strict and add CI documentation
- `d20e645` - docs(audit): add comprehensive phase 0 audit
- `9e5ffcf` - feat(observability): integrate ErrorBoundary with Sentry
- `4f83c1d` - feat(observability): add ErrorBoundary and query state utilities
- `a216155` - feat(seo): add breadcrumbs and JSON-LD schema utilities
- `9e63d3e` - feat(ux): add query state utilities and loading skeleton components
- `c2c050f` - perf(build): fix circular chunk deps and optimize vendor splitting
- `d781ab9` - perf: split vendor bundle into smaller chunks

**Observations**:
- ✅ Historique propre avec conventional commits
- ✅ PRs documentées avec phases claires
- ✅ Travail récent sur CI, SEO, accessibilité, observabilité
- ✅ Optimisations performance (vendor splitting)
- ✅ Intégration Sentry + ErrorBoundary

---

## 🔍 ZONES FRAGILES IDENTIFIÉES (Deepsearch)

### 1. CI/CD

**Problème**: Pas de service Postgres dans GitHub Actions.

```yaml
# .github/workflows/ci.yml
env:
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db" # Dummy
```

**Impact**:
- Tests unitaires passent (mocks Prisma)
- Mais tests d'intégration DB ne sont pas exécutés en CI
- Risque de régressions non détectées

**Action requise**: Phase 1 - Ajouter service Postgres.

### 2. Prisma Schema - Traçabilité Partielle

**Champs manquants** sur certains modèles:
- `Aide`: ✅ `retrieved_at`, `last_checked_at`, `source_url_exact` présents
- `Demarche`: ✅ `retrieved_at`, `last_checked_at`, `source_url_exact` présents
- `Structure`: ✅ `retrieved_at`, `last_checked_at`, `source_url_exact` présents
- `Dispositif`: ✅ `retrieved_at`, `last_checked_at`, `source_url_exact` présents
- `Actualite`: ❌ Pas de `retrieved_at`, `last_checked_at` (mais `fetched_at` présent)

**Champs idempotence**:
- `Aide`: ✅ `content_hash`
- `Demarche`: ✅ `content_hash`
- `Structure`: ✅ `content_hash`, `raw_data_hash`
- `Dispositif`: ✅ `content_hash`
- `Actualite`: ✅ `dedupe_hash`, `raw_data_hash`

**Action requise**: Phase 3 - Harmoniser champs traçabilité.

### 3. Rate Limiting - Fallback Mémoire

**Code** (`api/_utils/rateLimit.js`):
```javascript
if (!process.env.UPSTASH_REDIS_REST_URL) {
  // Fallback mémoire
}
```

**Problème**:
- En prod sans KV configuré → fallback mémoire (non partagé entre instances serverless)
- Risque de bypass rate limiting

**Action requise**: Phase 2 - Vérifier config KV prod.

### 4. Sentry - Source Maps

**Build** génère source maps (`.map` files).

**Question**: Source maps uploadés à Sentry ?

**Action requise**: Phase 2 - Vérifier upload source maps.

### 5. Secrets - Scan Requis

**Observation**: `.env.example` sanitizé ✅

**Action requise**: Phase 5 - Scanner repo pour secrets committés.

---

## 📋 PROCHAINES ÉTAPES (Phases 1-6)

### Phase 1 - CI/Tests/DevEx
- [ ] Ajouter service Postgres dans GitHub Actions
- [ ] Initialiser DB test + migrations Prisma
- [ ] Vérifier jsdom / environment Vitest
- [ ] Stabiliser tests (0 flakies)

### Phase 2 - API/Routing/Cron
- [ ] Vérifier protection routes cron (CRON_SECRET)
- [ ] Vérifier rate limiting KV prod
- [ ] Vérifier Sentry source maps
- [ ] Traiter warnings dépréciations (url.parse si présent)

### Phase 3 - Prisma/DB/Ingestion
- [ ] Harmoniser champs traçabilité (retrieved_at, last_checked_at)
- [ ] Vérifier idempotence ingestion (upsert, content_hash)
- [ ] Ajouter index DB manquants
- [ ] Tester ingestion 3x sans doublons

### Phase 4 - Frontend/UX/SEO
- [ ] Vérifier parcours utilisateur (Aides, Démarches, Annuaire, Actualités)
- [ ] Vérifier SEO (canonical, sitemap, robots, meta)
- [ ] Vérifier accessibilité (navigation clavier, contrastes, aria)
- [ ] Ajouter mode FALC baseline

### Phase 5 - Sécurité/RGPD/Auth
- [ ] Scanner secrets committés
- [ ] Auditer JWT / sessions / admin endpoints
- [ ] Créer docs SECURITY.md + RGPD.md

### Phase 6 - V2 Service
- [ ] SPEC RBAC (matrice permissions)
- [ ] SPEC RDV (booking, anti double-booking)
- [ ] SPEC Outlook sync (Microsoft Graph OAuth2)
- [ ] Schéma Prisma V2 (déjà présent, à valider)
- [ ] Endpoints stub sous feature flag

---

## ✅ CONCLUSION BASELINE

**État**: ✅ **STABLE ET OPÉRATIONNEL**

Le projet AccesDirectAide est dans un état sain avec:
- ✅ 126/126 tests passants
- ✅ Build réussi
- ✅ Lint/Typecheck propres
- ✅ Stack moderne et cohérente
- ✅ Schéma Prisma riche (28 modèles)
- ✅ API bien structurée (70 handlers)
- ✅ Frontend complet (69 pages)
- ✅ Sécurité headers robustes
- ✅ Historique Git propre

**Points d'attention**:
- ⚠️ CI sans DB réelle (Phase 1)
- ⚠️ Traçabilité à harmoniser (Phase 3)
- ⚠️ Rate limiting à vérifier en prod (Phase 2)
- ⚠️ Secrets à scanner (Phase 5)

**Prêt pour audit approfondi et phases 1-6.**

---

**Signature**: Blackbox Remote Code  
**Date**: 2026-02-07  
**Commit**: 566137e
