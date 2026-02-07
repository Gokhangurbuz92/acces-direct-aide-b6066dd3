# INVENTORY - Inventaire Détaillé du Projet AccesDirectAide

**Date**: 2026-02-07  
**Auditeur**: Blackbox Remote Code  
**Commit**: 566137e

---

## 📊 VUE D'ENSEMBLE

| Catégorie | Quantité |
|-----------|----------|
| **Modèles Prisma** | 28 |
| **API Handlers** | 70 |
| **Pages Frontend** | 69 |
| **Composants** | ~73 |
| **Tests** | 126 (28 fichiers) |
| **Routes Cron** | 2 |
| **Redirects Vercel** | 4 |
| **Rewrites Vercel** | 5 |

---

## 🗄️ MODÈLES PRISMA (28)

### Portail Public (7 modèles)

#### 1. `Aide` (Aides Sociales)
**Champs clés**:
- `id`, `slug`, `titre`, `categorie`
- `est_urgent`, `territoires`, `departements`
- `cest_quoi`, `pour_qui`, `ce_que_ca_aide`
- `documents_necessaires`, `etapes`, `ou_demander`, `lien_demande`
- `statut`, `published_at`, `quality_score`
- `summary_falc`, `conditions_falc`, `montant_falc`
- `source_url`, `source_url_exact`, `content_hash`
- `retrieved_at`, `last_checked_at`, `source_last_modified`, `fetched_at`

**Relations**:
- `category` → `AidCategory`
- `source` → `AidSource`
- `situations` → `LifeSituation[]`

**Index**:
- `[statut, published_at]`
- `[categoryId, statut]`
- `[statut]`

#### 2. `Demarche` (Démarches Administratives)
**Champs clés**:
- `id`, `slug`, `titre`, `categorie`
- `description_courte`, `delai`, `cout`
- `pour_qui`, `documents_necessaires`, `etapes`
- `ou_faire`, `lien_officiel`, `sources`
- `statut`, `published_at`, `quality_score`
- `summary_falc`, `audiences`, `departements`
- `source_url`, `source_url_exact`, `content_hash`
- `retrieved_at`, `last_checked_at`, `source_last_modified`

**Relations**:
- `category` → `AidCategory`
- `situations` → `LifeSituation[]`

**Index**:
- `[statut, published_at]`
- `[categoryId, statut]`
- `[statut]`

#### 3. `Structure` (Annuaire Structures)
**Champs clés**:
- `id`, `slug`, `nom`, `type_structure`
- `adresse`, `code_postal`, `ville`, `departement`
- `latitude`, `longitude`
- `telephone`, `email`, `site_web`, `horaires`
- `services`, `publics_accueillis`, `categories_aidees`
- `accessibilite_pmr`, `description_courte`
- `statut`, `published_at`, `quality_score`
- `summary_falc`
- `siret`, `source_id`, `source_url`, `source_url_exact`
- `content_hash`, `raw_data_hash`
- `retrieved_at`, `last_checked_at`, `source_last_modified`
- `is_pro_enabled`, `settings_json`, `auto_publish`
- `geoloc_status`, `import_batch`, `import_status`, `last_sync`

**Relations**:
- `proUsers` → `ProUser[]`
- `proServices` → `Service[]`
- `availabilities` → `Availability[]`
- `appointments` → `Appointment[]`
- `invitations` → `Invitation[]`

**Index**:
- `[source_id]`, `[raw_data_hash]`, `[siret]`
- `[statut, ville]`, `[departement]`, `[type_structure]`
- `[statut, nom]`

#### 4. `Dispositif` (Dispositifs Locaux)
**Champs clés**:
- `id`, `slug`, `titre`
- `description_falc`, `summary_falc`
- `public`, `departement`, `montant`, `liens`
- `status`, `statut`, `published_at`
- `source_url`, `source_url_exact`, `content_hash`
- `retrieved_at`, `last_checked_at`, `source_last_modified`

**Index**:
- `[statut, published_at]`

