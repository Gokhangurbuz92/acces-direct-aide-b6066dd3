# AUDIT /demarches - AccesDirectAide

**Date**: 2026-02-02
**Mission**: Rendre la page /demarches irréprochable (zéro bug, filtres fiables, traçabilité totale)

---

## 1. ÉTAT DES LIEUX (DISCOVERED ARCHITECTURE)

### 1.1 Frontend
- **Listing**: `/src/pages/Demarches.jsx` (238 lignes)
  - Barre de recherche avec `q` parameter
  - Filtres: `category`, `situation`, `page`
  - Utilise React Query + client API
  - Sidebar avec facettes (categories/situations)
  - Affiche `DemarcheCard` components

- **Detail**: `/src/pages/DemarcheDetail.jsx` (339 lignes)
  - Support slug-based URLs (`/demarches/:slug`)
  - Fallback ID-based (`/demarches/view?id=xxx`)
  - Canonical redirect (ID → slug)
  - Affiche: titre, description, étapes, documents, liens officiels

- **Card**: `/src/components/cards/DemarcheCard.jsx` (64 lignes)
  - Affiche titre, résumé FALC, catégorie, délai
  - Link vers detail (slug ou ID)

- **Admin**:
  - `/src/pages/AdminDemarches.jsx` (128 lignes) - Liste + CRUD
  - `/src/pages/AdminDemarcheEdit.jsx` (197 lignes) - Formulaire édition

### 1.2 Backend
- **API Handler**: `/api/_handlers/demarches.js` (58 lignes)
  - GET list/detail
  - POST/PUT/DELETE (501 Not Implemented)
  - Validation via `searchDemarchesSchema` (Zod)
  - Utilise `searchDemarches()` from `search-query.js`

- **Search Engine**: `/api/lib/search-query.js`
  - Full-text search via PostgreSQL tsvector
  - Filtres: q, category, situation, geo (départements)
  - Ranking par pertinence si q présent
  - Enrichissement avec relations (category, situations)

- **Routes**: `/api/routes.js`
  - `{ path: 'demarches', match: 'prefix', handler: demarches }`

- **Client API**: `/src/api/client.js`
  - `entities.Demarche.filter(query)` → `/api/demarches?...`
  - `entities.Demarche.get(id)` → `/api/demarches?id=xxx`

### 1.3 Database (Prisma Schema)
```prisma
model Demarche {
  id                    String          @id @default(uuid())
  titre                 String
  categorie             String?         // ⚠️ LEGACY field (raw string)
  description_courte    String?
  delai                 String?
  cout                  String?
  date_verification     DateTime?
  pour_qui              String?
  documents_necessaires String[]
  etapes                Json?
  ou_faire              String?
  lien_officiel         String?
  sources               Json?
  statut                String          @default("brouillon")
  slug                  String?         @unique
  summary_falc          String?
  audiences             String[]
  departements          String[]
  categoryId            String?         // ✅ FK to AidCategory
  category              AidCategory?    @relation(...)
  situations            LifeSituation[] @relation("DemarcheToSituation")

  // Ingestion Fields (PRESENT but NOT USED)
  source_url_exact      String?
  territory_scope       String?
  content_hash          String?

  // Missing critical fields:
  // ❌ apply_url (téléservice/portail)
  // ❌ organisme (ANTS, Ameli, CAF, etc.)
  // ❌ canal (en_ligne, guichet, courrier, telephone)
  // ❌ territoire_niveau (national, region, departement, commune)
  // ❌ territoire_codes (array for multi-territory)
  // ❌ fetched_at (datetime ingestion)
  // ❌ source_last_modified
  // ❌ falc_summary, falc_steps
  // ❌ processing_time
  // ❌ location (adresse guichet)
  // ❌ forms (cerfa URLs, PDFs)
  // ❌ contacts (tel/email)
}
```

**Taxonomies existantes**:
- `AidCategory` (shared avec Aide) - slug/label
- `LifeSituation` (shared avec Aide) - slug/label
- Many-to-Many: `_DemarcheToSituation`

**Full-text search**:
- Extension: `unaccent` ✅
- Column: `search_vector` (tsvector) - **DROPPED in migration 20260125181117**, puis **RE-ADDED in 20260228000001_add_fts_indexes**
- Function: `fn_calculate_search_vector(titre, summary_falc, mots_cles)`
- Index: GIN index on `search_vector` ✅

