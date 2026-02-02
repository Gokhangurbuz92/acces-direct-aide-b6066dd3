# AUDIT ANNUAIRE - AccesDirectAide

Date: 2026-02-02
Agent: BLACKBOX DEV
Mission: Rendre la page `/annuaire` irréprochable (P0)

---

## 1. ÉTAT ACTUEL DU CODE

### A. Architecture existante

**Front-end:**
- Page: `/src/pages/Annuaire.jsx`
- Composant carte: `/src/components/cards/StructureCard.jsx`
- Page détail: `/src/pages/StructureDetail.jsx`
- Routing: `/structures/:slug` ou `/structures/view?id=xxx`

**API:**
- Handler: `/api/_handlers/structures.js`
- Endpoint: `GET /api/structures` (liste + détail par id/slug)
- Search engine: `/api/lib/search-query.js` (searchStructures)
- Validation: `/api/_utils/validators.js` (searchStructuresSchema)

**Base de données:**
- Model: `Structure` (schema.prisma lignes 89-148)
- Pas de modèle Organization/Establishment séparé
- Champs pertinents: nom, type_structure, adresse, ville, code_postal, services, publics_accueillis, source_url, siret, slug

**Ingestion:**
- Handler: `/api/_handlers/cron/ingest-structures.js`
- Sources: 1 seule (OpenData Strasbourg Médiation Numérique)
- Méthode: Hash-based deduplication (raw_data_hash)
- Pas de regroupement organisme→établissements

**Client API (front):**
- `/src/api/client.js` + `/src/api/entities.js`
- `client.entities.Structure.filter({ q, type, city, page, pageSize })`

---

## 2. ROOT CAUSES - PROBLÈMES IDENTIFIÉS

### ❌ CRITIQUE (P0) - Bloquants DOD

#### RC-1: DOUBLONS MASSIFS (150 "France Travail")
**Symptôme:** L'annuaire affiche 150 fois "France Travail" (une fois par agence)
**Cause:**
- Modèle plat: Structure = établissement unique
- Pas de notion "Organisation" (réseau) vs "Établissement" (site local)
- L'ingestion crée 1 Structure par site physique
**Impact:** UX catastrophique, annuaire illisible, recherche polluée
**Preuve:** `Structure` contient à la fois des réseaux (France Travail) et des sites locaux (agence FT Strasbourg)

