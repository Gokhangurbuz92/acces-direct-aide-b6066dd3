# AccesDirectAide (ADA) - État du Projet

**Date:** 3 février 2026  
**Phase:** PHASE 0 - AUDIT RÉEL + BASELINE  
**Statut Global:** ✅ P0 + P1 Complets, Prêt pour P2 (Migrations + Service)

---

## 📊 Résumé Exécutif

Le projet AccesDirectAide est un **portail public + service professionnel** permettant :
- **Public** : Recherche et consultation d'aides, démarches, structures, dispositifs, ressources
- **Pro** : Gestion de structure, services, rendez-vous, messagerie sécurisée
- **Admin** : Gestion de contenu, ingestion automatisée, monitoring

### État Actuel (Baseline)
- ✅ **Build:** OK (7.00s, warning chunks >500kb attendu)
- ✅ **Lint:** OK (0 errors, 0 warnings)
- ✅ **Typecheck:** OK (0 errors)
- ✅ **Secrets:** Aucun secret commité (scan propre)
- ✅ **Portail Public:** 5 modules complets avec traçabilité
- ⚠️ **Migrations:** À vérifier (historique complexe)
- 🔄 **Service (RDV/Messagerie):** Modèles présents, à finaliser

---

## 🏗️ Architecture Technique

### Stack
- **Frontend:** React 18 + Vite 6 + Tailwind CSS + shadcn/ui
- **Backend:** Node.js (Vercel Serverless Functions)
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Storage:** S3-compatible (AWS SDK)
- **Auth:** JWT (Pro) + Bearer Token (Admin/Cron)
- **Monitoring:** Sentry (frontend + API)
- **Rate Limiting:** Vercel KV (@upstash/ratelimit)

### Structure du Projet
```
/vercel/sandbox/
├── api/                    # Backend (Serverless Functions)
│   ├── _handlers/          # Route handlers
│   │   ├── admin/          # Admin endpoints
│   │   ├── auth/           # Authentication
│   │   ├── booking/        # Appointments
│   │   ├── cron/           # Scheduled jobs
│   │   ├── pro/            # Pro user endpoints
│   │   └── public/         # Public endpoints
│   ├── _utils/             # Utilities (auth, crypto, rate-limit)
│   ├── lib/                # Business logic
│   │   ├── connectors/     # Data ingestion connectors
│   │   ├── crypto.js       # AES-256-GCM encryption
│   │   └── pro-auth.js     # JWT auth for Pro users
│   └── routes.js           # API routing
├── src/                    # Frontend
│   ├── pages/              # React pages
│   │   ├── admin/          # Admin UI
│   │   └── pro/            # Pro dashboard
│   └── components/         # Reusable components
├── prisma/                 # Database
│   ├── schema.prisma       # Data models
│   └── migrations/         # Migration history
├── scripts/                # Automation scripts
├── tests/                  # Integration tests
├── e2e/                    # Playwright E2E tests
└── docs/                   # Documentation
```

---

## 📦 Modules Fonctionnels

### PORTAIL PUBLIC (Sans Compte) ✅

#### 1. Aides (`/aides`)
- **Routes:** `/aides` (liste) → `/aides/:slug` (détail)
- **API:** `GET /api/aides`, `GET /api/aides/:slugOrId`
- **Fonctionnalités:**
  - Filtres : catégorie, urgence, territoire, département
  - Pagination
  - Traçabilité complète (source_url, retrieved_at, last_checked_at)
  - FALC (summary_falc)
  - SEO (sitemap, canonical, metas)
- **Statut:** ✅ Complet

#### 2. Démarches (`/demarches`)
- **Routes:** `/demarches` (liste) → `/demarches/:slug` (détail)
- **API:** `GET /api/demarches`, `GET /api/demarches/:slugOrId`
- **Fonctionnalités:** Similaires aux Aides
- **Statut:** ✅ Complet

#### 3. Structures/Annuaire (`/structures`)
- **Routes:** `/structures` (liste) → `/structures/:slug` (détail)
- **API:** `GET /api/structures`, `GET /api/structures/:slugOrId`
- **Fonctionnalités:**
  - Filtres : type, département, ville, accessibilité PMR
  - Géolocalisation (latitude/longitude)
  - Association Pro (is_pro_enabled)
  - Traçabilité
- **Statut:** ✅ Complet

#### 4. Dispositifs (`/dispositifs`)
- **Routes:** `/dispositifs` (liste) → `/dispositifs/:slug` (détail)
- **API:** `GET /api/dispositifs` (handler existe)
- **Statut:** ✅ Complet

#### 5. Ressources Accessibilité (`/ressources`)
- **Routes:** `/ressources` (liste) → `/ressources/:slug` (détail)
- **API:** `GET /api/ressources`, `GET /api/ressources/:slugOrId`
- **Statut:** ✅ Complet (ajouté en P1)