### 1.4 Seed Data
- `/scripts/seed-demarches.ts` (111 lignes)
  - 80 démarches fictives
  - Maps categories/situations from taxonomies
  - Sets `statut = 'publie'`
  - **NO source URLs, NO organisme, NO apply_url**

### 1.5 Ingestion / Cron
- Existing cron jobs:
  - `/api/_handlers/cron/ingest-aids.js`
  - `/api/_handlers/cron/ingest-structures.js`
  - `/api/_handlers/cron/pipeline.js` (orchestrator)
- **NO `/api/_handlers/cron/ingest-demarches.js` exists** ❌

---

## 2. ROOT CAUSES (BUGS & ISSUES)

### 2.1 Schema Incomplet (P0)
**Problem**: Le modèle `Demarche` manque de champs critiques pour respecter les exigences DOD.

**Missing Fields**:
- ❌ `apply_url` (lien téléservice/portail - OBLIGATOIRE pour "Faire la démarche")
- ❌ `organisme` (ANTS, Ameli, CAF, Préfecture, Impôts, etc.) - REQUIS pour filtre
- ❌ `canal` (en_ligne, guichet, courrier, telephone) - REQUIS pour filtre
- ❌ `territoire_niveau` (national, region, departement, commune)
- ❌ `territoire_codes` (array String[]) - remplacer `departements`
- ❌ `territoire_label` (label display)
- ❌ `fetched_at` (DateTime - OBLIGATOIRE traçabilité)
- ❌ `source_last_modified` (DateTime?)
- ❌ `falc_summary`, `falc_steps` (FALC support)
- ❌ `processing_time` (délai traitement - distinct de `delai`)
- ❌ `location` (adresse/guichet si dispo)
- ❌ `forms` (Json[] - cerfa_url, pdf_url)
- ❌ `contacts` (Json[] - tel/email/site)
- ❌ `steps` (Json[] structuré - actuellement `etapes` Json? non normalisé)
- ❌ `pieces_a_fournir` (distinct de `documents_necessaires`)
- ❌ `cost` (String? ou Int?) - actuellement `cout` String?
- ❌ `sous_categorie`, `sous_situation` (optionnel)
- ❌ `public` (String[] - handicap, seniors, jeunes, étrangers, famille)

**Legacy fields**:
- ⚠️ `categorie` (raw string) - remplacé par `categoryId` FK mais ENCORE utilisé en fallback
- ⚠️ `lien_officiel` - devrait être split en `source_url` (page info) + `apply_url` (action)

**Impact**:
- Impossible de filtrer par organisme, canal, territoire_niveau
- Pas de traçabilité (fetched_at manquant)
- Detail page ne peut pas afficher "Source officielle" vs "Faire la démarche" distinctement
- Pas de support FALC dédié
- Ingestion impossible (pas de champs pour stocker URLs exactes)

**Fix**: Migration pour ajouter tous les champs manquants + normaliser les existants.

---

### 2.2 API Incomplète (P0)
**Problem**: L'API `/api/demarches` ne supporte pas tous les filtres requis.

**Current filters** (validators.js):
```js
searchDemarchesSchema = baseSearchSchema.extend({
  category: z.string().optional(),
  situation: z.string().optional(),
  geo: z.string().optional(),
});
```

**Missing filters**:
- ❌ `organisme`
- ❌ `canal`
- ❌ `territoire_niveau` + `territoire_code`
- ❌ `public` (audiences)
- ❌ `statut` (default=publie mais non configurable)
- ❌ `sort` (pertinence/-created_date/title)
- ❌ `pageSize` (actuellement hardcoded en frontend)

**Missing facets response**:
- Actuellement: `{ items, pagination: { total, page, pageSize, totalPages } }`
- Requis: `{ items, pagination, facets: { categories, situations, organismes, territoires, canaux, publics } }`

**Impact**:
- Filtres incohérents, non combinables
- Pas de compteurs par facette
- URL query params incomplets (partage de lien impossible)

**Fix**:
- Étendre `searchDemarchesSchema` avec tous les params requis
- Adapter `searchDemarches()` pour supporter nouveaux filtres
- Ajouter calcul de facets (aggregation counts)

---

### 2.3 Search Query Logic (P1)
**Problem**: La logique de search dans `search-query.js` est rigide.

**Current**:
- Full-text via `plainto_tsquery('french', unaccent(${q}))`
- Filtres: category (via FK), situation (via M2M), geo (via `departements` array)
- Pas de tri configurable (toujours pertinence si q, sinon published_at DESC)