#### 5. `Actualite` (Actualités RSS)
**Champs clés**:
- `id`, `slug`, `titre`, `contenu`, `resume`
- `date_publication`, `image_url`, `lien_url`, `url`
- `source`, `source_id`, `source_name`, `source_nom`, `source_url`
- `statut`, `published_at`, `quality_score`
- `canonical_url`, `guid`, `dedupe_hash`, `raw_data_hash`
- `category`, `categorie`, `type_actu`
- `summary_falc`, `key_points_falc`
- `territoire`, `departements`
- `est_important`, `auto_publish`
- `fetched_at`, `ingest_batch`, `raw_payload_json`
- `tags`, `score_fiabilite`, `falc_status`

**Index**:
- `[dedupe_hash]`, `[source_id]`, `[raw_data_hash]`
- `[statut, date_publication]`

#### 6. `Guide` (Guides Pratiques)
**Champs clés**:
- `id`, `slug`, `titre`
- `resume_falc`, `contenu_json`
- `categorie`, `publics`, `contexte`, `mots_cles`
- `sources_urls`
- `statut`, `published_at`

**Index**:
- `[statut, published_at]`

#### 7. `ToolboxItem` (Outils Téléchargeables)
**Champs clés**:
- `id`, `slug`, `titre`
- `resume_falc`, `type`, `categorie`
- `publics`, `url_download`, `contenu_html`
- `statut`, `published_at`

**Index**:
- `[statut, published_at]`

---

### Taxonomie (3 modèles)

#### 8. `AidCategory`
- `id`, `slug`, `label`
- Relations: `aides[]`, `demarches[]`

#### 9. `LifeSituation`
- `id`, `slug`, `label`
- Relations: `aides[]`, `demarches[]`

#### 10. `AidSource`
- `id`, `name`, `kind`, `baseUrl`
- `license`, `refreshPolicy`
- `lastRunAt`, `lastStatus`
- Relations: `aides[]`

---

### Ingestion & Logs (5 modèles)

#### 11. `ImportLog`
- `id`, `source_name`, `status`
- `items_total`, `items_new`, `duration_ms`
- `logs`, `createdAt`

#### 12. `RssSource`
- `id`, `name`, `feed_url`, `domain`
- `trust_level`, `enabled`
- `last_run_at`, `etag`, `last_modified`
- `error_count`, `last_error`

#### 13. `UpdateLog`
- `id`, `ran_at`, `status`, `duration_ms`
- `items_fetched_count`, `items_created_count`, `items_updated_count`, `items_skipped_count`
- `errors`, `source_name`, `is_dry_run`

#### 14. `Source`
- `id`, `name`, `type`, `url`
- `status`, `trust_level`, `last_sync`

#### 15. `SourceSnapshot`
- `id`, `entity_type`, `entity_id`
- `fetched_at`, `raw_excerpt`, `content_hash`
- `http_status`, `final_url`

**Index**:
- `[entity_type, entity_id]`, `[fetched_at]`

---

### V2 Service - RDV & Comptes (8 modèles)

#### 16. `ProUser` (Professionnels)
- `id`, `email`, `password_hash`, `role`
- `status`, `structureId`
- Relations: `structure`, `appointments[]`, `availability[]`

**Contrainte**: `@@unique([structureId, email])`

#### 17. `Service` (Services Proposés)
- `id`, `structureId`, `slug`, `name`
- `description_falc`, `duration_minutes`
- `modes`, `required_docs`, `audiences`
- `is_active`
- Relations: `structure`, `appointments[]`

**Contrainte**: `@@unique([structureId, slug])`

#### 18. `Availability` (Créneaux Disponibles)
- `id`, `structureId`, `proId`
- `slots_json`, `exceptions_json`
- Relations: `structure`, `pro`

**Contrainte**: `@@unique([structureId, proId])`

#### 19. `Beneficiary` (Bénéficiaires)
- `id`, `contact_encrypted`, `contact_hash`
- `first_name_encrypted`
- Relations: `appointments[]`

**Index**: `[contact_hash]`

#### 20. `Appointment` (Rendez-vous)
- `id`, `structureId`, `serviceId`, `proId`, `beneficiaryId`
- `status`, `start_at`, `end_at`, `timezone`
- `mode`, `lock_expires_at`
- `cancel_token_hash`, `access_token_hash`
- `metadata`
- Relations: `structure`, `service`, `pro`, `beneficiary`, `messages[]`

**Index**:
- `[structureId, start_at]`, `[proId, start_at]`
- `[cancel_token_hash]`, `[access_token_hash]`
- `[structureId, status, start_at]`