#### 6. Actualités (`/actualites`)
- **Routes:** `/actualites` (liste) → `/actualites/:slug` (détail)
- **API:** `GET /api/actualites`, `GET /api/actualites/:slugOrId`
- **Fonctionnalités:** Agrégation RSS, déduplication
- **Statut:** ✅ Complet

#### 7. Guides & Méthode
- **Routes:** `/guides`, `/method`
- **Statut:** ✅ Pages présentes

### SERVICE (Avec Compte) 🔄

#### Auth & RBAC
- **Modèles:** AdminUser, ProUser
- **Endpoints:**
  - `POST /api/auth/login` (Admin)
  - `POST /api/pro/auth/login` (Pro)
  - `POST /api/pro/auth/register`
  - `POST /api/pro/auth/forgot-password`
  - `POST /api/pro/auth/reset-password`
- **Statut:** ✅ Implémenté, à tester

#### Espace Pro
- **Dashboard:** `/pro/dashboard`
- **Gestion Structure:** `/pro/structure`
- **Gestion Services:** `/pro/services`
- **Gestion Équipe:** `/pro/team`
- **Statut:** ✅ UI présente, à finaliser

#### Rendez-vous (Doctolib Social)
- **Modèles:** Appointment, Availability, Service
- **Endpoints:**
  - `POST /api/booking/request` (Public)
  - `GET /api/pro/appointments` (Pro)
  - `PATCH /api/pro/appointments/:id` (Pro)
- **Flows:**
  - Public → Demande RDV
  - Pro → Accepte/Refuse/Replanifie
  - Anti double-booking (lock_expires_at)
- **Statut:** 🔄 Modèles OK, flows à tester

#### Messagerie
- **Modèles:** Message, Attachment
- **Endpoints:**
  - `GET /api/pro/inbox` (Pro)
  - `POST /api/pro/messages` (Pro)
  - `GET /api/beneficiary/messages/:token` (Beneficiary)
- **Sécurité:** Chiffrement E2E (content_encrypted)
- **Statut:** 🔄 Implémenté, à tester

#### Documents
- **Storage:** S3-compatible (AWS SDK)
- **Endpoints:**
  - `POST /api/upload` (Signed URLs)
  - `GET /api/download/:key` (Signed URLs)
- **Statut:** 🔄 Implémenté, à tester

### INGESTION & QUALITÉ 🔄

#### Pipeline Automatisé
- **Orchestrateur:** `POST /api/cron/pipeline`
- **Connecteurs:**
  - `POST /api/cron/ingest-aids` (Aides)
  - `POST /api/cron/ingest-structures` (Structures)
- **Sécurité:** Bearer Token (CRON_SECRET)
- **Statut:** ✅ Implémenté, à tester en prod

#### Link Check
- **Endpoint:** `POST /api/cron/link-check`
- **Admin Report:** `GET /api/admin/link-checks`
- **Fonctionnalité:** Détection liens cassés (source_url)
- **Statut:** ✅ Implémenté

#### RGPD
- **Purge:** `POST /api/cron/gdpr-purge`
- **Export:** À implémenter
- **Statut:** 🔄 Purge OK, export manquant

---

## 🗄️ Base de Données (Prisma)

### Modèles Principaux

#### Contenu Public
- **Aide** (28 champs) : titre, categorie, territoires, source_url, retrieved_at, last_checked_at, summary_falc
- **Demarche** (24 champs) : titre, categorie, etapes, source_url, retrieved_at
- **Structure** (38 champs) : nom, type_structure, adresse, geoloc, is_pro_enabled, source_url
- **Dispositif** (15 champs) : titre, description_falc, public, source_url
- **ResourceAccessibility** (10 champs) : title, type, content, source_url
- **Actualite** (32 champs) : titre, contenu, source, fetched_at

#### Service (Pro)
- **ProUser** : email, password_hash, role, structureId
- **Service** : name, description_falc, duration_minutes, modes
- **Availability** : slots_json, exceptions_json
- **Appointment** : status, start_at, end_at, mode, access_token_hash
- **Beneficiary** : contact_encrypted, contact_hash
- **Message** : content_encrypted, sender, appointmentId
- **Attachment** : filename_encrypted, storage_key

#### Admin
- **AdminUser** : email, password, role
- **AuditLog** : action, actor, target, details
- **ImportLog** : source_name, status, items_total
- **SourceSnapshot** : entity_type, entity_id, http_status, content_hash

### Migrations

**Historique:**
```
20260117183014_init
20260118023835_init_base44_schema
20260118024431_add_statut_and_admin_user
20260118025434_hardened_schema
20260118031221_lot3_search_seo
20260118034254_lot4_pro_foundations
20260118041848_lot5_appointments
20260118043545_lot6_messaging
20260118062920_lot8_partnership_request
20250202120000_add_aides_fields_and_unaccent
```