**Issues**:
- ❌ Pas de support pour fautes de frappe (trigram distance)
- ❌ Pas de tri par alpha, par date de collecte (fetched_at)
- ❌ Filtres nouveaux (organisme, canal, territoire_niveau, public) non implémentés

**Impact**:
- Recherche textuelle stricte (pas de tolérance aux fautes)
- Impossible de trier comme requis

**Fix**:
- Ajouter trigram similarity (`similarity(titre, ${q}) > 0.3`)
- Support sort param (pertinence/alpha/récent/fetched_at)
- Implémenter filtres nouveaux

---

### 2.4 Détail Page - Source Traceability (P0)
**Problem**: Page détail n'affiche PAS les URLs de traçabilité requises.

**Current** (DemarcheDetail.jsx):
- Affiche `lien_officiel` (unique link)
- Pas de distinction "Source officielle" vs "Faire la démarche"
- Pas d'affichage `fetched_at`, `source_last_modified`

**Required** (DOD 6):
- "Source officielle" → `source_url` (OBLIGATOIRE)
- "Faire la démarche" → `apply_url` si existe, sinon `source_url`
- "Dernière collecte" → `fetched_at`
- "Dernière modification source" → `source_last_modified` (si dispo)

**Impact**:
- Non-conformité totale avec exigence de traçabilité
- Utilisateur ne peut pas vérifier la source

**Fix**:
- Split `lien_officiel` en `source_url` + `apply_url` dans schema
- Mettre à jour UI pour afficher les deux liens distinctement
- Afficher dates de collecte

---

### 2.5 Ingestion Pipeline Manquante (P0)
**Problem**: AUCUN pipeline d'ingestion automatique pour démarches.

**Current state**:
- Seed script manuel (`seed-demarches.ts`)
- Pas de connecteurs
- Pas de cron job
- Fields ingestion présents (`source_url_exact`, `content_hash`) MAIS non utilisés

**Required** (DOD 13-15):
- Architecture connecteurs (Service-Public.fr, ANTS, Ameli, Impôts, CAF, France Travail)
- Pipeline idempotent (upsert via hash ou source_url)
- Cron quotidien + hebdo full refresh
- Logs: created/updated/skipped/errors
- Déduplication via `source_url` + `content_hash`

**Impact**:
- Data manuelle uniquement
- Pas de MAJ auto
- Pas de traçabilité réelle

**Fix**:
- Créer `/api/_handlers/cron/ingest-demarches.js`
- Créer `/api/lib/connectors/demarches/` avec connecteurs
- Interface `SourceConnector`: `fetch()`, `parse()`, `mapToDemarche()`, `getStableId()`
- Mapping taxonomies (categories/situations)
- Upsert via `source_url` unique constraint

---

### 2.6 Taxonomies Partagées (P1)
**Problem**: `AidCategory` et `LifeSituation` sont partagés entre Aide et Demarche.

**Current**:
- `/api/_handlers/taxonomy.js` retourne counts pour aides + demarches
- Catégories/Situations communes

**Issues**:
- ⚠️ Certaines catégories Aide ne s'appliquent pas aux Démarches (et vice versa)
- ⚠️ Labels peuvent être ambigus ("Budget" pour Aide = aides financières, pour Démarche = démarches fiscales)

**Recommendations**:
- Option A: Taxonomies dédiées (`DemarcheCategory`, `DemarcheSituation`) - PLUS propre mais duplication
- Option B: Conserver partagées MAIS ajouter `type` field ('aide'|'demarche'|'both')
- Option C: Conserver tel quel + mapper intelligemment (approche actuelle)

**Decision**: **Option C** (least invasive), mais documenter mapping rules clairement.

---

### 2.7 Filtres UI Non Reflétés (P1)
**Problem**: Listing `/demarches` ne reflète pas tous les filtres possibles dans l'URL.

**Current filters UI**:
- ✅ q (search bar)
- ✅ category (sidebar)
- ✅ situation (sidebar)
- ❌ organisme (manquant)
- ❌ territoire (manquant)
- ❌ canal (manquant)
- ❌ public (manquant)
- ❌ sort (manquant)

**Impact**:
- Impossibilité de partager un lien avec filtres complets
- UX limitée

**Fix**:
- Ajouter facettes dans sidebar: Organismes, Territoires, Canaux, Publics
- Ajouter dropdown Tri (Pertinence, Récent, Alpha)
- Sync bi-directionnel URL ↔ UI

---

### 2.8 Empty States & Error Handling (P1)
**Problem**: States UI incomplets.

