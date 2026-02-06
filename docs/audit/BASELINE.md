# BASELINE - État Initial du Projet AccesDirectAide

**Date de l'audit**: 2026-02-06  
**Auditeur**: Blackbox Remote Code (Staff Engineer + QA Lead + Security/Compliance Lead)  
**Commit de référence**: 566137e (Merge PR #98 - Phase 0 & 1 Inventory and Repo Hygiene)

---

## 1. ENVIRONNEMENT TECHNIQUE

### 1.1 Node.js & Runtime
- **Version Node.js**: v22.22.0 (Amazon Linux 2023)
- **Package Manager**: npm (avec package-lock.json)
- **Type de module**: ESM (`"type": "module"` dans package.json)

### 1.2 Stack Technique Confirmée

#### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 6.1.0
- **Routing**: react-router-dom 7.2.0
- **UI Components**: Radix UI (composants accessibles)
- **Styling**: Tailwind CSS 3.4.17 + tailwindcss-animate
- **State Management**: @tanstack/react-query 5.90.16
- **Forms**: react-hook-form 7.54.2 + @hookform/resolvers 4.1.2
- **Validation**: zod 3.24.2
- **Markdown**: react-markdown 10.1.0 + remark-gfm + rehype-raw
- **SEO**: react-helmet-async 2.0.5
- **Animations**: framer-motion 12.4.7

#### Backend
- **Runtime**: Vercel Serverless Functions (Node.js)
- **API Structure**: `/api` directory avec handlers modulaires
- **Database**: PostgreSQL (Neon) via Prisma ORM 5.22.0
- **Auth**: JWT (jsonwebtoken 9.0.3) + bcryptjs 3.0.3
- **Encryption**: AES-256-GCM (natif Node.js crypto)
- **Rate Limiting**: @upstash/ratelimit 2.0.8 + @vercel/kv 3.0.0
- **Observabilité**: Sentry (@sentry/node 10.34.0 + @sentry/react 10.34.0)
- **Storage**: AWS S3 (@aws-sdk/client-s3 3.980.0)
- **Logging**: pino 10.3.0

#### Tests & Qualité
- **Test Framework**: Vitest 4.0.18
- **E2E Tests**: Playwright 1.58.0
- **Linting**: ESLint 9.19.0
- **TypeScript**: 5.9.3 (typecheck only, pas de compilation TS)

---

## 2. RÉSULTATS DES COMMANDES BASELINE

### 2.1 Installation des dépendances
```bash
$ npm ci
✅ SUCCESS
- 957 packages installés
- 0 vulnérabilités détectées
- Prisma Client généré (v5.22.0)
- Build info généré (/vercel/sandbox/api/_utils/build-info.js)
```

### 2.2 Linting
```bash
$ npm run lint
✅ SUCCESS - Aucune erreur, aucun warning
```

**Analyse**: Le code respecte les règles ESLint configurées. Pas de problèmes de style ou de qualité détectés.

### 2.3 Typecheck
```bash
$ npm run typecheck
✅ SUCCESS - Aucune erreur TypeScript
```

**Configuration**: `tsconfig.typecheck.json` cible uniquement `e2e/**/*.ts` avec `strict: false`.

**Note**: Le typecheck est limité aux tests E2E. Le code source principal (src/, api/) n'est pas vérifié par TypeScript.

### 2.4 Tests Unitaires & Intégration
```bash
$ npm run test
✅ SUCCESS
- 28 fichiers de tests
- 126 tests passés (100%)
- Durée: 3.66s
- Aucun test flaky détecté
```

**Détail des tests**:
- ✅ Tests unitaires: jsonld, queryState, ingestion, crypto, falcsummary, taxonomy, errorBoundary
- ✅ Tests d'intégration API: aides, demarches, structures, actualites, appointments
- ✅ Tests de sécurité: auth_crossing, admin-security, RBAC
- ✅ Tests pipeline: cron/pipeline, pipeline_routing, pipeline.regression
- ✅ Tests infrastructure: rateLimit, sitemap, robots, url_consistency

**Observations**:
- Tous les tests utilisent une DB en mémoire (pas de service Postgres en CI actuellement)
- Rate limiting utilise backend MEMORY en tests (fallback correct)
- Logs structurés présents (INFO, WARN, ERROR)
- Gestion d'erreurs robuste (ZodError, AppError)

### 2.5 Build Production
```bash
$ npm run build
✅ SUCCESS
- Build Vite réussi en 6.89s
- Chunks optimisés (code splitting)
- Source maps générées
- Taille totale: ~1.2 MB (gzipped: ~400 KB)
```

**Analyse des bundles**:
- Vendor chunks séparés (react, ui, utils, sentry)
- Lazy loading des pages (route-based code splitting)
- Pas d'erreurs de build, pas de warnings critiques

---

## 3. ARCHITECTURE DU PROJET

### 3.1 Structure des Répertoires

```
/vercel/sandbox/
├── api/                      # Backend Serverless Functions
│   ├── _handlers/            # Handlers API modulaires
│   │   ├── admin/            # Routes admin (auth requise)
│   │   ├── auth/             # Authentification
│   │   ├── booking/          # Système RDV
│   │   ├── cron/             # Jobs cron (ingestion, purge)
│   │   ├── dispositifs/      # Dispositifs publics
│   │   ├── otp/              # One-Time Passwords
│   │   ├── pro/              # Routes professionnels
│   │   └── public/           # Routes publiques
│   ├── _utils/               # Utilitaires (wrapper, errors, crypto, rate-limit)
│   ├── lib/                  # Bibliothèques (search-query, etc.)
│   └── tests/                # Tests API
├── src/                      # Frontend React
│   ├── api/                  # Client API (fetch wrappers)
│   ├── components/           # Composants React réutilisables
│   ├── design/               # Design system (ui/, icons/)
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilitaires frontend
│   ├── pages/                # Pages React (routing)
│   └── utils/                # Helpers frontend
├── prisma/                   # Schéma DB + migrations
│   ├── schema.prisma         # Modèles de données
│   ├── migrations/           # Migrations SQL
│   └── seed.js               # Seed data
├── scripts/                  # Scripts utilitaires (seed, verify, etc.)
├── tests/                    # Tests unitaires & intégration
├── e2e/                      # Tests Playwright
├── docs/                     # Documentation
│   ├── audit/                # 🆕 Dossier d'audit (ce document)
│   ├── roadmap/              # Roadmaps techniques
│   └── spec/                 # Spécifications
├── .github/workflows/        # CI/CD GitHub Actions
└── vercel.json               # Configuration Vercel (routes, cron, headers)
```

### 3.2 Routes API Principales

**Routes Publiques** (pas d'auth):
- `GET /api/aides` - Liste des aides (filtres, pagination, recherche)
- `GET /api/aides?slug=...` - Détail d'une aide
- `GET /api/demarches` - Liste des démarches
- `GET /api/structures` - Annuaire des structures
- `GET /api/actualites` - Actualités (RSS)
- `GET /api/dispositifs` - Dispositifs locaux
- `GET /api/guides` - Guides pratiques
- `GET /api/tools` - Boîte à outils
- `GET /api/sitemap.xml` - Sitemap SEO
- `GET /api/robots.txt` - Robots.txt
- `POST /api/appointments` - Demande de RDV (public)
- `GET /api/health` - Health check

**Routes Admin** (auth: ADMIN_TOKEN ou JWT admin):
- `POST /api/auth/admin/login` - Login admin
- `GET /api/admin/aides` - Gestion aides
- `PUT /api/admin/aides/:id` - Édition aide
- `GET /api/admin/structures` - Gestion structures
- `GET /api/admin/appointments` - Gestion RDV
- `GET /api/admin/messages` - Messagerie admin
- `POST /api/admin/sync` - Déclenchement ingestion manuelle

**Routes Pro** (auth: JWT pro):
- `POST /api/auth/pro/login` - Login pro
- `GET /api/pro/structure` - Infos structure
- `GET /api/pro/appointments` - RDV de la structure
- `GET /api/pro/messages` - Messagerie pro
- `POST /api/pro/availability` - Gestion disponibilités

**Routes Cron** (auth: CRON_SECRET):
- `POST /api/cron/pipeline?source=...` - Pipeline d'ingestion
- `POST /api/cron/ingest-structures` - Ingestion structures
- `POST /api/cron/gdpr-purge` - Purge RGPD
- `POST /api/cron/link-check` - Vérification liens

### 3.3 Pages Frontend Principales

**Portail Public**:
- `/` - Home (accueil)
- `/aides` - Liste des aides (filtres: urgence, localisation, public, thème)
- `/aides/:slug` - Détail d'une aide (conditions, montants, étapes, sources)
- `/demarches` - Liste des démarches
- `/demarches/:slug` - Détail d'une démarche
- `/annuaire` - Annuaire des structures (carte + liste)
- `/annuaire/:slug` - Détail d'une structure (horaires, services, contact)
- `/actualites` - Actualités (pagination)
- `/actualites/:slug` - Détail d'une actualité
- `/dispositifs` - Dispositifs locaux
- `/dispositifs/:slug` - Détail d'un dispositif
- `/guides` - Guides pratiques
- `/guides/:slug` - Détail d'un guide
- `/ressources` - Ressources (outils, partenaires)

**Pages Légales & Info**:
- `/a-propos` - À propos
- `/contact` - Contact
- `/confidentialite` - Politique de confidentialité
- `/mentions-legales` - Mentions légales
- `/cookies` - Politique cookies
- `/accessibilite` - Déclaration d'accessibilité

**Espace Pro**:
- `/pro/login` - Login pro
- `/pro/dashboard` - Tableau de bord pro
- `/pro/structure` - Gestion structure
- `/pro/team` - Gestion équipe
- `/pro/services` - Gestion services
- `/pro/appointments` - Gestion RDV
- `/pro/inbox` - Messagerie pro

**Espace Admin**:
- `/admin/login` - Login admin
- `/admin/dashboard` - Tableau de bord admin
- `/admin/aides` - Gestion aides
- `/admin/demarches` - Gestion démarches
- `/admin/structures` - Gestion structures
- `/admin/appointments` - Gestion RDV
- `/admin/messages` - Messagerie admin
- `/admin/sync` - Synchronisation données

---

## 4. SCHÉMA PRISMA - MODÈLES DE DONNÉES

### 4.1 Modèles Portail Public

**Aide** (aides sociales):
- Champs principaux: titre, categorie, est_urgent, territoires, delai_indicatif
- Contenu: cest_quoi, pour_qui, ce_que_ca_aide, documents_necessaires, etapes
- Métadonnées: statut, published_at, quality_score, mots_cles
- FALC: summary_falc, conditions_falc, montant_falc
- Traçabilité: source_url, source_url_exact, retrieved_at, last_checked_at, source_last_modified
- Relations: category, source, situations

**Demarche** (démarches administratives):
- Champs: titre, categorie, description_courte, delai, cout
- Contenu: pour_qui, documents_necessaires, etapes, ou_faire, lien_officiel
- Traçabilité: source_url, source_url_exact, retrieved_at, last_checked_at
- Relations: category, situations

**Structure** (annuaire):
- Identification: nom, type_structure, siret, slug
- Localisation: adresse, code_postal, ville, departement, latitude, longitude
- Contact: telephone, email, site_web, horaires
- Services: services[], publics_accueillis[], categories_aidees[]
- Accessibilité: accessibilite_pmr, summary_falc
- Pro: is_pro_enabled, settings_json, auto_publish
- Traçabilité: source_url, source_url_exact, retrieved_at, last_checked_at
- Relations: proUsers, appointments, availabilities, proServices

**Actualite** (actualités RSS):
- Contenu: titre, contenu, resume, image_url, lien_url
- Métadonnées: date_publication, source, categorie, tags
- FALC: summary_falc, key_points_falc
- Déduplication: dedupe_hash, raw_data_hash, canonical_url
- Traçabilité: source_url, fetched_at

**Dispositif** (dispositifs locaux):
- Contenu: titre, description_falc, public[], departement, montant
- Traçabilité: source_url, source_url_exact, retrieved_at, last_checked_at

### 4.2 Modèles Système RDV (V2 Service)

**ProUser** (professionnels):
- Auth: email, password_hash, role, status
- Relations: structure, appointments, availability

**Service** (services proposés):
- Contenu: name, description_falc, duration_minutes, modes, required_docs
- Relations: structure, appointments

**Availability** (disponibilités):
- Données: slots_json, exceptions_json
- Relations: structure, pro

**Beneficiary** (bénéficiaires):
- PII chiffré: contact_encrypted, first_name_encrypted
- Déduplication: contact_hash
- Relations: appointments

**Appointment** (rendez-vous):
- Planification: start_at, end_at, timezone, mode
- Statut: status (requested, confirmed, cancelled, completed)
- Sécurité: access_token_hash, cancel_token_hash, lock_expires_at
- Relations: structure, service, pro, beneficiary, messages

**Message** (messagerie):
- Contenu chiffré: content_encrypted
- Métadonnées: sender, createdAt, read_at
- Relations: appointment, attachments

**Attachment** (pièces jointes):
- Métadonnées chiffrées: filename_encrypted
- Stockage: storage_key, mime_type, size_bytes
- Relations: message

### 4.3 Modèles Admin & Audit

**AdminUser**: Comptes admin (email, password, role)
**AuditLog**: Logs d'audit (action, actor, target, details, timestamp, ip_hash)
**EntityVersion**: Versioning des entités (snapshots JSON)
**SourceSnapshot**: Snapshots des sources externes (traçabilité)
**ConsentLog**: Logs de consentement RGPD

### 4.4 Modèles Ingestion

**AidSource**: Sources d'aides (name, baseUrl, license, lastRunAt, lastStatus)
**RssSource**: Sources RSS (feed_url, domain, trust_level, etag, last_modified)
**ImportLog**: Logs d'import (source_name, status, items_total, items_new, duration_ms)
**UpdateLog**: Logs de mise à jour (ran_at, status, items_fetched/created/updated/skipped, errors)

### 4.5 Observations sur le Schéma

✅ **Points forts**:
- Champs de traçabilité présents (source_url, retrieved_at, last_checked_at)
- Déduplication via hash (content_hash, dedupe_hash, raw_data_hash)
- Chiffrement PII (contact_encrypted, content_encrypted, filename_encrypted)
- Index DB bien placés (statut, published_at, departement, etc.)
- Relations cohérentes (foreign keys, cascades)
- Support FALC (summary_falc, conditions_falc, etc.)

⚠️ **Points à améliorer** (identifiés pour Phase 3):
- Champ `source_url_exact` présent mais pas toujours utilisé dans ingestion
- Champ `last_seen_at` manquant (pour détecter contenus obsolètes)
- Champ `ingested_at` manquant (pour tracer date d'ingestion)
- Pas de champ `source_title` (pour afficher nom de la source)
- Pas de champ `region` explicite (seulement departements[])
- Idempotence à vérifier (stratégie upsert à auditer)

---

## 5. CONFIGURATION VERCEL

### 5.1 Cron Jobs
```json
{
  "crons": [
    {
      "path": "/api/cron/pipeline",
      "schedule": "0 * * * *"  // Toutes les heures
    },
    {
      "path": "/api/cron/ingest-structures",
      "schedule": "0 2 * * 0"  // Dimanche à 2h
    }
  ]
}
```

### 5.2 Redirects
- `/guide/:slug` → `/demarches` (permanent)
- `/aide/:slug` → `/aides/:slug` (permanent)
- `/login/pro` → `/pro/login` (permanent)
- `/home` → `/` (permanent)

### 5.3 Rewrites
- `/sitemap.xml` → `/api` (handler dynamique)
- `/robots.txt` → `/api` (handler dynamique)
- `/__dev/:path*` → `/api` (dev tools)
- `/api/(.*)` → `/api` (serverless functions)
- `/((?!api/|.*\\..*).*) → `/index.html` (SPA fallback)

### 5.4 Security Headers
✅ Tous les headers de sécurité sont configurés:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), ...`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy: default-src 'self'; connect-src 'self' https: wss: *.sentry.io; ...`

**Note**: CSP utilise `'unsafe-inline'` et `'unsafe-eval'` pour scripts (nécessaire pour Vite/React en dev, à revoir pour prod stricte).

---

## 6. VARIABLES D'ENVIRONNEMENT

### 6.1 Variables Requises (d'après .env.example)

**Database**:
- `DATABASE_URL` - URL Postgres (pooling)
- `POSTGRES_URL_NON_POOLING` - URL Postgres (direct, pour migrations)

**Security**:
- `JWT_SECRET` - Secret JWT (min 32 chars)
- `ADA_ENCRYPTION_KEY` - Clé AES-256-GCM (64-char hex = 32 bytes)
- `ADMIN_TOKEN` - Token admin pour API
- `CRON_SECRET` - Secret pour routes cron

**Site Config**:
- `PUBLIC_BASE_URL` - URL publique (ex: https://www.accesdirectaide.fr)

**Rate Limiting** (Vercel KV):
- `KV_REST_API_URL` - URL Upstash Redis
- `KV_REST_API_TOKEN` - Token Upstash Redis

**Development Flags** (⚠️ NE PAS UTILISER EN PROD):
- `VITE_DEV_LOGIN_ENABLED` - Activer login dev (default: false)
- `ALLOW_DEV_TOOLS` - Activer outils dev (default: false)

**Optional**:
- `BYPASS_SECRET` - Secret pour automation Vercel
- `VITE_SENTRY_DSN` - DSN Sentry frontend
- `SENTRY_DSN` - DSN Sentry backend
- `BLACKBOX_API_KEY` - Clé API Blackbox (pour IA)

### 6.2 Variables Manquantes ou Non Documentées

⚠️ Variables vues dans le code mais absentes de .env.example:
- `ADMIN_EMAIL` - Email admin par défaut
- `ADMIN_PASSWORD` - Mot de passe admin par défaut
- `UPSTASH_REDIS_REST_URL` - Alias de KV_REST_API_URL ?
- `UPSTASH_REDIS_REST_TOKEN` - Alias de KV_REST_API_TOKEN ?
- `VITE_BASE_URL` - URL base pour frontend (doublon de PUBLIC_BASE_URL ?)
- `VITE_API_URL` - URL API pour frontend

**Action requise (Phase 5)**: Documenter toutes les variables, clarifier les alias, vérifier la cohérence.

---

## 7. CI/CD - GITHUB ACTIONS

### 7.1 Workflow Actuel (.github/workflows/ci.yml)

**Jobs**:
1. ✅ Checkout code
2. ✅ Setup Node.js 20 (avec cache npm)
3. ✅ Install dependencies (`npm ci`)
4. ✅ Lint (`npm run lint`)
5. ✅ Typecheck (`npm run typecheck`)
6. ✅ Build (`npm run build`)
7. ✅ Unit Tests (`npm run test`)
8. ✅ Install Playwright browsers
9. ✅ Start preview server & Run E2E tests

**Variables d'environnement CI**:
- `DATABASE_URL`: "postgresql://user:pass@localhost:5432/db" (dummy)
- `ADA_ENCRYPTION_KEY`: 64-char hex (dummy)
- `JWT_SECRET`: "dummy_jwt_secret"
- `VITE_API_URL`: "http://localhost:3000"

### 7.2 Problèmes Identifiés

⚠️ **Pas de service Postgres en CI**:
- DATABASE_URL est dummy
- Les tests utilisent une DB en mémoire (mock Prisma)
- Les tests d'intégration ne testent pas vraiment la DB

⚠️ **Pas de tests de migration**:
- `prisma migrate deploy` n'est jamais exécuté en CI
- Risque de régressions sur le schéma DB

⚠️ **E2E tests fragiles**:
- Dépendent d'un serveur preview (`npm run preview`)
- Pas de gestion d'erreurs si le serveur ne démarre pas
- Pas de timeout explicite

**Action requise (Phase 1)**: Ajouter service Postgres en CI, tester les migrations, stabiliser les E2E.

---

## 8. HISTORIQUE GIT RÉCENT

### 8.1 Derniers Commits (20 derniers)

```
566137e - Merge PR #98: Phase 0 & 1 - Inventory and Repo Hygiene
8f1fc7a - chore: Phase 0 & 1 - Inventory and Repo Hygiene
c796ebf - Merge PR #96: Phase 8 - SEO & Accessibility
293b56c - docs(final): add final execution report with all PR links
2f9b1bd - docs(final): confirm all branches pushed to origin
f9676c6 - docs(final): add final execution completion report
d6cba96 - docs(pr): add comprehensive PR summary for all phases
0e3f222 - docs(summary): add multi-phase execution summary
b95eb55 - docs(phase8): add phase 8 completion summary
cf923ab - docs(a11y): add comprehensive accessibility audit
d31d4a7 - Merge PR #95: Phase 5 - Portal Public Polish
4229349 - docs(phase5): add phase 5 completion summary
5ac438b - feat(actualites): add pagination with URL persistence
63de852 - Merge PR #94: Phase 4 - CI Stability
c24fbea - docs(phase4): add phase 4 completion summary
7c7df84 - feat(ci): make typecheck strict and add CI documentation
d20e645 - docs(audit): add comprehensive phase 0 audit
e8cca33 - docs(sprint4): add execution summary and timeline
39b0d51 - docs(sprint4): add comprehensive sprint summary
9bc820d - docs(sprint4): add comprehensive PR summary
```

### 8.2 Observations

✅ **Travail récent structuré**:
- Phases 0, 1, 4, 5, 8 complétées
- Documentation exhaustive (audit, summaries, PR reports)
- Branches propres, PRs mergées

⚠️ **Phases manquantes** (d'après les instructions):
- Phase 2: Architecture API / Routing / Cron
- Phase 3: Prisma / DB / Ingestion
- Phase 6: V2 Service (RBAC, RDV, Outlook)
- Phase 7: Sécurité / RGPD / Auth

**Conclusion**: Le projet a déjà subi un audit partiel. Les phases 2, 3, 6, 7 restent à compléter selon les instructions.

---

## 9. SCRIPTS UTILITAIRES

### 9.1 Scripts de Vérification (scripts/verify-*.js)

Le projet contient de nombreux scripts de vérification:
- `verify-actualites.js` - Vérifier actualités
- `verify-admin-noindex.js` - Vérifier noindex admin
- `verify-content-population.js` - Vérifier population contenu
- `verify-env.js` - Vérifier variables d'environnement
- `verify-handler-imports.js` - Vérifier imports handlers
- `verify-imports.js` - Vérifier imports généraux
- `verify-lot2.js` à `verify-lot9a-routes.js` - Vérifier lots fonctionnels
- `verify-rdv.js` - Vérifier système RDV
- `verify-robots.js` - Vérifier robots.txt
- `verify-seo.js` - Vérifier SEO
- `verify-sitemap.js` - Vérifier sitemap
- `verify-staging.sh` - Vérifier staging
- `verify_messaging.js` - Vérifier messagerie
- `verify_prod_pipeline.sh` - Vérifier pipeline prod

### 9.2 Scripts de Seed (scripts/seed-*.js)

- `seed-aides-with-taxonomy.js` - Seed aides avec taxonomie
- `seed-demarches.ts` - Seed démarches
- `seed-lot3-data.js` à `seed-lot7-data.js` - Seed par lot
- `seed-minimum-aides.js` - Seed aides minimales
- `seed-minimum-demarches.js` - Seed démarches minimales
- `seed-minimum-structures.js` - Seed structures minimales
- `seed-rss-sources.js` - Seed sources RSS
- `seed-taxonomy.js` - Seed taxonomie

### 9.3 Scripts d'Ingestion (scripts/import-*.js, scripts/test-*.js)

- `import-csv.js` - Import CSV générique
- `import-structures-alsace.js` - Import structures Alsace
- `test-alsace-ingest.js` - Test ingestion Alsace
- `test-ingest-aids.js` - Test ingestion aides
- `test-news-pipeline.js` - Test pipeline actualités
- `trigger-ingestion.js` - Déclencher ingestion manuelle

### 9.4 Scripts de Sécurité & Admin

- `create-admin.js` - Créer compte admin
- `create-pro-admin.js` - Créer compte pro admin
- `debug-security.mjs` - Debug sécurité
- `security-check.js` - Vérification sécurité
- `test-admin-security.js` - Test sécurité admin

### 9.5 Observations

✅ **Points forts**:
- Nombreux scripts de vérification (bonne pratique)
- Scripts de seed pour chaque entité
- Scripts de test pour ingestion

⚠️ **Points à améliorer**:
- Pas de documentation centralisée des scripts
- Certains scripts en `.ts`, d'autres en `.js` (incohérence)
- Pas de script `npm run verify` global (existe mais à vérifier)

---

## 10. PROBLÈMES DÉTECTÉS (À TRAITER DANS LES PHASES SUIVANTES)

### 10.1 Phase 1 - CI / Tests / DevEx

❌ **P1.1 - Pas de service Postgres en CI**:
- DATABASE_URL dummy en CI
- Tests ne testent pas vraiment la DB
- Risque de régressions sur schéma/migrations

❌ **P1.2 - Pas de tests de migration**:
- `prisma migrate deploy` jamais exécuté en CI
- Pas de vérification de cohérence schéma

❌ **P1.3 - E2E tests fragiles**:
- Dépendent d'un serveur preview
- Pas de gestion d'erreurs robuste

### 10.2 Phase 2 - Architecture API / Routing / Cron

⚠️ **P2.1 - Deprecation warning potentiel**:
- Node.js DEP0169 (`url.parse()`) à vérifier dans le code
- Remplacer par WHATWG URL si présent

⚠️ **P2.2 - Rate limiting fallback**:
- Fallback mémoire OK en dev/test
- Vérifier que prod utilise bien KV (UPSTASH_REDIS_REST_URL)

⚠️ **P2.3 - Protection routes cron**:
- Routes cron protégées par CRON_SECRET (à vérifier)
- Vérifier que CRON_SECRET est bien défini en prod

⚠️ **P2.4 - Observabilité Sentry**:
- Vérifier init Sentry côté API
- Vérifier source maps
- Vérifier que PII n'est pas loggée

### 10.3 Phase 3 - Prisma / DB / Ingestion

⚠️ **P3.1 - Champs de traçabilité incomplets**:
- `source_url_exact` présent mais pas toujours utilisé
- `last_seen_at` manquant (pour détecter obsolescence)
- `ingested_at` manquant (pour tracer date d'ingestion)
- `source_title` manquant (pour afficher nom source)

⚠️ **P3.2 - Idempotence à vérifier**:
- Stratégie upsert à auditer (clé stable ?)
- Déduplication via hash à tester (reruns sans doublons)

⚠️ **P3.3 - Validation données**:
- Normalisation dates, slugs, textes à vérifier
- HTML sanitation à vérifier
- Contrôle statut=publié à vérifier

⚠️ **P3.4 - Performance DB**:
- Index présents mais à vérifier en prod (EXPLAIN ANALYZE)
- Requêtes N+1 potentielles à auditer

### 10.4 Phase 4 - Frontend Pages (Aides / Démarches / Annuaire / Actualités) + UX

✅ **P4.1 - Navigation & routing**: OK (react-router-dom 7)
✅ **P4.2 - Filtres & recherche**: OK (query params, pagination)
✅ **P4.3 - SEO**: OK (sitemap, robots, meta, canonical)
✅ **P4.4 - Accessibilité**: OK (Radix UI, navigation clavier, contrastes)

⚠️ **P4.5 - FALC baseline**:
- Champs FALC présents (summary_falc, conditions_falc, etc.)
- Mode "lecture simple" à vérifier (UI toggle ?)

### 10.5 Phase 5 - Sécurité / RGPD / Auth Base

⚠️ **P5.1 - Politique secrets**:
- .env.example OK
- Vérifier qu'aucun secret n'est committé (scan git history)

⚠️ **P5.2 - Auth existante**:
- JWT OK (jsonwebtoken)
- Vérifier rotation, expiration, refresh
- Vérifier bcrypt rounds (10+ recommandé)

⚠️ **P5.3 - RGPD minimal**:
- Politique de confidentialité présente (/confidentialite)
- Vérifier minimisation données
- Vérifier logs (pas de PII en clair)

### 10.6 Phase 6 - V2 "SERVICE" (RBAC + RDV + Outlook)

✅ **P6.1 - Modélisation**: OK (ProUser, Service, Availability, Appointment, Message, Attachment)
✅ **P6.2 - RBAC**: Présent (role dans ProUser, AdminUser)
✅ **P6.3 - RDV**: Présent (booking flow, statuts, anti double-booking)

⚠️ **P6.4 - Outlook sync**:
- Pas de code Outlook détecté
- À implémenter (Microsoft Graph OAuth2)
- Stockage tokens chiffrés (ADA_ENCRYPTION_KEY)

⚠️ **P6.5 - Feature flags**:
- Pas de système de feature flags détecté
- À implémenter pour V2 (ex: `is_pro_enabled` dans Structure)

---

## 11. CONCLUSION BASELINE

### 11.1 État Général du Projet

✅ **Points forts**:
- Code propre, bien structuré, modulaire
- Tests complets (126 tests, 100% pass)
- Build réussi, pas d'erreurs
- Lint/typecheck OK
- Stack moderne et robuste (React, Vite, Prisma, Vercel)
- Sécurité de base présente (JWT, bcrypt, AES-256-GCM, headers)
- Accessibilité de base (Radix UI, FALC)
- SEO de base (sitemap, robots, meta)
- Documentation partielle (README, docs/)

⚠️ **Points à améliorer**:
- CI sans DB réelle (tests en mémoire)
- Ingestion à auditer (idempotence, traçabilité)
- Variables d'environnement à documenter
- Outlook sync à implémenter
- Feature flags à implémenter
- RGPD à compléter (docs, minimisation)

### 11.2 Prochaines Étapes (Phases 1-6)

**Phase 1 - CI / Tests / DevEx** (PRIORITÉ HAUTE):
- Ajouter service Postgres en CI
- Tester migrations Prisma
- Stabiliser E2E tests
- Documenter stratégie DB test

**Phase 2 - Architecture API / Routing / Cron** (PRIORITÉ HAUTE):
- Vérifier deprecation warnings (url.parse)
- Vérifier rate limiting prod (KV)
- Vérifier protection routes cron (CRON_SECRET)
- Vérifier Sentry (source maps, PII)

**Phase 3 - Prisma / DB / Ingestion** (PRIORITÉ HAUTE):
- Compléter champs traçabilité (last_seen_at, ingested_at, source_title)
- Vérifier idempotence (reruns sans doublons)
- Vérifier validation données (normalisation, sanitation)
- Optimiser requêtes DB (EXPLAIN ANALYZE)

**Phase 4 - Frontend Pages + UX** (PRIORITÉ MOYENNE):
- Vérifier mode FALC (UI toggle)
- Vérifier parcours utilisateur complet
- Lighthouse audit

**Phase 5 - Sécurité / RGPD / Auth** (PRIORITÉ HAUTE):
- Scanner secrets (git history)
- Vérifier auth (rotation, expiration, bcrypt rounds)
- Compléter docs RGPD (minimisation, logs)

**Phase 6 - V2 Service (RBAC + RDV + Outlook)** (PRIORITÉ MOYENNE):
- Implémenter Outlook sync (Microsoft Graph)
- Implémenter feature flags
- Documenter SPEC V2 (roadmap, DoD)

### 11.3 Métriques Baseline

| Métrique | Valeur | Statut |
|----------|--------|--------|
| Tests | 126/126 (100%) | ✅ |
| Lint | 0 erreurs | ✅ |
| Typecheck | 0 erreurs | ✅ |
| Build | Réussi (6.89s) | ✅ |
| Vulnérabilités npm | 0 | ✅ |
| CI GitHub Actions | ✅ (mais DB dummy) | ⚠️ |
| Coverage | Non mesuré | ❌ |
| Lighthouse | Non mesuré | ❌ |
| WCAG | Non mesuré | ❌ |

---

**FIN DU BASELINE**

Ce document sera complété par:
- `docs/audit/INVENTORY.md` - Inventaire détaillé des composants
- `docs/audit/CI.md` - Stratégie CI/CD (Phase 1)
- `docs/audit/API_CRON.md` - Architecture API/Cron (Phase 2)
- `docs/audit/INGESTION.md` - Stratégie ingestion (Phase 3)
- `docs/audit/UX_SEO_A11Y.md` - UX/SEO/Accessibilité (Phase 4)
- `docs/audit/STATUS.md` - Statut continu (mis à jour après chaque phase)