#### 21. `Message` (Messagerie)
- `id`, `appointmentId`, `sender`
- `content_encrypted`, `read_at`
- Relations: `appointment`, `attachments[]`

**Index**: `[appointmentId]`

#### 22. `Attachment` (Pièces Jointes)
- `id`, `messageId`
- `filename_encrypted`, `mime_type`, `size_bytes`
- `storage_key`
- Relations: `message`

**Index**: `[messageId]`

#### 23. `Invitation` (Invitations Structure)
- `id`, `structureId`, `email`, `role`
- `token`, `expires_at`, `used_at`
- Relations: `structure`

**Contrainte**: `token` unique

---

### Admin & Sécurité (5 modèles)

#### 24. `AdminUser`
- `id`, `email`, `password`, `role`
- `failedLoginAttempts`, `lastLogin`, `lockoutUntil`

#### 25. `AuditLog`
- `id`, `action`, `actor`, `target`
- `details`, `timestamp`, `ip`, `ip_hash`
- `actor_id`, `entity`, `entity_id`

#### 26. `ConsentLog`
- `id`, `policy_version`, `policy_hash`
- `subject_type`, `subject_id`, `created_at`

#### 27. `EntityVersion` (Versioning)
- `id`, `entity_type`, `entity_id`
- `snapshot_json`, `reason`, `actor_email`

**Index**: `[entity_type, entity_id]`

#### 28. `PartnershipRequest`
- `id`, `structureName`, `city`, `type`
- `website`, `email`, `message`
- `status`, `consent`, `ip_hash`

---

## 🔌 API HANDLERS (70 fichiers)

### Répertoires

#### `/api/_handlers/admin/` (Gestion Admin)
- `aides/create.js`, `aides/delete.js`, `aides/list.js`, `aides/update.js`
- `appointments/list.js`
- `demarches/create.js`, `demarches/delete.js`, `demarches/list.js`, `demarches/update.js`
- `guides/sync.js`
- `messages/list.js`
- `privacy/gdpr.js`
- `sources/list.js`
- `structures/list.js`
- `sync/recent.js`, `sync/run.js`, `sync/test.js`

#### `/api/_handlers/auth/`
- `forgot-password.js`
- `login.js`
- `register.js`
- `reset-password.js`

#### `/api/_handlers/booking/`
- `availability.js`
- `cancel.js`
- `confirm.js`
- `request.js`

#### `/api/_handlers/cron/`
- `ingest-structures.js`
- `pipeline.js` (orchestrateur principal)

#### `/api/_handlers/dispositifs/`
- `list.js`
- `detail.js`

#### `/api/_handlers/otp/`
- `send.js`
- `verify.js`

#### `/api/_handlers/pro/`
- `appointments/list.js`
- `dashboard.js`
- `login.js`
- `messages/list.js`, `messages/send.js`
- `services/create.js`, `services/list.js`
- `structure/get.js`, `structure/update.js`
- `team/invite.js`, `team/list.js`

#### `/api/_handlers/public/`
- `appointments/create.js`
- `messages/list.js`, `messages/send.js`
- `partnership/request.js`

### Handlers Racine (18)

| Handler | Description |
|---------|-------------|
| `actualites.js` | Liste actualités (pagination, filtres) |
| `aides.js` | Liste/détail aides (recherche, filtres) |
| `demarches.js` | Liste/détail démarches |
| `structures.js` | Liste/détail structures (annuaire) |
| `dispositifs.js` | Liste dispositifs locaux |
| `guides.js` | Liste guides pratiques |
| `tools.js` | Liste outils téléchargeables |
| `ressources.js` | Ressources accessibilité |
| `categories.js` | Taxonomie catégories |
| `taxonomy.js` | Taxonomie situations de vie |
| `sitemap.js` | Génération sitemap.xml |
| `robots.js` | Génération robots.txt |
| `health.js` | Health check |
| `version.js` | Version API + build info |
| `upload.js` | Upload fichiers (S3) |
| `download.js` | Download fichiers |
| `sentry-test.js` | Test Sentry |
| `ratelimit-test.js` | Test rate limiting |
| `blocked.js` | Page bloquée (rate limit) |
| `login-pro-guard.js` | Guard login pro |

---

## 🎨 PAGES FRONTEND (69 fichiers)

### Portail Public (18)