**Current** (Demarches.jsx):
- ✅ Loading (Loader2)
- ✅ Empty (EmptyState)
- ❌ Error state (pas de gestion erreur API)
- ❌ Retry action

**Fix**:
- Ajouter error boundary / error state
- Bouton "Réessayer"

---

### 2.9 Tests Manquants (P0)
**Problem**: AUCUN test pour /demarches.

**Required** (DOD 12):
- Unit tests: parsing connecteurs, mapping taxonomies, validation query params
- Integration tests: `/api/demarches` (q + category + situation + pagination), `/api/demarches/:slug`
- E2E tests (Playwright): parcours listing → filtrer → rechercher → détail

**Fix**: Créer suite de tests complète.

---

### 2.10 Observability (P1)
**Problem**: Logs structurés incomplets, Sentry partial.

**Current**:
- `console.error('Demarches API Error:', error)` basique
- Pas de requestId
- Pas de duration_ms
- Pas de Sentry breadcrumbs

**Fix**:
- Ajouter logger structuré (requestId, path, query, duration, result_count)
- Sentry: `Sentry.captureException()` + breadcrumbs

---

## 3. FIX PLAN (EXECUTION ORDER)

### Phase 1: Database Schema (P0) ✅
**Goal**: Modèle complet supportant tous les champs requis.

**Actions**:
1. Migration `add_demarches_required_fields.sql`:
   - Add: `apply_url`, `organisme`, `canal`, `territoire_niveau`, `territoire_codes`, `territoire_label`
   - Add: `fetched_at`, `source_last_modified`
   - Add: `falc_summary`, `falc_steps`
   - Add: `processing_time`, `location`, `forms`, `contacts`
   - Add: `steps` (Json[] normalisé), `pieces_a_fournir`, `cost`
   - Add: `sous_categorie`, `sous_situation`, `public`
   - Rename/deprecate: `lien_officiel` → keep for backward compat, but use `apply_url` primary
   - Add index: `organisme`, `canal`, `territoire_niveau`, `statut`, `fetched_at`
   - Add unique constraint: `source_url_exact` (for dedup)

2. Update Prisma schema (`schema.prisma`)

3. Generate migration: `npx prisma migrate dev --name add_demarches_required_fields`

**Duration**: 1-2h

---

### Phase 2: Taxonomies (P1) ✅
**Goal**: Taxonomies stables categories/situations + mapping rules.

**Actions**:
1. Create `/api/lib/taxonomies/demarches.categories.js`:
   - Export array: `{ key, label, description, aliases }`
   - Keys: `identite`, `logement`, `sante`, `emploi`, `famille`, `budget-impots`, `mobilite`, `justice`, `handicap`, `retraite`, `immigration`, `etudes`, `energie`, `autre`

2. Create `/api/lib/taxonomies/demarches.situations.js`:
   - Export array: `{ key, label }`
   - Keys: mapping from `LifeSituation` slugs

3. Create `/api/lib/taxonomies/mapper.js`:
   - `mapCategoryFromSource(sourceLabel) → categoryKey`
   - `mapSituationFromSource(sourceLabel) → situationKey`
   - Fuzzy matching rules

**Duration**: 1-2h

---

### Phase 3: API Enhancement (P0) ✅
**Goal**: API endpoints complets avec tous filtres + facets.

**Actions**:
1. Update `/api/_utils/validators.js`:
   ```js
   searchDemarchesSchema = baseSearchSchema.extend({
     q: z.string().optional(),
     categorie: z.string().optional(),
     situation: z.string().optional(),
     public: z.string().optional(),
     territoire_niveau: z.enum(['national','region','departement','commune']).optional(),
     territoire_code: z.string().optional(),
     organisme: z.string().optional(),
     canal: z.enum(['en_ligne','guichet','courrier','telephone']).optional(),
     statut: z.string().default('publie'),
     sort: z.enum(['pertinence','-created_date','title','fetched_at']).default('pertinence'),
     page: z.coerce.number().int().min(1).default(1),
     limit: z.coerce.number().int().min(1).max(50).default(20),
   });
   ```

2. Update `/api/lib/search-query.js`:
   - Add filters: `organisme`, `canal`, `territoire_niveau`, `territoire_code`, `public`
   - Add sort: support `sort` param
   - Add facets: compute aggregations for categories, situations, organismes, territoires, canaux, publics
   - Return: `{ items, total, facets }`

3. Update `/api/_handlers/demarches.js`:
   - Return facets in list response
   - Add structured logging (requestId, duration, result_count)