**État:** ⚠️ À vérifier (migration `20250202120000` avec date incohérente)

**Actions Requises (PHASE 2):**
1. Vérifier `_prisma_migrations` sur DB cible
2. Identifier migrations failed/rolled_back
3. Rendre migrations idempotentes (ADD COLUMN IF NOT EXISTS)
4. Documenter runbook migrations

---

## 🔐 Sécurité

### Variables d'Environnement Critiques

| Variable | Usage | Statut |
|----------|-------|--------|
| `DATABASE_URL` | Connexion DB (pooling) | ✅ Requis |
| `POSTGRES_URL_NON_POOLING` | Connexion directe (migrations) | ✅ Requis |
| `ADA_ENCRYPTION_KEY` | Chiffrement AES-256-GCM (64 hex chars) | ✅ Requis |
| `JWT_SECRET` | Signature tokens Pro | ✅ Requis |
| `ADMIN_TOKEN` | Auth admin statique | ✅ Requis |
| `CRON_SECRET` | Protection endpoints cron | ✅ Requis |
| `AWS_ACCESS_KEY_ID` | Storage S3 | ⚠️ Optionnel |
| `AWS_SECRET_ACCESS_KEY` | Storage S3 | ⚠️ Optionnel |
| `SENTRY_DSN` | Monitoring erreurs | ⚠️ Optionnel |

### Scan Secrets
```bash
git grep -nE "JWT_SECRET|CRON_SECRET|ADMIN_TOKEN|ADA_ENCRYPTION_KEY|sk-" -- .
```
**Résultat:** ✅ Aucun secret réel commité (uniquement .env.example, tests, docs)

### Chiffrement
- **Algorithme:** AES-256-GCM
- **Champs chiffrés:**
  - Beneficiary: contact_encrypted, first_name_encrypted
  - Message: content_encrypted
  - Attachment: filename_encrypted
- **Implémentation:** `api/lib/crypto.js`

### RBAC
- **Admin:** Accès `/api/admin/*` (ADMIN_TOKEN)
- **Pro:** Accès `/api/pro/*` (JWT)
- **Public:** Accès `/api/aides`, `/api/structures`, etc. (rate-limited)

---

## 🧪 Tests

### Integration Tests (Vitest)
```bash
npm run test:api
```
**Fichiers:**
- `tests/integration/ressources.test.js`
- `tests/integration/pipeline_routing.test.js`
- `api/_handlers/cron/pipeline.test.js`

**Statut:** ✅ Tests présents

### E2E Tests (Playwright)
```bash
npx playwright test
```
**Fichiers:**
- `e2e/cp2_list_to_detail.spec.ts` (Aides, Démarches, Structures, Actualités)
- `e2e/ressources-navigation.spec.js` (Ressources)

**Statut:** ✅ Tests présents, à stabiliser (ports dynamiques)

---

## 📈 Qualité du Code

### Baseline (3 février 2026)

#### Lint
```bash
npm run lint
```
**Résultat:** ✅ 0 errors, 0 warnings

#### Typecheck
```bash
npm run typecheck
```
**Résultat:** ✅ 0 errors

#### Build
```bash
npm run build
```
**Résultat:** ✅ Build OK (7.00s)
**Warning:** Chunk vendor-i8FXlNyg.js = 893.56 kB (>500kb)
**Action:** P2 - Optimiser avec manualChunks

### Preuves
Logs sauvegardés dans `/vercel/sandbox/proofs/phase0-baseline/`:
- `baseline-lint.log`
- `baseline-typecheck.log`
- `baseline-build.log`

---

## 🚀 Déploiement

### Environnements
- **Production:** `acces-direct-aide.fr` (Vercel)
- **Staging:** `staging.acces-direct-aide.fr` (Vercel)
- **Preview:** Branches PR (Vercel)

### CI/CD
- **GitHub Actions:** `.github/workflows/ci.yml`
- **Checks:** lint, typecheck, build
- **Statut:** ✅ CI configuré