| Page | Route | Description |
|------|-------|-------------|
| `Home.jsx` | `/` | Page d'accueil |
| `Aides.jsx` | `/aides` | Liste aides (filtres, recherche) |
| `AideDetail.jsx` | `/aides/:slug` | Détail aide |
| `Demarches.jsx` | `/demarches` | Liste démarches |
| `DemarcheDetail.jsx` | `/demarches/:slug` | Détail démarche |
| `Annuaire.jsx` | `/annuaire` | Annuaire structures |
| `StructureDetail.jsx` | `/annuaire/:slug` | Détail structure |
| `Dispositifs.jsx` | `/dispositifs` | Liste dispositifs |
| `DispositifDetail.jsx` | `/dispositifs/:slug` | Détail dispositif |
| `Actualites.jsx` | `/actualites` | Liste actualités (pagination) |
| `ActualiteDetail.jsx` | `/actualites/:slug` | Détail actualité |
| `Guides.jsx` | `/guides` | Liste guides |
| `GuideDetail.jsx` | `/guides/:slug` | Détail guide |
| `Tools.jsx` | `/outils` | Liste outils |
| `ToolDetail.jsx` | `/outils/:slug` | Détail outil |
| `Ressources.jsx` | `/ressources` | Ressources accessibilité |
| `RessourceDetail.jsx` | `/ressources/:slug` | Détail ressource |
| `AppointmentRequest.jsx` | `/rdv/:structureSlug` | Demande RDV |

### Institutionnel (9)

| Page | Route | Description |
|------|-------|-------------|
| `APropos.jsx` | `/a-propos` | À propos |
| `Mission.jsx` | `/mission` | Mission |
| `Impact.jsx` | `/impact` | Impact |
| `Method.jsx` | `/methode` | Méthode |
| `Partners.jsx` | `/partenaires` | Partenaires |
| `Sources.jsx` | `/sources` | Sources de données |
| `SourcesMethode.jsx` | `/sources/methode` | Méthode sources |
| `Contact.jsx` | `/contact` | Contact |
| `SuggestStructure.jsx` | `/suggerer-structure` | Suggérer structure |

### Légal & Conformité (5)

| Page | Route | Description |
|------|-------|-------------|
| `MentionsLegales.jsx` | `/mentions-legales` | Mentions légales |
| `Confidentialite.jsx` | `/confidentialite` | Politique confidentialité |
| `Cookies.jsx` | `/cookies` | Politique cookies |
| `Accessibilite.jsx` | `/accessibilite` | Déclaration accessibilité |
| `Security.jsx` | `/securite` | Sécurité |

### Admin (13 dans `/admin/`)

| Page | Route | Description |
|------|-------|-------------|
| `AdminLogin.jsx` | `/admin/login` | Login admin |
| `Dashboard.jsx` | `/admin` | Dashboard admin |
| `AdminSync.jsx` | `/admin/sync` | Synchronisation manuelle |
| `AdminTestSync.jsx` | `/admin/test-sync` | Test sync (smoke) |
| `AdminRecentSyncs.jsx` | `/admin/recent-syncs` | Historique syncs |
| `AdminGuideSync.jsx` | `/admin/guide-sync` | Sync guides |
| `AdminAides.jsx` | `/admin/aides` | Gestion aides |
| `AdminAideEdit.jsx` | `/admin/aides/:id` | Édition aide |
| `AdminDemarches.jsx` | `/admin/demarches` | Gestion démarches |
| `AdminDemarcheEdit.jsx` | `/admin/demarches/:id` | Édition démarche |
| `AdminStructures.jsx` | `/admin/structures` | Gestion structures |
| `AdminSources.jsx` | `/admin/sources` | Gestion sources |
| `AdminMessages.jsx` | `/admin/messages` | Messages admin |
| `AdminAppointments.jsx` | `/admin/appointments` | RDV admin |
| `AdminReview.jsx` | `/admin/review` | Revue qualité |

### Pro (Espace Professionnel, dans `/pro/`)