**Duration**: 3-4h

---

### Phase 4: Connectors Architecture (P0) ✅
**Goal**: Pipeline ingestion multi-sources idempotent.

**Actions**:
1. Create `/api/lib/connectors/demarches/base.js`:
   ```js
   export class SourceConnector {
     constructor(name, domain) {}
     async fetch() { throw new Error('Not implemented') }
     async parse(html) { throw new Error('Not implemented') }
     mapToDemarche(rawData) { throw new Error('Not implemented') }
     getStableId(rawData) { return hash(rawData.source_url) }
   }
   ```

2. Create connectors (priorité):
   - `/api/lib/connectors/demarches/service-public.js` (Service-Public.fr)
   - `/api/lib/connectors/demarches/ants.js` (ANTS)
   - `/api/lib/connectors/demarches/ameli.js` (Ameli)
   - `/api/lib/connectors/demarches/impots.js` (Impots.gouv)
   - `/api/lib/connectors/demarches/caf.js` (CAF)
   - `/api/lib/connectors/demarches/france-travail.js` (France Travail)

3. Each connector:
   - Scrape/fetch public pages (respect robots.txt)
   - Parse HTML/JSON
   - Extract: titre, description, étapes, documents, apply_url, source_url, organisme, canal, territoire
   - Map categories/situations via taxonomies
   - Return normalized `DemarcheRaw` object

**Duration**: 8-12h (2h per connector x 6)

---

### Phase 5: Ingestion Pipeline (P0) ✅
**Goal**: Cron job automatique + idempotent.

**Actions**:
1. Create `/api/_handlers/cron/ingest-demarches.js`:
   - Load all connectors
   - For each connector:
     - Fetch data
     - Parse
     - Map to Demarche
     - Upsert via `source_url_exact` (unique constraint)
     - Compute `content_hash` (detect changes)
     - Set `fetched_at`, `source_last_modified`
     - Log: created/updated/skipped/errors
   - Return summary: `{ total_fetched, created, updated, skipped, errors }`

2. Add to `/api/_handlers/cron/pipeline.js` orchestrator

