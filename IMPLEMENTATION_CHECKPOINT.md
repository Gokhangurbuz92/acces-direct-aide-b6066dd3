# Premium Actualités Implementation - Checkpoint

## COMPLETED ✅

### 1. Foundation & Architecture
- ✅ Taxonomy centralisée (`taxonomy/actualites.topics.js` + `.ts`)
- ✅ 19 topics extensibles (logement, santé, handicap, emploi, famille, budget, mobilité, justice, numérique, nouveaux_arrivants, education_formation, retraite_dependance, energie_environnement, consommation_fraudes, impots_finances_publiques, vie_associative, securite_civile, international, general)
- ✅ Topic "international" clairement défini (transfrontalier UE/EEE/Suisse, consulaire, crises internationales impactant France)

### 2. Database
- ✅ Modèle Prisma Actualite enrichi avec TOUS les champs requis:
  - Topics (multi-topics: `topics[]`, `topic_primary`)
  - Impact (`impact`: alerte/important/info)
  - Audience (`audience[]`)
  - Territory (`territory_level`, `territory_codes[]`)
  - Source tracking exact (`source_url`, `canonical_url`, `source_domain`, `source_type`, `reliability_score`)
  - Dates précises (`source_published_at`, `source_last_modified`, `fetched_at`, `first_seen_at`)
  - Related entities (`related_aide_slugs[]`, `related_demarche_slugs[]`)
  - Content enrichi (`excerpt`, `falc_summary`, `change_summary`, `next_steps`)
- ✅ Migration SQL complète avec index optimisés (GIN arrays, full-text search, performance indexes)
- ✅ Champ `first_seen_at` pour badge "Nouveau" (7 jours)

### 3. Core Utilities
- ✅ URL normalization (`normalizeUrl`, `extractDomain`, `generateStableId`, `isSafeUrl`)
- ✅ Classification engine:
  - `classifyTopics()`: scoring keywords/synonyms/sources_hint → multi-topics + topic_primary
  - `classifyImpact()`: alerte/important/info basé sur keywords
  - `calculateReliabilityScore()`: 0-100 basé sur source_type + domaines officiels
  - `classifyAudience()`: détection audiences cibles

### 4. Connector Architecture
- ✅ `BaseConnector` abstrait: discover() → parse() → map() → classification auto
- ✅ `RssConnector`: implémentation RSS/Atom générique
- ✅ Config sources (`config/actualites-sources.json`): Service-Public, Grand Est, AGEFIPH, France Travail, CAF, Ameli

### 5. API Premium
- ✅ `/api/actualites` refactorisé:
  - Filtres: topic, q (search), impact, source, date_from/date_to, audience, territory_level/territory_code, statut, sort (recent/pertinence), page/limit
  - Validation Zod
  - Facets (topics, sources, impacts, audiences)
  - Pagination
  - is_new calculation (7 days)
- ✅ `/api/actualites/premium`:
  - `alerts[]` (impact=alerte, max 3)
  - `weeklyImportant[]` (impact=important, last 7 days, max 5)
- ✅ `/api/actualites/:slug`: détail complet

## EN COURS 🚧

### 6. Frontend (PRIORITÉ CRITIQUE)
- Page `/actualites` avec:
  - Section premium top: Alertes du moment + Changements importants cette semaine
  - Onglets topics dynamiques (basés sur taxonomy)
  - Recherche + filtres drawer
  - Listing paginé avec badges impact/topic/nouveau
  - URL sync
- Page détail `/actualites/:slug`:
  - Source officielle visible + traçable
  - Sections: Résumé / En clair / Ce que ça change / Que faire

### 7. Ingestion Pipeline
- Refactoriser cron pipeline pour:
  - Utiliser BaseConnector + RssConnector
  - Appliquer classification auto
  - Déduplication via stable_id
  - Logs structurés + métriques

### 8. Tests
- Unit: normalizeUrl, stableId, classifyTopics, classifyImpact
- Integration: API endpoints
- E2E: sections premium, onglets topics, source_url présent, badge "Nouveau"

### 9. SEO
- Sitemap actualites
- JSON-LD Article/NewsArticle

## NEXT STEPS (ORDRE)

1. **Frontend /actualites (P0)** - 30min
2. **Frontend /actualites/:slug (P0)** - 15min
3. **Refactor cron pipeline (P1)** - 20min
4. **Tests essentiels (P1)** - 25min
5. **SEO sitemap (P2)** - 10min
6. **Documentation (P2)** - 10min
7. **Verify build + CI (P0)** - 10min

Total estimated: ~2h

## DOD STATUS

### Fonctionnel (P0)
- [x] Taxonomie topics centralisée extensible
- [x] DB modèle premium complet
- [x] API /actualites avec filtres
- [x] API /actualites/premium (sections premium)
- [ ] Frontend /actualites avec sections premium ⚠️
- [ ] Frontend /actualites/:slug avec source_url ⚠️
- [ ] Onglets topics dynamiques ⚠️
- [ ] Recherche + filtres fonctionnels ⚠️

### Qualité (P1)
- [x] Validation Zod API
- [x] Classification auto explicable
- [ ] Tests unitaires ⚠️
- [ ] Tests integration API ⚠️
- [ ] Tests E2E ⚠️

### Automatisation (P2)
- [x] Architecture connecteurs
- [ ] Cron pipeline refactorisé ⚠️
- [ ] Idempotent upsert ⚠️

## FILES CREATED
- `taxonomy/actualites.topics.js` + `.ts`
- `api/lib/actualites/url-utils.js`
- `api/lib/actualites/classification.js`
- `api/lib/actualites/connectors/BaseConnector.js`
- `api/lib/actualites/connectors/RssConnector.js`
- `api/_handlers/actualites-v2.js`
- `config/actualites-sources.json`
- `prisma/migrations/20260202_premium_actualites/migration.sql`
- `prisma/schema.prisma` (updated Actualite model)

## NOTES
- Zero regression: code existant (aides/démarches/annuaire) non touché
- Traçabilité totale: `source_url` EXACT stocké + affiché
- Classification explicable: keywords → scores → topics/impact
- Ready for PR mais frontend + tests critiques manquants