#### RC-2: ABSENCE DE SOURCE_URL EXACTE PARTOUT
**Symptôme:** Pas de lien "Source officielle" sur chaque fiche
**Cause:**
- Champ `source_url` = URL générique du dataset (ex: API OpenData)
- Manque `source_url_exact` (URL de la page officielle de l'établissement)
**Impact:** Pas de traçabilité obligatoire (exigence non négociable)
**Preuve:** schema.prisma ligne 129 `source_url String?` + ligne 131 `source_url_exact String?` mais non rempli

#### RC-3: MODÈLE DB INADAPTÉ AU REGROUPEMENT
**Symptôme:** Impossible de regrouper organismes→établissements
**Cause:**
- Modèle `Structure` monolithique
- Pas de FK ou relation hiérarchique
- Pas de champ `orgKey` stable
**Impact:** Impossible d'implémenter la DOD sans refonte du schéma
**Preuve:** schema.prisma lignes 89-148, aucune relation parent-enfant

#### RC-4: RECHERCHE LIMITÉE (pas de filtres avancés)
**Symptôme:** Filtres front = q/type/city uniquement
**Cause:**
- Validation Zod minimaliste (validators.js ligne 25-29)
- Pas de filtres: domaine, public, territoire_level, accessibility, services
**Impact:** UX recherche faible, pas de facettes
**Preuve:** `Annuaire.jsx` lignes 39-42 (q/type/city/page)

#### RC-5: INGESTION MONO-SOURCE NON EXTENSIBLE
**Symptôme:** 1 seule source (OpenData Strasbourg)
**Cause:**
- Pas d'architecture connecteurs
- Logique ingestion hardcodée dans `ingest-structures.js`
- Pas de stable key (orgKey/siteKey) pour regroupement
**Impact:** Impossible d'ajouter France Travail, Adapei PB sans refonte
**Preuve:** `ingest-structures.js` lignes 6-13 (DATASETS=[1 seul])

---

### ⚠️  IMPORTANT (P1) - Qualité/Robustesse

#### RC-6: GÉOCODAGE NON SYSTÉMATIQUE
**Symptôme:** geo_lat/geo_lng optionnels, geoloc_status="failed"/"success"
**Cause:** Valve 2 (enrichment) non garantie, dépend de l'API externe
**Impact:** Tri par proximité impossible si geo manquant
**Preuve:** `ingest-structures.js` lignes 179-195

#### RC-7: PAS DE TESTS E2E ANNUAIRE
**Symptôme:** Aucun test Playwright pour /annuaire
**Cause:** Manque de couverture e2e
**Impact:** Risque de régression non détectée
**Preuve:** Recherche `**/*.spec.js` aucun test annuaire trouvé

#### RC-8: LOGS NON STRUCTURÉS
**Symptôme:** console.log basique, pas de Sentry capture API
**Cause:** Observabilité partielle
**Impact:** Debug difficile en prod
**Preuve:** `structures.js` ligne 51 `console.error` sans Sentry

---

## 3. FIX PLAN - ROADMAP IMPLÉMENTATION

### Phase 1: DATABASE (Schéma 3-niveaux)

**Objectif:** Créer modèles Organization → Establishment → Service

**Actions:**
1. Ajouter modèle `Organization`:
   - id, slug, orgKey (unique, stable), name, acronyms[], category, domains[], publics[], description, website_url, contact_email, contact_phone, address_city, address_postal_code, territory_level, territory_codes[], source_url (OBLIGATOIRE), fetched_at, status, created_at, updated_at
2. Ajouter modèle `Establishment`:
   - id, slug, orgId (FK → Organization), siteKey (unique, stable), name, type, services[], address_line1, city, postal_code, department_code, region, geo_lat, geo_lng, phone, email, opening_hours (json), accessibility[], appointment_url, source_url (OBLIGATOIRE), fetched_at, status, created_at, updated_at
3. (Optionnel) Garder modèle `Service` existant ou créer nouveau:
   - id, orgId?, establishmentId?, name, description, source_url
4. Migration:
   - Créer migration Prisma
   - Plan de migration données: transformer `Structure` → `Organization` + `Establishment`
   - Stratégie: détecter réseaux (type_structure=france_travail) → créer 1 org, reste → establishments
5. Index:
   - orgKey (unique)
   - siteKey (unique)
   - orgId, type, department_code, city/postal_code
   - Full-text: name, city, services (GIN si arrays)

**Livrables:**
- `prisma/migrations/YYYYMMDD_add_organization_establishment.sql`
- Script migration données: `scripts/migrate-structures-to-org-establishment.js`

---

### Phase 2: API CONTRACTS (Endpoints normalisés)

**Objectif:** Créer 3 endpoints principaux avec validation Zod stricte

**Actions:**
1. `GET /api/annuaire/organisations`
   - Query params: q, category, domain, public, territoire_level, territoire_code, status, sort, page, limit
   - Response: `{ items: OrganizationCardDTO[], facets: {...}, pagination: {...} }`
   - Validation Zod: `annuaire/organisationsSchema`
2. `GET /api/annuaire/organisations/:slug`
   - Response: `{ organization: OrganizationDetailDTO, establishments: EstablishmentCardDTO[], establishmentsFacets: {...} }`
3. `GET /api/annuaire/organisations/:slug/etablissements`
   - Query params: q, type, city, postal_code, accessibility, sort, page, limit
   - Response: `{ items: EstablishmentCardDTO[], pagination: {...} }`
4. (Optionnel) `GET /api/annuaire/etablissements/:siteSlug`
   - Response: EstablishmentDetailDTO

**Règles strictes:**
- 400 si query invalide (Zod)
- 404 si slug inconnu
- 500 capturé par Sentry
- Logs structurés: `{ level, route, params, duration, error? }`
- Rate limit KV (déjà existant, vérifier config)

**Livrables:**
- `/api/_handlers/annuaire/organisations.js` (list)
- `/api/_handlers/annuaire/organisation-detail.js` (detail)
- `/api/_handlers/annuaire/etablissements.js` (establishments)
- `/api/_utils/validators.js` (extend avec schemas annuaire)
- `/api/lib/search-query-annuaire.js` (logique search organisations)

---

### Phase 3: CONNECTEURS (Architecture multi-sources)

**Objectif:** Implémenter architecture connecteurs + 2 sources minimum

**Actions:**
1. Créer interface Connector:
   ```javascript
   interface Connector {
     name: string;
     domain: string;
     fetch(): Promise<RawData[]>;
     parse(raw: RawData): ParsedData;
     mapOrg(parsed: ParsedData): OrganizationInput;
     mapSites(parsed: ParsedData): EstablishmentInput[];
     stableKeys(parsed: ParsedData): { orgKey: string, siteKeys: string[] };
   }
   ```
2. Implémenter `FranceTravailConnector`:
   - Source: API publique France Travail (chercher API ouverte ou pages structure officielles)
   - orgKey: `SIREN` si dispo, sinon `domain:france-travail`
   - siteKey: `SIRET` ou `id_source + address_hash`
   - 1 Organization "France Travail" + tous ses établissements (agences)
   - source_url exacte par agence (lien page agence officielle)
3. Implémenter `AdapeiPapillonsBlancsConnector`:
   - Source: Site officiel Adapei PB Alsace (pages publiques "nos établissements")
   - orgKey: `SIREN` ou `domain:adapei-papillons-blancs-alsace`
   - siteKey: `FINESS` ou `id_source + hash`
   - 1 Organization + liste établissements (ESAT, IME, MAS, FAM, SESSAD...)
   - source_url exacte par établissement
4. Regroupement anti-doublons:
   - Fonction `normalizeOrgName(name)`: trim, casefold, remove "association", "groupe"
   - orgKey priorité: SIREN > domain+canonical_name > id_source
   - Upsert: `findFirst({ orgKey }) => update : create`
   - siteKey stable pour éviter doublons établissements
5. Cron job:
   - `/api/_handlers/cron/ingest-annuaire.js`
   - Boucle sur tous les connecteurs
   - Métriques: created/updated/skipped/errors par source
   - Log ImportLog avec détails
   - Alert Sentry si erreurs répétées

**Conformité scraping:**
- Respecter robots.txt
- Rate limit (delay entre requêtes)
- User-Agent clair: "AccesDirectAide-Bot/1.0"
- Journaliser toutes erreurs
- Fallback si extraction échoue (skip, pas crash)

**Livrables:**
- `/api/lib/connectors/base.js` (interface)
- `/api/lib/connectors/france-travail.js`
- `/api/lib/connectors/adapei-papillons-blancs.js`
- `/api/_handlers/cron/ingest-annuaire.js` (orchestration)
- Script test: `scripts/test-connector.js --source=france-travail`

---

### Phase 4: FRONT-END UX (Recherche super clean)

**Objectif:** Refonte /annuaire (listing organismes) + page organisme

**Actions:**
1. **Page `/annuaire` (listing organismes uniquement)**
   - Afficher UNIQUEMENT les Organisations (pas les établissements)
   - Barre de recherche debounced (300ms)
   - Filtres facettes: category, domain, public, territoire
   - URL sync (query params)
   - Cartes organisme: nom, domaines, publics, territoire, compteur établissements, "Voir les établissements" CTA
   - États: skeleton loading, empty state clair, error state + retry
   - Accessibilité: label input, aria-label, focus visible, navigation clavier

2. **Page `/annuaire/:orgSlug` (détail organisme)**
   - Header: nom, description, site, contacts, "Source officielle" (source_url obligatoire)
   - Section "Établissements":
     - Filtres internes: type/catégorie (agence, ESAT, IME...), ville/CP, accessibilité
     - Regroupement par type (accordéon ou sections)
     - Cartes établissement: adresse, tel, horaires, services, "Voir détail", "Source officielle", "Prendre RDV" (si appointment_url)
   - Pagination établissements si >20

3. **Page `/annuaire/:orgSlug/:siteSlug` (détail établissement - optionnel P1)**
   - Infos complètes établissement
   - Map si geo disponible
   - Services détaillés
   - Source officielle (lien exact)

4. **Composants:**
   - Refactoriser `StructureCard` → `OrganizationCard` + `EstablishmentCard`
   - Nouveau: `SearchBar` (debounced), `FacetFilters`, `EstablishmentGroupedList`

5. **API client:**
   - Adapter `/src/api/client.js` pour nouveaux endpoints
   - `client.annuaire.organisations.list(params)`
   - `client.annuaire.organisations.get(slug)`
   - `client.annuaire.establishments.list(orgSlug, params)`

**Livrables:**
- `/src/pages/AnnuaireOrganisations.jsx` (nouveau)
- `/src/pages/AnnuaireOrganisationDetail.jsx` (nouveau)
- `/src/pages/AnnuaireEstablishmentDetail.jsx` (optionnel)
- `/src/components/cards/OrganizationCard.jsx`
- `/src/components/cards/EstablishmentCard.jsx`
- `/src/components/annuaire/SearchBar.jsx`
- `/src/components/annuaire/FacetFilters.jsx`
- Routing: update `/src/App.jsx` ou routing config

---

### Phase 5: OBSERVABILITÉ + SÉCURITÉ

**Objectif:** Logs structurés, Sentry, rate limit

**Actions:**
1. Logs structurés (déjà partiel via logger.js):
   - Format JSON: `{ timestamp, level, route, method, params, duration, userId?, error? }`
   - Tous endpoints annuaire loggent: entrée, sortie, erreurs
2. Sentry:
   - Capturer 500 API: `Sentry.captureException(err, { tags: { route, method } })`
   - Front error boundary déjà existant (`ErrorBoundary.jsx`?)
3. Rate limit:
   - Vérifier config KV existante (semble déjà en place dans `rateLimit.js`)
   - Ajouter clé `SEARCH_ORGANISATIONS` si besoin
4. Validation stricte:
   - Zod partout (déjà OK)
   - Éviter injection: Prisma ORM protège, mais valider inputs
5. Pas d'open redirect:
   - source_url: whitelist protocol https uniquement
   - Valider URLs avant affichage

**Livrables:**
- `/api/_utils/logger.js` (extend si besoin)
- `/api/_utils/sentry.js` (extend captures)
- Tests rate limit: `tests/integration/ratelimit-annuaire.test.js`

---

### Phase 6: TESTS

**Objectif:** Tests unit/integration/e2e pour annuaire

**Actions:**
1. **Unit tests:**
   - `normalizeOrgName(name)` → teste trim, casefold, remove stopwords
   - `generateOrgKey(siren?, domain, name)` → teste priorité
   - `deduplicateSites(sites, siteKey)` → teste hash collision
   - Validation Zod schemas
   - `tests/unit/annuaire-helpers.test.js`

2. **Integration tests (API):**
   - `GET /api/annuaire/organisations` (recherche + filtres + facettes)
   - `GET /api/annuaire/organisations/:slug` (détail + establishments)
   - 404 si slug inconnu
   - 400 si query invalide
   - `tests/integration/annuaire-api.test.js`

3. **E2E Playwright:**
   - Scénario: Ouvrir /annuaire → rechercher "France Travail" → 1 seul résultat → clic → voir liste établissements → filtrer "Strasbourg" → vérifier présence source_url
   - Scénario: Filtres combinés (categorie + domaine + territoire) → URL sync → résultats corrects
   - `tests/e2e/annuaire.spec.js`

4. **CI:**
   - Tous tests passent avant merge
   - Build prod sans erreurs

**Livrables:**
- `tests/unit/annuaire-helpers.test.js`
- `tests/integration/annuaire-api.test.js`
- `tests/e2e/annuaire.spec.js`

---

### Phase 7: DOCUMENTATION + VÉRIFICATION RÉGRESSION

**Objectif:** Doc courte + vérifier zéro régression sur aides/démarches/dispositifs

**Actions:**
1. Documentation:
   - `docs/ANNUAIRE_ARCHITECTURE.md`:
     - Comment fonctionne orgKey/siteKey
     - Comment ajouter un connector
     - Comment lancer ingestion localement
   - `docs/API_ANNUAIRE.md`:
     - Endpoints + schemas + exemples
2. Vérification régression:
   - Tester `/aides`, `/demarches`, `/dispositifs` après migration DB
   - Vérifier que Structure ancien modèle n'est pas cassé (si migration en place)
   - E2E tests existants passent (si présents)

**Livrables:**
- `docs/ANNUAIRE_ARCHITECTURE.md`
- `docs/API_ANNUAIRE.md`
- Checklist régression validée

---

## 4. DEFINITION OF DONE - VALIDATION

### Checklist P0 (Fonctionnel)

- [ ] 1. /annuaire charge toujours (zéro 500) et affiche liste d'organismes si DB non vide
- [ ] 2. Clic sur organisme => /annuaire/:orgSlug fonctionne 100%
- [ ] 3. Recherche globale fonctionne (nom, acronyme, missions, tags, publics, ville, CP, type, services, tolérance fautes/accents)
- [ ] 4. Filtres combinables (categorie, public, domaine, territoire, services, accessibilite, mode_contact, statut, tri, pagination) reflétés dans URL
- [ ] 5. Anti-doublons garanti: "France Travail" apparaît 1 seule fois dans /annuaire
- [ ] 6. Page organisme affiche: infos + section établissements + filtres internes + regroupement par catégories
- [ ] 7. Page établissement (optionnel) /annuaire/:orgSlug/:siteSlug fonctionne
- [ ] 8. Liens "Source officielle" partout (organisme.source_url + établissement.source_url obligatoires)

### Checklist P1 (Qualité)

- [ ] 9. API stable + validation stricte (Zod) + erreurs 400/404/500 propres
- [ ] 10. DB modèle propre + migrations propres + index utiles
- [ ] 11. Observabilité: logs structurés + Sentry capture erreurs API + front error boundary
- [ ] 12. Tests: unit (regroupement, normalisation, validation), integration (endpoints annuaire), e2e Playwright (parcours critique)

### Checklist P2 (Automatisation)

- [ ] 13. Pipeline ingestion multi-sources (connecteurs) + cron (idempotent)
- [ ] 14. Regroupement automatique basé sur orgKey stable (pas nom seul)
- [ ] 15. Dédup solide: relancer ingestion ne crée pas doublons

---

## 5. RISQUES & MITIGATION

### Risque 1: Migration données casse Structure existant
**Mitigation:**
- Migration en 2 temps: créer modèles Organization/Establishment SANS supprimer Structure
- Script migration données avec rollback
- Tests integration avant migration prod

### Risque 2: France Travail / Adapei PB n'ont pas d'API publique
**Mitigation:**
- Utiliser pages publiques officielles (scraping respectueux robots.txt)
- Fallback: données statiques JSON si scraping bloqué
- Documenter source exacte (URL page)

### Risque 3: Géocodage lent/bloqué
**Mitigation:**
- Async enrichment (valve 2)
- Cache géocodage (Vercel KV ou Postgres)
- Fallback: qualité score réduit si geo manquant

### Risque 4: Délai implémentation
**Mitigation:**
- Prioriser P0 strict
- Phase 1-4 obligatoires, Phase 5-7 P1/P2 si temps

---

## 6. PROCHAINES ÉTAPES IMMÉDIATES

1. ✅ Audit terminé → ce document
2. ⏭️  Créer schéma Prisma Organization/Establishment (Phase 1)
3. ⏭️  Migration Prisma + script migration données
4. ⏭️  Implémenter endpoints API (Phase 2)
5. ⏭️  Créer connecteurs France Travail + Adapei PB (Phase 3)
6. ⏭️  Refonte front /annuaire (Phase 4)
7. ⏭️  Tests + observabilité (Phase 5-6)
8. ⏭️  Doc + vérif régression (Phase 7)

---

**ESTIMATION:**
- Phase 1-2: 4-6h
- Phase 3: 6-8h (dépend dispo API/scraping)
- Phase 4: 4-6h
- Phase 5-7: 3-4h
- **TOTAL: ~20-24h** (travail autonome sans interruption)

**NEXT:** Commencer Phase 1 (schéma DB)