3. Add Vercel cron config (`vercel.json`):
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/ingest-demarches",
         "schedule": "45 3 * * *"
       }
     ]
   }
   ```

4. Deduplication:
   - Unique constraint on `source_url_exact`
   - Upsert: `UPDATE if source_url_exact exists, INSERT otherwise`
   - Skip if `content_hash` unchanged

**Duration**: 4-6h

---

### Phase 6: Frontend Listing (P1) ✅
**Goal**: UI complète avec tous filtres + facets.

**Actions**:
1. Update `/src/pages/Demarches.jsx`:
   - Add facets display: Organismes, Territoires, Canaux, Publics (from API response)
   - Add Tri dropdown (Pertinence, Récent, Alpha)
   - Sync all filters to URL query params
   - Read all filters from URL on mount
   - Add "Réinitialiser filtres" CTA
   - Add error state + retry

2. Update `/src/components/cards/DemarcheCard.jsx`:
   - Display organisme, territoire, canal tags
   - Optional: fetched_at (small text)

**Duration**: 3-4h

---

### Phase 7: Frontend Detail (P1) ✅
**Goal**: Page détail conforme DOD 6.

**Actions**:
1. Update `/src/pages/DemarcheDetail.jsx`:
   - Section "Liens":
     - "Source officielle": `source_url` (external link icon)
     - "Faire la démarche": `apply_url` (primary button) OR `source_url` if apply_url null
   - Section "Traçabilité":
     - "Dernière collecte": `fetched_at` (formatted date)
     - "Dernière modification source": `source_last_modified` (if exists)
   - Section FALC (toggle):
     - If `falc_summary` or `falc_steps` exists, show toggle "Version simplifiée"
   - Section "Formulaires":
     - Display `forms` array (cerfa/pdf links)
   - Section "Contacts":
     - Display `contacts` array (tel/email/site)
   - Section "Où faire":
     - Display `canal` + `location` (adresse/guichet si dispo)

**Duration**: 2-3h

---

### Phase 8: Observability (P1) ✅
**Goal**: Logs structurés + Sentry.

**Actions**:
1. Create `/api/_utils/logger.js`:
   - Structured logging: `{ timestamp, level, requestId, path, query, duration_ms, result_count, error }`

2. Update `/api/_handlers/demarches.js`:
   - Generate requestId (uuid)
   - Log start/end
   - Capture duration
   - Sentry breadcrumbs

3. Frontend Error Boundary:
   - Wrap Demarches listing + detail
   - Capture errors to Sentry

**Duration**: 2h

---

### Phase 9: Tests (P0) ✅
**Goal**: Suite complète tests.

**Actions**:
1. Unit tests (`api/lib/taxonomies/mapper.test.js`):
   - Test category/situation mapping
   - Test fuzzy matching

2. Unit tests (`api/lib/connectors/demarches/service-public.test.js`):
   - Test parsing (mock HTML)

3. Integration tests (`api/_handlers/demarches.test.js`):
   - Test GET /api/demarches (q, category, situation, pagination, facets)
   - Test GET /api/demarches/:slug
   - Test 404 slug not found
   - Test 400 invalid params

4. E2E tests (`tests/e2e/demarches.spec.js`):
   - Test: Open /demarches → voir liste
   - Test: Filtrer par catégorie → vérifier URL + résultats
   - Test: Filtrer par situation → vérifier URL + résultats
   - Test: Rechercher → vérifier résultats
   - Test: Cliquer carte → ouvrir détail
   - Test: Détail affiche source_url + apply_url
   - Test: Détail affiche fetched_at

**Duration**: 6-8h

---

### Phase 10: Documentation (P2) ✅
**Goal**: Docs pour contributeurs.

**Actions**:
1. Create `/docs/DEMARCHES_INGESTION.md`:
   - Comment ajouter un nouveau connector
   - Architecture pipeline
   - Taxonomies mapping

2. Create `/docs/DEMARCHES_API.md`:
   - Spécification query params `/api/demarches`
   - Réponse facets
   - Exemples

3. Update `/README.md`:
   - Section Démarches

**Duration**: 2h

---

## 4. ESTIMATED TOTAL DURATION

| Phase | Duration | Priority |
|-------|----------|----------|
| 1. Database Schema | 1-2h | P0 |
| 2. Taxonomies | 1-2h | P1 |
| 3. API Enhancement | 3-4h | P0 |
| 4. Connectors Architecture | 8-12h | P0 |
| 5. Ingestion Pipeline | 4-6h | P0 |
| 6. Frontend Listing | 3-4h | P1 |
| 7. Frontend Detail | 2-3h | P1 |
| 8. Observability | 2h | P1 |
| 9. Tests | 6-8h | P0 |
| 10. Documentation | 2h | P2 |
| **TOTAL** | **32-45h** | |

**Recommendation**: Split en 2 PRs:
- **PR1 (Backend)**: Phases 1-5 (Database, API, Connectors, Ingestion) - ~20-26h
- **PR2 (Frontend + Tests)**: Phases 6-10 (UI, Observability, Tests, Docs) - ~15-19h

---

## 5. CRITICAL SUCCESS FACTORS

### 5.1 Non-Negotiables
✅ **Traçabilité**: `source_url` obligatoire, affichage clair, `fetched_at`
✅ **Deduplication**: Unique constraint `source_url_exact`, upsert idempotent
✅ **Filtres**: Tous combinables (AND), reflétés dans URL
✅ **Tests**: Coverage critique (API + E2E)
✅ **Zéro régression**: Ne pas casser aides/structures/actualités

### 5.2 Data Quality
- Mapping taxonomies robuste (fuzzy matching)
- Validation stricte (Zod)
- Logs détaillés (ingestion)
- Alerting si erreurs répétées (Sentry)

### 5.3 UX
- States propres (loading/empty/error)
- Accessibilité (WCAG, keyboard, aria)
- FALC option (si data dispo)
- Messages clairs

---

## 6. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scraping blocage (robots.txt, rate limit) | Ingestion fail | Rate limiting, user-agent, respecter robots.txt, fallback API si dispo |
| Data quality (parsing errors) | Mauvais contenu | Validation stricte, tests parsing, logs détaillés |
| Performance (full-text search lent) | UX dégradée | Index GIN, cache, pagination |
| Taxonomies ambiguës | Mauvais mapping | Mapping rules documentées, review manuel initial |
| Breaking changes (shared taxonomies) | Régression Aides | Tests non-régression, migration data safe |

---

## 7. NEXT STEPS (IMMEDIATE)

1. **Valider ce plan** avec stakeholders (si applicable)
2. **Créer branch** `feat/demarches-p0-complete`
3. **Exécuter Phase 1** (Database Schema)
4. **Exécuter Phase 2** (Taxonomies)
5. **Continuer séquentiellement** jusqu'à DOD complet

---

**END OF AUDIT**
