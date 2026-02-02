# AUDIT TECHNIQUE - Page /aides AccesDirectAide

**Date**: 2026-02-02  
**Mission**: Rendre la page /aides irréprochable (zéro bug, filtres fiables, ingestion auto, traçabilité)

---

## 1. COMPOSANTS IDENTIFIÉS

### Frontend (React + Vite)
- **Page listing**: `/src/pages/Aides.jsx`
- **Page détail**: `/src/pages/AideDetail.jsx`
- **Composant carte**: `/src/components/cards/AideCard.jsx` (à vérifier)
- **Client API**: `/src/api/client.js`

### Backend (Vercel Functions)
- **Handler principal**: `/api/_handlers/aides.js`
- **Logique de recherche**: `/api/lib/search-query.js` (fonction `searchAides`)
- **Validation**: `/api/_utils/validators.js` (schéma `searchAidesSchema`)
- **Routes**: `/api/routes.js` (route `aides` avec match `prefix`)

### Database (Prisma + PostgreSQL)
- **Schéma**: `/prisma/schema.prisma` (modèle `Aide`)
- **Migrations**: 
  - `20250202120000_add_aides_fields_and_unaccent` (ajout theme, sub_theme, apply_url, fetched_at, source_last_modified)
  - `20260125181117_phase1_ingestion` (SUPPRESSION de search_vector ⚠️)

### Ingestion / Cron
- **Pipeline**: `/api/_handlers/cron/pipeline.js`
- **Ingestion aides**: `/api/_handlers/cron/ingest-aids.js`
- **Connecteurs**: À créer (architecture manquante)

---

## 2. ROOT CAUSES IDENTIFIÉES

### 🔴 CRITIQUE - Erreurs 500 en production

**Cause #1: search_vector supprimé mais code l'utilise encore**
- Migration `20260125181117_phase1_ingestion` a DROP la colonne `search_vector`
- Mais `/api/lib/search-query.js` utilise toujours:
  ```javascript
  conditions.push(Prisma.sql`"search_vector" @@ plainto_tsquery('french', unaccent(${q}))`);
  ```
- **Impact**: Toute recherche avec paramètre `q` crash avec erreur SQL "column search_vector does not exist"
- **Fix**: Recréer search_vector OU utiliser recherche alternative (ILIKE, trigram, ou tsvector à la volée)

**Cause #2: Extension unaccent peut être manquante en prod**
- Migration `20250202120000` crée l'extension `unaccent`
- Mais si migration pas appliquée en prod => fonction `unaccent()` inexistante
- **Fix**: Vérifier que migration est déployée OU rendre unaccent optionnel

### 🟠 MAJEUR - Schéma incomplet vs. exigences

**Champs manquants dans modèle Aide**:
- ✅ `theme` (ajouté)
- ✅ `sub_theme` (ajouté)
- ✅ `apply_url` (ajouté)
- ✅ `fetched_at` (ajouté)
- ✅ `source_last_modified` (ajouté)
- ❌ `organisme` (existe comme `providerName` mais pas indexé)
- ❌ `territoire_niveau` (manquant - seulement `territoires` array)
- ❌ `territoire_codes` (existe comme `territoires` mais pas de GIN index)
- ❌ `territoire_label` (manquant)
- ❌ `steps` (existe comme `etapes` JSON)
- ❌ `pieces_a_fournir` (existe comme `documents_necessaires`)
- ❌ `montant` (manquant - seulement `montant_falc`)
- ❌ `avantage` (manquant)
- ❌ `contacts` (manquant)
- ❌ `falc_steps` (manquant)
- ❌ `source_domain` (manquant)
- ❌ `tags` (existe comme `mots_cles`)

**Mapping incohérent**:
- Frontend utilise `categorie` mais schéma a `theme` + `categoryId`
- Frontend cherche `public` mais schéma a `audiences`
- Frontend cherche `organisme` mais schéma a `providerName`

### 🟡 MOYEN - Filtres non fonctionnels

**Problème**: Facettes vides ou incorrectes
- Code facets dans `search-query.js` utilise `json_object_agg` mais peut retourner `null`
- Pas de fallback propre côté frontend
- Taxonomie statique vs. facettes dynamiques => incohérence

**Problème**: Filtres ne se combinent pas correctement
- Code SQL combine avec AND mais certains filtres (theme) ont logique complexe avec OR
- Pas de validation côté frontend avant envoi

### 🟡 MOYEN - Liens morts listing → détail