| Page | Route | Description |
|------|-------|-------------|
| `LoginPro.jsx` | `/pro/login` | Login pro |
| `Dashboard.jsx` | `/pro` | Dashboard pro |
| `Appointments.jsx` | `/pro/appointments` | Gestion RDV |
| `AppointmentDetail.jsx` | `/pro/appointments/:id` | Détail RDV |
| `Messages.jsx` | `/pro/messages` | Messages |
| `Inbox.jsx` | `/pro/inbox` | Boîte réception |
| `Team.jsx` | `/pro/equipe` | Gestion équipe |
| `Services.jsx` | `/pro/services` | Gestion services |
| `Structure.jsx` | `/pro/structure` | Profil structure |
| `ProLayout.jsx` | - | Layout pro |

### Booking (3)

| Page | Route | Description |
|------|-------|-------------|
| `AppointmentRequest.jsx` | `/rdv/:structureSlug` | Demande RDV |
| `AppointmentDetail.jsx` | `/rdv/:id` | Détail RDV (bénéficiaire) |
| `BeneficiaryMessages.jsx` | `/rdv/:id/messages` | Messages RDV |

### Autres (5)

| Page | Route | Description |
|------|-------|-------------|
| `Layout.jsx` | - | Layout principal |
| `NotFound.jsx` | `*` | 404 |
| `StyleguideBranding.jsx` | `/styleguide` | Styleguide |
| `SentryTestPage.jsx` | `/sentry-test` | Test Sentry |
| `SubventionDossier.jsx` | `/subvention` | Formulaire subvention |

---

## 🧩 COMPOSANTS (Estimation ~73)

**Répertoire**: `/src/components/`

**Catégories** (non exhaustif):
- **UI Primitives**: Button, Input, Label, Textarea, Select, Checkbox, Radio, Switch, Slider, etc. (Radix UI wrappers)
- **Layout**: Header, Footer, Sidebar, Container, Grid, Stack
- **Navigation**: Navbar, Breadcrumbs, Pagination, Tabs
- **Forms**: FormField, FormError, FormLabel, FormControl
- **Feedback**: Alert, Toast, Dialog, Modal, Popover, Tooltip
- **Data Display**: Card, Table, Badge, Avatar, Accordion
- **Loading**: Skeleton, Spinner, ProgressBar
- **Specific**: AideCard, StructureCard, ActualiteCard, FilterPanel, SearchBar, FalcSummary, SEO, ErrorBoundary

---

## 🧪 TESTS (126 tests, 28 fichiers)

### Tests Unitaires (11 fichiers)

| Fichier | Tests | Description |
|---------|-------|-------------|
| `tests/unit/jsonld.test.js` | 10 | JSON-LD schema |
| `tests/unit/queryState.test.js` | 13 | Query state utilities |
| `tests/unit/ingestion.test.js` | 7 | Ingestion logic |
| `tests/unit/crypto.test.js` | 6 | Chiffrement |
| `tests/unit/falcsummary.test.js` | 9 | FALC summary |
| `tests/unit/pipeline.test.js` | 1 | Pipeline logic |
| `tests/unit/errorboundary.test.js` | 5 | ErrorBoundary (JS) |
| `tests/unit/errorBoundary.test.jsx` | 6 | ErrorBoundary (JSX) |
| `tests/unit/taxonomy.test.js` | 3 | Taxonomie |
| `tests/slug.test.js` | 7 | Slug generation |
| `tests/sitemap.test.js` | 1 | Sitemap |

### Tests d'Intégration (15 fichiers)

| Fichier | Tests | Description |
|---------|-------|-------------|
| `tests/integration/pipeline_routing.test.js` | 10 | Cron pipeline routing |
| `tests/integration/ressources.test.js` | 6 | Ressources API |
| `tests/integration/api.test.js` | 6 | API générale |
| `tests/integration/api_slug.test.js` | 3 | API slug search |
| `tests/integration/aides_v2.test.js` | 4 | Aides V2 |
| `tests/integration/rateLimit.test.js` | 2 | Rate limiting |
| `tests/integration/url_consistency.test.js` | 1 | URL consistency |
| `tests/integration/actualites.test.js` | 3 | Actualités |
| `tests/integration/api_head.test.js` | 1 | HEAD requests |
| `api/_handlers/cron/pipeline.test.js` | 2 | Pipeline handler |
| `api/_handlers/cron/pipeline.regression.test.js` | 2 | Pipeline regression |
| `api/_handlers/admin/privacy/gdpr.test.js` | 4 | GDPR |
| `api/tests/rbac.test.js` | 4 | RBAC |
| `api/tests/admin-security.test.js` | 1 | Admin security |
| `tests/auth_crossing.test.js` | 4 | Token crossing |

