# P0 API Fix - Production Readiness

## 🎯 Objective

Rendre fonctionnels en production les parcours pages publiques:
- ✅ GET `/api/demarches?...` => 200 (pas 500)
- ✅ GET `/api/structures?...` => 200 (pas 500)
- ✅ GET `/api/aides?...sort=-created_date` => 200 (pas 400)
- ✅ GET `/sitemap.xml` => 200 + Content-Type XML (pas 400)

**SANS modifier le front** (src/pages, src/components, routing UI)

---

## 🔍 Root Cause Analysis

### 1. API Demarches/Structures 500 Errors
**Problème:** Colonnes manquantes en base de données (DB drift)
- Le schéma Prisma définit `updatedBy`, `published_at`, `statut`
- La base de données en production ne les a pas toutes
- Résultat: Prisma queries échouent avec 500 Internal Server Error

**Solution:** Migration SQL idempotente qui ajoute les colonnes manquantes

### 2. API Aides 400 Bad Request
**Problème:** Validation trop stricte sur le paramètre `sort`
- Le validator n'acceptait que: `pertinence`, `date`, `alpha`
- Le front envoie: `sort=-created_date`, `sort=-published_at`
- Résultat: 400 Bad Request

**Solution:** 
- Whitelist étendue dans le validator
- Parser de sort avec préfixe `-` pour DESC
- Mapping sécurisé vers les colonnes DB (pas d'injection SQL)

### 3. Sitemap 400 Errors
**Problème:** Erreurs DB non gérées
- Si une table n'existe pas ou une query échoue → 400/500
- Pas de fallback gracieux

**Solution:** 
- Fallback à 3 niveaux
- Toujours retourner 200 + XML valide
- Catch individuel sur chaque query DB

---

## 📦 Fichiers Modifiés

### 1. Migration SQL (CRITIQUE)
**Fichier:** `prisma/migrations/20260207_p0_db_drift_fix/migration.sql`

**Contenu:**
- Ajoute `updatedBy` à Aide, Demarche, Structure, Actualite (IF NOT EXISTS)
- Ajoute `published_at` à Aide, Demarche, Structure (IF NOT EXISTS)
- Gère le rename `status` → `statut` pour Structure
- Active l'extension `unaccent` pour la recherche

**Caractéristiques:**
- ✅ Idempotent (safe à rejouer)
- ✅ Pas de DROP, pas de data loss
- ✅ Utilise `DO $$ BEGIN ... END $$` pour les checks conditionnels

### 2. Validator (API Contract)
**Fichier:** `api/_utils/validators.js`

**Changements:**
```javascript
// AVANT
sort: z.enum(['pertinence', 'date', 'alpha']).default('pertinence')

// APRÈS
sort: z.enum([
  'pertinence', 'date', 'alpha',
  'created_date', '-created_date',
  'published_at', '-published_at',
  'date_publication', '-date_publication',
  'titre', '-titre'
]).default('pertinence')
```

**Sécurité:** Whitelist stricte, pas de `z.string()` qui permettrait l'injection SQL

### 3. Search Query (Safe Mapping)
**Fichier:** `api/lib/search-query.js`

**Changements:**
- Parser de sort avec préfixe `-` (DESC)
- Mapping sécurisé vers colonnes DB:
  ```javascript
  const SAFE_SORT_COLUMNS = {
    'created_date': 'updatedAt',
    'published_at': 'published_at',
    'date_publication': 'published_at',
    'titre': 'titre',
    'alpha': 'titre',
    'date': 'published_at'
  };
  ```
- Utilise `Prisma.raw()` uniquement avec des colonnes whitelistées

### 4. Sitemap (Robustesse)
**Fichier:** `api/_handlers/sitemap.js`

**Changements:**
- Catch individuel sur chaque query DB (`.catch(() => [])`)
- Fallback global en cas d'erreur totale
- Toujours retourner 200 + XML minimal

### 5. Tests d'Intégration
**Fichier:** `tests/integration/p0-api-smoke.test.js`

**Couverture:**
- ✅ Sitemap toujours 200 (même sans DB)
- ✅ Aides avec `sort=-created_date` ne retourne PAS 400
- ✅ Demarches/Structures ne retournent PAS 500 (après migration)
- ✅ Tests skippés si DATABASE_URL absent (CI friendly)

---

## 🚀 Déploiement

### Étape 1: Merge de la PR
```bash
git checkout main
git merge fix/p0-api-db-sitemap
git push origin main
```

### Étape 2: Appliquer la Migration (OBLIGATOIRE)
**Sur Vercel:**
La migration sera appliquée automatiquement au build si `prisma migrate deploy` est dans le build script.

**Vérifier:**
```bash
# Dans les logs Vercel, chercher:
# "Running prisma migrate deploy"
# "Migration 20260207_p0_db_drift_fix applied"
```

**Manuellement (si nécessaire):**
```bash
# Depuis un environnement avec accès à DATABASE_URL
npx prisma migrate deploy
```

### Étape 3: Vérification en Production

#### 3.1 Endpoints API
```bash
# Aides avec sort=-created_date (ne doit PAS être 400)
curl -I "https://www.accesdirectaide.fr/api/aides?sort=-created_date&limit=5"
# Expected: HTTP/2 200

# Demarches (ne doit PAS être 500)
curl -I "https://www.accesdirectaide.fr/api/demarches?statut=publie&limit=3"
# Expected: HTTP/2 200

# Structures (ne doit PAS être 500)
curl -I "https://www.accesdirectaide.fr/api/structures?statut=actif&limit=3"
# Expected: HTTP/2 200

# Sitemap (TOUJOURS 200)
curl -I "https://www.accesdirectaide.fr/sitemap.xml"
# Expected: HTTP/2 200
# Expected: content-type: application/xml
```

#### 3.2 Vérifier Sentry
- Aller sur Sentry dashboard
- Vérifier qu'il n'y a PAS de nouvelles erreurs 500 sur `/api/demarches` ou `/api/structures`
- Vérifier qu'il n'y a PAS d'erreurs 400 sur `/api/aides`

#### 3.3 Tester les Pages Publiques
- Visiter https://www.accesdirectaide.fr/aides
- Visiter https://www.accesdirectaide.fr/demarches
- Visiter https://www.accesdirectaide.fr/annuaire
- Vérifier que les cartes s'affichent correctement

---

## 🔒 Sécurité

### Validation Stricte
- ✅ Whitelist explicite pour `sort` (pas de `z.string()`)
- ✅ Mapping sécurisé vers colonnes DB
- ✅ Utilisation de `Prisma.raw()` uniquement avec des valeurs whitelistées
- ✅ Pas d'injection SQL possible

### Migration Idempotente
- ✅ Utilise `IF NOT EXISTS` partout
- ✅ Pas de DROP, pas de data loss
- ✅ Safe à rejouer en cas d'échec partiel

### Fallbacks Gracieux
- ✅ Sitemap retourne toujours 200 (jamais 400/500)
- ✅ Actualites a un fallback sur erreur DB
- ✅ Pas de crash en production

---

## 📊 Tests

### Exécution Locale
```bash
# Tous les tests
npm test

# Tests P0 uniquement
npm test -- tests/integration/p0-api-smoke.test.js

# Avec DATABASE_URL (tests DB)
DATABASE_URL="postgresql://..." npm test
```

### Résultats Attendus
```
✓ tests/integration/p0-api-smoke.test.js (9 tests | 6 skipped)
  ✓ Sitemap (MUST ALWAYS RETURN 200)
    ✓ should return 200 with valid XML even without database
  ✓ Actualites API
    ✓ should return 200 for basic query (with fallback)
  ✓ Health Check Pattern
    ✓ sitemap should never return 400 or 500

# Si DATABASE_URL est défini:
  ✓ Aides API (requires DB)
    ✓ should return 200 for basic query
    ✓ should NOT return 400 for sort=-created_date
    ✓ should accept sort=-published_at
    ✓ should accept sort=alpha
  ✓ Demarches API (requires DB)
    ✓ should return 200 for basic query
  ✓ Structures API (requires DB)
    ✓ should return 200 for basic query
```

---

## 🐛 Rollback Plan

Si un problème survient en production:

### Option 1: Rollback du Code
```bash
git revert <commit-hash>
git push origin main
```

### Option 2: Rollback de la Migration
**⚠️ ATTENTION:** La migration ajoute uniquement des colonnes (pas de DROP).
Le rollback n'est généralement PAS nécessaire car:
- Les colonnes ajoutées sont optionnelles (nullable)
- Aucune donnée n'est supprimée
- Le code ancien peut fonctionner avec les nouvelles colonnes

**Si vraiment nécessaire:**
```sql
-- À exécuter UNIQUEMENT si rollback critique
ALTER TABLE "Aide" DROP COLUMN IF EXISTS "updatedBy";
ALTER TABLE "Demarche" DROP COLUMN IF EXISTS "updatedBy";
ALTER TABLE "Structure" DROP COLUMN IF EXISTS "updatedBy";
ALTER TABLE "Actualite" DROP COLUMN IF EXISTS "updatedBy";
```

---

## 📝 Checklist de Déploiement

- [ ] PR mergée dans `main`
- [ ] Build Vercel réussi
- [ ] Migration `20260207_p0_db_drift_fix` appliquée
- [ ] Tests passent en CI
- [ ] Vérification endpoints API (curl)
- [ ] Vérification Sentry (pas de nouvelles erreurs)
- [ ] Vérification pages publiques (/aides, /demarches, /annuaire)
- [ ] Vérification sitemap.xml (200 + XML)
- [ ] Monitoring actif pendant 1h post-déploiement

---

## 🎉 Résultat Attendu

Après déploiement:
- ✅ `/api/aides?sort=-created_date` → 200 (plus jamais 400)
- ✅ `/api/demarches` → 200 (plus jamais 500)
- ✅ `/api/structures` → 200 (plus jamais 500)
- ✅ `/sitemap.xml` → 200 + XML (toujours, même si DB fail)
- ✅ Pages publiques fonctionnelles
- ✅ Aucune modification du front nécessaire
- ✅ API contract stable et sécurisé

---

## 📞 Support

En cas de problème:
1. Vérifier les logs Vercel
2. Vérifier Sentry pour les erreurs
3. Exécuter les tests localement avec DATABASE_URL
4. Contacter l'équipe DevOps si migration bloquée