### Vercel
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`
- **Cron Jobs:** À configurer (pipeline, link-check, purge)

---

## 📋 Définition de "Fini" (Gates)

### P0 - Working Product ✅
- [x] Navigation list→detail fonctionne (5 modules)
- [x] API endpoints retournent 200 (pas de 500)
- [x] Sitemap génère URLs valides
- [x] Cron endpoints protégés (Bearer token)
- [x] CI passe (lint + typecheck + build)
- [x] Observabilité de base (Sentry, logs)

### P1 - Reliable Content ✅
- [x] Traçabilité enforced (source_url, retrieved_at, last_checked_at)
- [x] UI traçabilité (composant SourceTraceability)
- [x] Templates détail cohérents
- [x] FALC (summary_falc présent)
- [x] Link-check (job + admin endpoint)

### P2 - Production Standard 🔄
- [ ] Migrations propres (migrate deploy OK)
- [ ] Auth + RBAC testés (integration tests)
- [ ] RDV flow complet (E2E Playwright)
- [ ] Messagerie testée (E2E)
- [ ] Documents upload/download testés
- [ ] RGPD export implémenté
- [ ] Performance optimisée (chunks <500kb)
- [ ] Runbooks complets (deployment, security, incidents)

---

## 🎯 Priorités Immédiates (PHASE 1-2)

### PHASE 1 - Hygiène ✅
- [x] Fix lint warning Health.jsx (DÉJÀ OK - 0 warnings)
- [x] Vérifier navigation critique (DÉJÀ OK)
- [x] Baseline qualité (FAIT)

### PHASE 2 - Migrations (BLOQUANT PROD) ⚠️
1. **Diagnostiquer migrations:**
   ```bash
   # Sur DB cible (Neon)
   SELECT * FROM _prisma_migrations 
   WHERE finished_at IS NULL OR logs LIKE '%error%'
   ORDER BY started_at DESC;
   ```

2. **Identifier problèmes:**
   - Migration `20250202120000` (date incohérente)
   - Colonnes déjà existantes (P3009)
   - Extension unaccent

3. **Stratégie correcte:**
   - Rendre migrations idempotentes (IF NOT EXISTS)
   - Créer migration corrective si nécessaire
   - Tester sur DB staging avant prod

4. **Runbook:**
   - Créer `/docs/RUNBOOK_MIGRATIONS.md`
   - Documenter résolution P3009/P3008
   - Règles "prod safe" (migrate deploy, pas dev)

### PHASE 3 - Portail Public (P1+)
- [x] Traçabilité partout (FAIT)
- [x] SEO (sitemap, canonical, robots) (FAIT)
- [ ] Accessibilité (audit clavier, focus, aria)
- [ ] FALC auto-génération (optionnel)

---

## 🐛 Problèmes Connus

### Critique
1. **Migrations:** Historique complexe, à vérifier sur DB prod
2. **Chunk Size:** vendor.js = 893kb (>500kb warning)

### Moyen
1. **E2E Flakiness:** Ports dynamiques, server start non déterministe
2. **Rate Limiting:** Fallback dev si KV absent (pas de fail closed)

### Mineur
1. **FALC:** Champ existe mais pas d'auto-génération
2. **Link-check:** Pas de cron schedulé (trigger manuel uniquement)
3. **Admin UI:** Link-check results via API uniquement (pas de dashboard)

---

## 📚 Documentation Existante

### Docs Techniques
- `README.md` - Getting started
- `IMPLEMENTATION_SUMMARY.md` - P0/P1 summary
- `PR_DESCRIPTION.md` - PR template
- `docs/INFRASTRUCTURE.md` - Infra source of truth
- `docs/VERCEL_MIGRATION_GUIDE.md` - Vercel setup
- `docs/SECURITY_MODEL.md` - RBAC, encryption
- `docs/RUNBOOK.md` - Incidents handling

### Docs Manquantes (À Créer)
- [ ] `docs/RUNBOOK_MIGRATIONS.md` (PHASE 2)
- [ ] `docs/DEPLOYMENT.md` (PHASE 8)
- [ ] `docs/DATA_MODEL.md` (PHASE 8)
- [ ] `docs/API_REFERENCE.md` (Optionnel)

---

## 🔄 Prochaines Étapes

### Immédiat (PHASE 2)
1. Diagnostiquer migrations DB
2. Fixer migrations non idempotentes
3. Tester `prisma migrate deploy` sur staging
4. Créer runbook migrations

### Court Terme (PHASE 3-4)
1. Audit accessibilité (WCAG AA)
2. Tester pipeline ingestion en prod
3. Configurer cron Vercel (pipeline, link-check)

### Moyen Terme (PHASE 5-7)
1. Tests integration auth + RBAC
2. E2E RDV flow complet
3. Tests messagerie + documents
4. Implémenter RGPD export

### Long Terme (PHASE 8)
1. Optimiser performance (chunks)
2. Stabiliser E2E (ports fixes)
3. Admin dashboard (link-check, metrics)
4. Runbooks complets

---

## 📞 Contact & Support

**Équipe:** Blackbox Agent (CTO/Tech Lead + Senior Fullstack + Data Engineer + QA Lead + DevOps)  
**Repo:** `/vercel/sandbox`  
**Date Baseline:** 3 février 2026  
**Version:** Portal V1 (P0+P1 Complete)

---

**Dernière mise à jour:** 3 février 2026 - PHASE 0 COMPLETE ✅