### Tests Scripts (2 fichiers)

| Fichier | Tests | Description |
|---------|-------|-------------|
| `scripts/test-sitemap-handler.test.js` | 3 | Sitemap handler |
| `api/lib/search-query.test.js` | 2 | Search query |

---

## 🔄 ROUTES CRON (2)

### 1. Pipeline Principal
```json
{
  "path": "/api/cron/pipeline",
  "schedule": "0 * * * *"
}
```
**Fréquence**: Toutes les heures  
**Handler**: `api/_handlers/cron/pipeline.js`  
**Sources**: `structures`, `aides`, `rss` (actualités)

### 2. Ingestion Structures
```json
{
  "path": "/api/cron/ingest-structures",
  "schedule": "0 2 * * 0"
}
```
**Fréquence**: Dimanche 2h  
**Handler**: `api/_handlers/cron/ingest-structures.js`

---

## 🔀 REDIRECTS VERCEL (4)

| Source | Destination | Type |
|--------|-------------|------|
| `/guide/:slug` | `/demarches` | Permanent |
| `/aide/:slug` | `/aides/:slug` | Permanent |
| `/login/pro` | `/pro/login` | Permanent |
| `/home` | `/` | Permanent |

---

## 🔁 REWRITES VERCEL (5)

| Source | Destination | Description |
|--------|-------------|-------------|
| `/sitemap.xml` | `/api` | Sitemap dynamique |
| `/robots.txt` | `/api` | Robots dynamique |
| `/__dev/:path*` | `/api` | Dev tools |
| `/api/(.*)` | `/api` | API routes |
| `/((?!api/\|.*\\..*).*)` | `/index.html` | SPA fallback |

---

## 🔐 CONNECTEURS INGESTION

### Sources Identifiées

**Structures**:
- Connecteur principal (à documenter en Phase 3)
- Champs: `source_id`, `source_url`, `import_batch`

**Aides**:
- `AidSource` (modèle)
- Champs: `source_name`, `source_url`, `providerName`, `providerType`

**Actualités**:
- `RssSource` (modèle)
- Champs: `feed_url`, `domain`, `trust_level`, `etag`, `last_modified`

**Démarches**:
- Champs: `source_url`, `sources` (JSON)

**Dispositifs**:
- Champs: `source_url`, `liens` (JSON)

---

## 📋 SCRIPTS NPM

| Script | Commande | Description |
|--------|----------|-------------|
| `dev` | `vite` | Dev server |
| `build` | `vite build` | Build prod |
| `preview` | `vite preview` | Preview build |
| `lint` | `eslint .` | Linting |
| `typecheck` | `tsc -p tsconfig.typecheck.json --noEmit` | Typecheck |
| `test` | `vitest run` | Tests |
| `test:api` | `vitest run tests/integration` | Tests API |
| `db:deploy` | `prisma migrate deploy` | Migrations prod |
| `db:migrate` | `prisma migrate dev` | Migrations dev |
| `db:seed` | `prisma db seed` | Seed DB |
| `postinstall` | `prisma generate && node scripts/generate-build-info.js` | Post-install |
| `verify` | `node scripts/verify-*.js` | Vérifications |
| `guard:prisma` | `node scripts/guard-prisma.js` | Guard Prisma |

---

## 🛠️ UTILITAIRES API (`/api/_utils/`)

**Fichiers clés** (à documenter en Phase 2):
- `wrapper.js` (wrapper handlers)
- `errors.js` (gestion erreurs)
- `rateLimit.js` (rate limiting)
- `cronAuth.js` (auth cron)
- `sentry.js` (Sentry init)
- `crypto.js` (chiffrement)
- `prisma.js` (client Prisma)
- `build-info.js` (build info)

---

## 📊 CONCLUSION INVENTORY

**Inventaire complet établi** avec:
- ✅ 28 modèles Prisma documentés
- ✅ 70 API handlers listés
- ✅ 69 pages frontend cataloguées
- ✅ 126 tests inventoriés
- ✅ 2 routes cron identifiées
- ✅ 4 redirects + 5 rewrites Vercel

**Prêt pour phases d'audit approfondies.**

---

**Signature**: Blackbox Remote Code  
**Date**: 2026-02-07
