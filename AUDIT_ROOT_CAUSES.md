# AUDIT TECHNIQUE — PAGE /AIDES — ROOT CAUSES & FIX PLAN

**Date**: 2026-02-02
**Mission**: Rendre la page /aides irréprochable (zéro bug bloquant, filtres/recherche fiables, catégories par thèmes, ingestion automatique + traçabilité)

---

## 1. ÉTAT DES LIEUX — CODE EXISTANT

### 1.1 Structure actuelle

**Frontend (/aides listing)**
- **Composant principal**: `src/pages/Aides.jsx`
- **Carte d'aide**: `src/components/cards/AideCard.jsx`
- **Page détail**: `src/pages/AideDetail.jsx`
- **Routes**: `/aides`, `/aides/:slug`, `/categories/:slug`, `/situations/:slug`

**Backend API**
- **Handler**: `api/_handlers/aides.js`
- **Recherche**: `api/lib/search-query.js` (fonction `searchAides`)
- **Validation**: `api/_utils/validators.js` (schéma Zod `searchAidesSchema`)

**Base de données**
- **Modèle Prisma**: `Aide` (schema.prisma:11-59)
- **Relations**:
  - `Aide` → `AidCategory` (belongsTo via `categoryId`)
  - `Aide` ↔ `LifeSituation` (many-to-many via `_AideToLifeSituation`)
  - `Aide` → `AidSource` (belongsTo via `sourceId`)

**Ingestion**
- **Cron existant**: `api/_handlers/cron/ingest-aids.js`
- **Source**: JSON externe (GitHub raw)
- **Script seed**: `scripts/seed-minimum-aides.js` (50 aides manuelles)

---

## 2. ROOT CAUSES — ÉCARTS PAR RAPPORT AU DOD

### ⚠️ P0 — BLOQUANTS FONCTIONNELS

#### RC-1: Modèle Prisma INCOMPLET pour les exigences

**Symptôme**:
- Champs manquants obligatoires pour DOD:
  - ❌ `theme` (string) — actuellement via `categoryId` mais pas de champ direct
  - ❌ `sous_theme` (string)
  - ❌ `organisme` (string) — existe `providerName` mais pas indexé
  - ❌ `public` (string[]) — existe `audiences` mais non utilisé dans filtres
  - ❌ `territoire_niveau` (string: national|region|departement|commune)
  - ❌ `territoire_codes` (string[]: 67, 68, FR-GES, etc.)
  - ❌ `apply_url` (string) — existe `lien_demande` mais pas normalisé
  - ❌ `source_domain` (string) — pour regrouper par organisme
  - ❌ `fetched_at` (datetime) — pas de tracking date ingestion
  - ❌ `source_last_modified` (datetime?)
  - ❌ `falc_steps` (string?)

**Champs existants mais non exploités**:
- `source_url` existe mais pas affiché côté UI détail
- `audiences` existe mais pas utilisé dans filtres API
- `departements` existe mais pas exploité pour filtre territoire