**Problème**: Slug peut être null
- Schéma Prisma: `slug String? @unique` (optionnel)
- Frontend `AideCard` génère `/aides/${aide.slug}` => si slug null => `/aides/null`
- Page détail cherche par slug OU id mais route ne supporte que slug

**Fix**: Générer slug automatiquement OU fallback sur ID dans route

### 🟢 MINEUR - Champs UI inventés

**Problème**: Frontend affiche des champs qui n'existent pas toujours
- `aide.sources` (array) mais schéma a `source_url` (string)
- `aide.apply_url` vs `aide.lien_demande` (duplication)
- `aide.summary_falc` utilisé mais peut être null

---

## 3. ARCHITECTURE INGESTION MANQUANTE

**État actuel**:
- Pas de connecteurs structurés
- Pas de pipeline idempotent
- Pas de mapping taxonomie
- Pas de déduplication robuste

**Requis**:
- Interface `SourceConnector` avec `fetch()`, `parse()`, `mapToAide()`, `getStableId()`
- Connecteurs minimum: Région Grand Est, AGEFIPH
- Pipeline avec upsert via `content_hash` ou `source_url_exact`
- Taxonomie normalisée (fichier JSON ou table)
- Cron jobs quotidien + hebdo

---

## 4. TESTS MANQUANTS

**Existant**:
- Tests Playwright de base (à vérifier)
- Tests intégration API (à vérifier)

**Manquant**:
- Tests unitaires validation query params
- Tests unitaires parsing connecteurs
- Tests intégration filtres combinés
- Tests e2e parcours complet /aides
- Tests régression sur 500

---

## 5. OBSERVABILITÉ

**Existant**:
- Sentry configuré (breadcrumbs dans handler)
- Logger structuré (pino)
- Rate limiting (Vercel KV)

**Manquant**:
- Métriques ingestion (combien créés/maj/erreurs)
- Alertes sur taux d'erreur pipeline
- Dashboard monitoring qualité données

---

## 6. PLAN DE FIX (PRIORITÉ)

### P0 - Stopper les 500 (URGENT)
1. ✅ Recréer `search_vector` avec trigger OU
2. ✅ Remplacer recherche par ILIKE/trigram temporaire
3. ✅ Vérifier extension unaccent en prod
4. ✅ Déployer fix + tester endpoints

### P1 - Corriger schéma DB
1. Migration pour ajouter champs manquants
2. Migration pour index (theme, organisme, territoires GIN)
3. Migration pour search_vector + trigger
4. Seed données test

### P2 - Normaliser API
1. Fixer validation Zod (mapper aliases)
2. Améliorer gestion erreurs (400/404/500)
3. Ajouter facettes robustes
4. Documenter query params

### P3 - Implémenter ingestion
1. Architecture connecteurs
2. Connecteur Région Grand Est
3. Connecteur AGEFIPH
4. Pipeline idempotent
5. Cron jobs

### P4 - Refactoriser frontend
1. Fixer mapping champs (categorie→theme, public→audiences)
2. Gérer slug null (fallback ID)
3. États UI propres (loading/empty/error)
4. Filtres URL synchronisés

### P5 - Tests
1. Tests unitaires
2. Tests intégration
3. Tests e2e
4. CI/CD

---

## 7. RISQUES

- **Données existantes**: 10 aides en prod => migration doit préserver
- **Downtime**: Fix search_vector nécessite migration => planifier fenêtre
- **Compatibilité**: Changement schéma peut casser autres pages (démarches/structures)
- **Performance**: Recherche full-text sans index peut être lente

---

## 8. DÉCISIONS TECHNIQUES

### Recherche full-text
**Option A** (recommandée): Recréer search_vector avec trigger
- Avantages: Performance, support accents, ranking
- Inconvénients: Complexité migration

**Option B**: ILIKE temporaire
- Avantages: Simple, rapide à déployer
- Inconvénients: Lent, pas de ranking, pas d'accents

**Décision**: Option A avec fallback B en cas d'urgence

### Taxonomie
**Option A**: Table AidCategory existante + mapping
**Option B**: Fichier JSON statique
**Décision**: Hybride - table pour relations, JSON pour mapping slug→label

### Ingestion
**Architecture**: Connecteurs modulaires + pipeline centralisé
**Déduplication**: Hash de (source_url + titre + organisme)
**Idempotence**: Upsert via content_hash

---

## NEXT STEPS

1. Créer migration fix search_vector
2. Tester localement
3. Déployer en staging
4. Valider endpoints
5. Continuer avec P1-P5