**Impact**:
- Impossible de filtrer par `organisme`, `public`, `territoire` correctement
- Pas de traçabilité des sources (pas d'affichage source_url + fetched_at)
- Pas de catégorisation fine (sous-thèmes)

**Fix Plan**:
1. Migration Prisma pour ajouter champs manquants
2. Adapter API pour supporter filtres territoire/organisme/public
3. Adapter UI pour afficher traçabilité

---

#### RC-2: API `/api/aides` — Filtres INCOMPLETS

**Symptôme**:
- Endpoint actuel supporte uniquement:
  - ✅ `q`, `category`, `situation`, `geo`, `audience`, `providerType`, `page`, `pageSize`
- Filtres MANQUANTS pour DOD:
  - ❌ `theme` (distinct de `category` si on veut taxonomie propre)
  - ❌ `sousTheme`
  - ❌ `public` (actuellement `audience` mais non exploité)
  - ❌ `territoire` + `territoireCode` (actuellement `geo` mais pas structuré)
  - ❌ `organisme`
  - ❌ `urgent` (boolean)
  - ❌ `statut` (default=publie mais pas dans query params)
  - ❌ `sort` (pertinence|-created_date|title)

**Code actuel** (`api/_utils/validators.js:11-17`):
```js
export const searchAidesSchema = baseSearchSchema.extend({
  category: z.string().optional(),
  situation: z.string().optional(),
  geo: z.string().optional(),
  audience: z.string().optional(),
  providerType: z.string().optional(),
});
```

**Impact**:
- Impossible de filtrer par organisme (CAF, AGEFIPH, Région)
- Impossible de filtrer par urgence
- Impossible de trier (actuellement uniquement pertinence si `q` ou date)
- Filtres territoire non normalisés

**Fix Plan**:
1. Étendre `searchAidesSchema` avec tous les params requis
2. Adapter `searchAides()` pour construire WHERE clauses correspondantes
3. Valider combinaison filtres (AND logic)

---

#### RC-3: UI /aides — Filtres NON REFLÉTÉS dans URL

**Symptôme**:
- Le code `src/pages/Aides.jsx` supporte actuellement:
  - ✅ `q`, `category`, `situation`, `geo`, `page`
- Filtres UI MANQUANTS:
  - ❌ `sousTheme`
  - ❌ `public` (handicap/seniors/jeunes/famille)
  - ❌ `territoire` (select national/region/dept/commune + codes)
  - ❌ `organisme` (select CAF/AGEFIPH/Région/etc.)
  - ❌ `urgent` (checkbox)
  - ❌ `tri` (select pertinence/récent/alpha)

**Code actuel** (`Aides.jsx:22-26`):
```js
const query = searchParams.get('q') || '';
const category = searchParams.get('category') || ...;
const situation = searchParams.get('situation') || ...;
const geo = searchParams.get('geo') || '';
const page = searchParams.get('page') || '1';
```

**Impact**:
- Impossible de partager un lien avec filtres complets
- Navigation utilisateur limitée
- Pas de catégorisation par thèmes visibles

**Fix Plan**:
1. Ajouter composants filtres UI pour chaque dimension
2. Synchroniser tous filtres avec URLSearchParams
3. Ajouter bloc "Thèmes" avec facettes cliquables

---

#### RC-4: Page détail /aides/:slug — Traçabilité ABSENTE

**Symptôme**:
- Le composant `AideDetail.jsx` n'affiche PAS:
  - ❌ Lien "Source officielle" (source_url)
  - ❌ Lien "Faire la demande" (apply_url) — existe `lien_demande` mais conditionnel
  - ❌ Date de récupération (fetched_at)
  - ❌ Organisme source

**Code actuel** (`AideDetail.jsx:280-304`):
```jsx
{/* Sources */}
{aide.sources?.length > 0 && (
  <Card className="bg-slate-50">
    <CardContent className="p-6">
      <h2>Sources</h2>
      {aide.sources.map(...)}
    </CardContent>
  </Card>
)}
```

**Problème**: `aide.sources` est un champ JSON optionnel, pas le champ `source_url` (string) qui existe dans le modèle.

**Impact**:
- Utilisateur ne peut pas vérifier la source officielle
- Pas de transparence sur la fiabilité
- Non-conformité DOD #6

**Fix Plan**:
1. Afficher systématiquement `source_url` (OBLIGATOIRE)
2. Afficher `apply_url` si présent
3. Afficher `fetched_at` + `source_last_modified`

---

#### RC-5: Ingestion — Architecture FRAGILE et MANQUE DE SOURCES

**Symptôme**:
- **Source actuelle**: `https://raw.githubusercontent.com/.../aids-france.json`
- **Connecteurs**: AUCUN connecteur pour sources prioritaires:
  - ❌ Région Grand Est (https://www.grandest.fr/aides/)
  - ❌ AGEFIPH (https://www.agefiph.fr/)
- **Traçabilité**: Le script `ingest-aids.js` ne stocke PAS:
  - ❌ `source_url` exact (URL de la page détail utilisée)
  - ❌ `apply_url` (lien demande extrait)
  - ❌ `fetched_at`
  - ❌ `source_domain`

**Code actuel** (`api/_handlers/cron/ingest-aids.js:119-128`):
```js
await prisma.aide.update({
  where: { slug },
  data: {
    titre: tit,
    summary_falc: item.summary,
    providerName: item.provider,
    statut: 'publie',
    published_at: new Date()
  }
});
```

**Impact**:
- Pas de mapping themes/sous-themes (données brutes non normalisées)
- Pas de déduplication robuste (uniquement par slug, pas par source_url)
- Impossible de tracer l'origine exacte de chaque aide
- Non-conformité DOD #13-15 (pipeline multi-sources + traçabilité)

**Fix Plan**:
1. Créer architecture `SourceConnector` interface
2. Implémenter connecteur Région Grand Est
3. Implémenter connecteur AGEFIPH
4. Créer fichier `taxonomy.ts` (mapping themes/sousThemes)
5. Ajouter déduplication par `source_url` hash
6. Stocker `fetched_at`, `source_url_exact`, `apply_url`

---

### ⚠️ P1 — QUALITÉ & ROBUSTESSE

#### RC-6: Recherche textuelle — PAS DE TOLÉRANCE FAUTES

**Symptôme**:
- La recherche utilise `plainto_tsquery('french', unaccent(${q}))` (search-query.js:19)
- ✅ Unaccent activé
- ❌ Pas de fuzzy search (tolérance fautes simples)

**Impact**:
- "handicapé" ne match pas "handicap"
- "CAFR" ne match pas "CAF"

**Fix Plan**:
1. Ajouter extension `pg_trgm` pour trigram similarity
2. Utiliser `similarity()` ou `word_similarity()` en fallback
3. Combiner tsvector + trigram avec boost pondéré

---

#### RC-7: Validation API — 400/404/500 PAS PROPRES

**Symptôme**:
- Handler actuel (`api/_handlers/aides.js:50-53`):
```js
} catch (error) {
    console.error('Aides handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
}
```

**Problèmes**:
- Pas de distinction erreurs métier vs technique
- Pas de requestId dans logs
- Pas de breadcrumbs Sentry structurés

**Fix Plan**:
1. Wrapper logging structuré (requestId, path, query, duration_ms)
2. Sentry.captureException avec context
3. Retourner messages d'erreur utiles (400 → "Invalid query: ...")

---

#### RC-8: Prisma indexes — MANQUANTS pour performance

**Symptôme**:
- Indexes actuels (schema.prisma:56-59):
```prisma
@@index([statut, published_at])
@@index([categoryId, statut])
@@index([statut])
```

**Indexes MANQUANTS**:
- ❌ `theme` (si ajouté)
- ❌ `organisme`
- ❌ `est_urgent`
- ❌ `territoire_codes` (GIN index pour array)
- ❌ `source_url` (unique constraint pour dédup)

**Impact**:
- Requêtes lentes avec filtres multiples
- Pas de déduplication robuste

**Fix Plan**:
1. Migration ajout indexes
2. Unique constraint sur `source_url` (ou hash)

---

#### RC-9: États UI — Empty/Error NON OPTIMAUX

**Symptôme**:
- ✅ `EmptyState` existe et est utilisé
- ❌ Message générique "Aucune aide trouvée"
- ❌ Pas de suggestion contextualisée (ex: "Aucune aide urgence trouvée, voir aides logement")

**Fix Plan**:
1. Messages d'erreur contextuels selon filtres actifs
2. Suggestions de filtres alternatifs

---

### ⚠️ P2 — AUTOMATISATION / PIPELINE

#### RC-10: Cron jobs — INCOMPLET

**Symptôme**:
- Cron actuel (vercel.json:3-6):
```json
{
  "path": "/api/cron/pipeline",
  "schedule": "0 * * * *"  // Chaque heure
}
```

**Problèmes**:
- Pas de cron spécifique ingestion aides
- Pipeline global trop fréquent (chaque heure)
- Pas de job "full refresh" hebdo
- Pas de métriques (combien créés/maj/ignorés/erreurs)

**Fix Plan**:
1. Créer `/api/cron/ingest-aids-daily` (quotidien 03:30)
2. Créer `/api/cron/ingest-aids-full` (hebdo dimanche)
3. Logs structurés + Sentry alerte si taux erreur > seuil

---

#### RC-11: Déduplication — NON IDEMPOTENT

**Symptôme**:
- Logique actuelle (ingest-aids.js:116):
```js
const existing = await prisma.aide.findUnique({ where: { slug } });
```

**Problème**:
- Déduplication par `slug` seulement
- Si même aide = 2 URLs différentes → 2 entrées si slugs différents
- Pas de hash contenu

**Fix Plan**:
1. Générer `stableId` = hash(source_url) ou hash(title+organisme+territoire)
2. Upsert via `source_url` unique
3. Ajouter `content_hash` pour détecter modifications

---

#### RC-12: Tests — ABSENTS

**Symptôme**:
- ❌ Aucun test unitaire (taxonomy, parsing, validation)
- ❌ Aucun test intégration (endpoints API)
- ❌ Aucun test E2E Playwright

**Impact**:
- Non-conformité DOD #12
- Régression risque élevé

**Fix Plan**:
1. Tests unitaires: `taxonomy.test.js`, `validators.test.js`, `parsers/*.test.js`
2. Tests intégration: `aides-api.test.js`
3. Tests E2E: `aides-journey.spec.ts`

---

## 3. FIX PLAN — ORDRE D'EXÉCUTION

### Phase 1: DATABASE + MIGRATIONS (Étape 3 DOD)

1. ✅ Créer migration Prisma:
   - Ajouter champs: `theme`, `sous_theme`, `organisme`, `territoire_niveau`, `territoire_codes`, `apply_url`, `source_domain`, `fetched_at`, `source_last_modified`, `falc_steps`
   - Ajouter indexes: `theme`, `organisme`, `est_urgent`, `territoire_codes` (GIN), `source_url` (unique)
   - Backfill données existantes (mapper `categoryId` → `theme`)

2. ✅ Appliquer migration (push DB)

---

### Phase 2: API NORMALISÉE (Étape 2 DOD)

3. ✅ Étendre `searchAidesSchema` (validators.js):
   - Ajouter params: `theme`, `sousTheme`, `public`, `territoire`, `territoireCode`, `organisme`, `urgent`, `statut`, `sort`

4. ✅ Adapter `searchAides()` (search-query.js):
   - Ajouter WHERE clauses pour nouveaux filtres
   - Implémenter tri (pertinence/-created_date/title)
   - Retourner facets (counts par theme, organisme, territoire, public)

5. ✅ Adapter handler `/api/aides` (aides.js):
   - Logging structuré (requestId, duration)
   - Sentry breadcrumbs
   - Retourner facets dans réponse

6. ✅ Fuzzy search (optionnel P1):
   - Migration `pg_trgm` extension
   - Adapter query avec similarity fallback

---

### Phase 3: INGESTION ROBUSTE (Étape 4 DOD)

7. ✅ Créer architecture connecteurs:
   - Interface `SourceConnector` (name, domain, fetch, parse, mapToAide, getStableId)
   - Fichier `taxonomy.ts` (mapping themes/sousThemes)

8. ✅ Implémenter connecteur Région Grand Est:
   - Parser HTML pages aides
   - Extraire source_url, apply_url, fetched_at
   - Mapper vers modèle Aide

9. ✅ Implémenter connecteur AGEFIPH:
   - Parser HTML/API
   - Extraire champs + URLs

10. ✅ Pipeline idempotent:
    - Upsert via source_url (unique constraint)
    - Déduplication par content_hash
    - Logs structurés (créés/maj/ignorés/erreurs)

11. ✅ Configurer cron jobs (vercel.json):
    - Daily 03:30: `/api/cron/ingest-aids-daily`
    - Weekly dimanche: `/api/cron/ingest-aids-full`

---

### Phase 4: FRONTEND IRRÉPROCHABLE (Étape 5 DOD)

12. ✅ UI /aides (Aides.jsx):
    - Ajouter filtres: sousTheme, public, territoire, organisme, urgent, tri
    - Synchroniser tous avec URLSearchParams
    - Bloc "Thèmes" avec cartes facettes
    - États loading/empty/error contextuels

13. ✅ UI /aides/:slug (AideDetail.jsx):
    - Afficher source_url (OBLIGATOIRE)
    - Afficher apply_url (si présent)
    - Afficher fetched_at + source_last_modified
    - Afficher organisme source
    - Aria labels + navigation clavier

---

### Phase 5: OBSERVABILITÉ + SÉCURITÉ (Étape 6 DOD)

14. ✅ Sentry:
    - Capture exceptions API + Front error boundary
    - Breadcrumbs structurés

15. ✅ Rate limiting:
    - Vérifier KV prod OK (fallback dev acceptable)

16. ✅ Cache:
    - Cache-Control headers sur /api/aides

---

### Phase 6: TESTS (Étape 7 DOD)

17. ✅ Tests unitaires:
    - `taxonomy.test.js`
    - `validators.test.js`
    - `parsers/grandest.test.js`
    - `parsers/agefiph.test.js`

18. ✅ Tests intégration:
    - `aides-api.integration.test.js`

19. ✅ Tests E2E:
    - `aides-journey.spec.ts` (Playwright)

20. ✅ CI: Vérifier tests passent + build OK

---

## 4. CHECKLIST DOD — COUVERTURE

| # | DOD Item | Root Cause | Fix Phase |
|---|----------|------------|-----------|
| 1 | /aides charge sans 500 + liste non vide | RC-1, RC-2 | Phase 2+4 |
| 2 | Liens listing→détail OK | ✅ Déjà OK | - |
| 3 | Recherche texte + tolérance fautes | RC-6 | Phase 2 |
| 4 | Filtres combinables + URL | RC-2, RC-3 | Phase 2+4 |
| 5 | Catégories par thèmes | RC-1, RC-3 | Phase 1+4 |
| 6 | Détail affiche source_url + apply_url + fetched_at | RC-4 | Phase 1+4 |
| 7 | États UI propres | RC-9 | Phase 4 |
| 8 | API validée Zod + erreurs propres | RC-7 | Phase 2 |
| 9 | Prisma schema propre + migrations + indexes | RC-1, RC-8 | Phase 1 |
| 10 | Déduplication | RC-11 | Phase 3 |
| 11 | Observabilité | RC-7 | Phase 5 |
| 12 | Tests | RC-12 | Phase 6 |
| 13 | Pipeline multi-sources + cron | RC-5, RC-10 | Phase 3 |
| 14 | Idempotent | RC-11 | Phase 3 |
| 15 | Traçabilité URLs | RC-5 | Phase 3 |

---

## 5. ESTIMATION

- **Phase 1** (DB): ~30min (migration + push)
- **Phase 2** (API): ~1h (validation + search + handlers)
- **Phase 3** (Ingestion): ~2h (connecteurs + pipeline + cron)
- **Phase 4** (Frontend): ~1h30 (filtres UI + détail)
- **Phase 5** (Observabilité): ~30min (Sentry + logs)
- **Phase 6** (Tests): ~1h30 (unit + integration + e2e)

**Total**: ~7h

---

## 6. RISQUES

1. **Migration DB**: Backfill données existantes (mapper categoryId → theme)
   - Mitigation: Script de migration safe avec rollback

2. **Connecteurs scraping**: HTML peut changer
   - Mitigation: Parsing robuste + fallback + tests

3. **Performance**: Queries complexes avec multiples filtres
   - Mitigation: Indexes bien placés + EXPLAIN queries

4. **Régression**: Casser autres pages (démarches/structures)
   - Mitigation: Tests E2E + validation manuelle

---

**FIN AUDIT — PRÊT POUR IMPLÉMENTATION**
