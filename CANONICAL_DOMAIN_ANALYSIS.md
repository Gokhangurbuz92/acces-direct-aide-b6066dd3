# Analyse: Redirects et Middleware - Domaine Canonique

**Date:** 2026-02-01
**Objectif:** Autoriser Preview/Staging tout en appliquant le domaine canonique uniquement en production
**Statut:** Analyse et recommandations

---

## 1. ANALYSE DU PROBLÈME

### 1.1 Configuration Actuelle

#### A. Middleware (`middleware.js`)

```javascript
export default function middleware(request) {
  const host = request.headers.get('host') || '';
  const domain = host.split(':')[0];

  // Production domains
  const isProduction = domain === 'accesdirectaide.fr' || domain === 'www.accesdirectaide.fr';

  if (!isProduction) {
    return next({
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  return next();
}
```

**Fonction actuelle:**
- ✅ Ajoute `X-Robots-Tag: noindex, nofollow` sur tous les domaines non-production
- ✅ Permet l'accès aux Preview/Staging (pas de redirection)
- ❌ **N'applique PAS de redirection apex → www**

#### B. Vercel Configuration (Historique)

D'après `production_domain_fix_report.md` et `production_redirect_fix.md`:

**Problème initial (résolu le 2026-01-23):**
- Configuration dans un `vercel.json` (maintenant supprimé/migré vers `vercel.ts`)
- Redirect: `www.accesdirectaide.fr` → `accesdirectaide.fr` (mauvaise direction)
- Conflit avec comportement par défaut Vercel: `accesdirectaide.fr` → `www.accesdirectaide.fr`
- **Résultat:** Boucle infinie HTTP 308

**Fix appliqué (commit a439952):**
- Redirect inversé: `accesdirectaide.fr` → `www.accesdirectaide.fr`
- Domaine canonique défini: `www.accesdirectaide.fr`
- **Résultat:** Plus de boucle, redirects stables

#### C. Configuration Actuelle (`vercel.ts`)

```typescript
const config = {
    redirects: [
        { source: "/guide/:slug", destination: "/demarches", permanent: true },
        { source: "/aide/:slug", destination: "/aides/:slug", permanent: true },
        { source: "/login/pro", destination: "/pro/login", permanent: true },
        { source: "/home", destination: "/", permanent: true },
    ],
    // ...
}
```

**Observation critique:**
- ❌ **AUCUNE règle de redirection apex → www** dans `vercel.ts`
- ❓ La redirection apex → www doit être configurée dans **Vercel UI Project Settings > Domains**
- ⚠️ Si configurée via UI, elle s'applique à TOUS les environnements (Preview/Staging inclus)

### 1.2 Comportement Problématique Identifié

| Environnement | Domaine | Comportement Actuel | Problème |
|---------------|---------|---------------------|----------|
| **Production** | `accesdirectaide.fr` | Redirige vers `www.accesdirectaide.fr` (308) | ✅ Correct (si configuré via UI) |
| **Production** | `www.accesdirectaide.fr` | Répond directement (200) | ✅ Correct |
| **Staging** | `staging.accesdirectaide.fr` | Répond avec `X-Robots-Tag: noindex` | ✅ Correct |
| **Preview** | `*.vercel.app` | **Redirige vers `www.accesdirectaide.fr`** (si redirect configuré via UI) | ❌ **BLOQUE les previews** |

**Problème principal:**
Les redirects configurés via **Vercel UI (Project Settings > Domains > Redirect to www)** s'appliquent **globalement à tous les environnements** (Production, Preview, Staging), bloquant les previews et staging.

### 1.3 Sources de Vérité Multiples

| Mécanisme | Scope | Condition | Problème Actuel |
|-----------|-------|-----------|-----------------|
| **Vercel UI Redirect** | Tous les environnements | Toujours actif | Bloque Preview/Staging si activé |
| **`vercel.ts` redirects** | Tous les environnements | Pas de conditions | Aucune règle apex → www actuellement |
| **`middleware.js`** | Edge runtime | Logique conditionnelle possible | Actuellement utilisé uniquement pour `X-Robots-Tag` |
| **API `_utils/seo.js`** | Côté serveur | Logique conditionnelle | Uniquement pour génération sitemap/robots |

---

## 2. CONTRAINTES ET EXIGENCES

### 2.1 Exigences Fonctionnelles

1. **Production (`www.accesdirectaide.fr`):**
   - ✅ Redirection permanente (308) de `accesdirectaide.fr` → `www.accesdirectaide.fr`
   - ✅ Domaine canonique: `www.accesdirectaide.fr`
   - ✅ PAS de `X-Robots-Tag: noindex`
   - ✅ Sitemap et robots.txt pointent vers domaine canonique

2. **Staging (`staging.accesdirectaide.fr`):**
   - ✅ AUCUNE redirection vers production
   - ✅ `X-Robots-Tag: noindex, nofollow`
   - ✅ Accès fonctionnel pour tests

3. **Preview (`*.vercel.app`):**
   - ✅ AUCUNE redirection vers production
   - ✅ `X-Robots-Tag: noindex, nofollow`
   - ✅ Accès fonctionnel pour validation PR

### 2.2 Contraintes Techniques

1. ❌ **Pas de modification directe** (contrainte utilisateur)
2. ✅ Architecture actuelle:
   - Vite SPA + API serverless Vercel
   - Edge Middleware disponible
   - Deux projets Vercel séparés (prod / staging) selon `INFRASTRUCTURE.md`
3. ✅ Variables d'environnement disponibles:
   - `VERCEL_ENV`: `production` | `preview` | `development`
   - `VERCEL_URL`: URL du déploiement actuel

---

## 3. SOLUTION RECOMMANDÉE

### 3.1 Stratégie: **Middleware Conditionnel**

**Pourquoi Middleware plutôt que `vercel.json` / `vercel.ts` ?**

| Critère | Vercel UI/Config | Middleware Edge |
|---------|------------------|-----------------|
| **Conditions dynamiques** | ❌ Pas de conditions par environnement | ✅ Accès à headers, env vars |
| **Scope** | Global (tous envs) | ✅ Logique conditionnelle possible |
| **Performance** | ⚡ Instant (Vercel Edge) | ⚡ Edge runtime (équivalent) |
| **Flexibilité** | ❌ Configuration statique | ✅ Code custom |
| **Maintenance** | ❌ Split UI/code | ✅ Single source (code) |

**Décision:** Utiliser le middleware pour appliquer la redirection apex → www **uniquement en production**.

### 3.2 Architecture Recommandée

```
┌─────────────────────────────────────────────────────────────┐
│                      EDGE MIDDLEWARE                        │
│  (middleware.js - Exécuté avant toute requête)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │   Détection environnement            │
         │   - Host header                      │
         │   - VERCEL_ENV (optionnel)           │
         └──────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
    ┌──────────────┐                  ┌──────────────────┐
    │  PRODUCTION  │                  │ PREVIEW/STAGING  │
    │  Domains:    │                  │ Domains:         │
    │  - apex.fr   │                  │ - *.vercel.app   │
    │  - www.      │                  │ - staging.*      │
    └──────────────┘                  └──────────────────┘
          │                                   │
          ▼                                   ▼
    ┌──────────────┐                  ┌──────────────────┐
    │ apex.fr?     │                  │ NO REDIRECT      │
    │ → 308 → www  │                  │ + X-Robots-Tag   │
    │              │                  │   noindex        │
    │ www.fr?      │                  └──────────────────┘
    │ → next()     │
    └──────────────┘
```

### 3.3 Implémentation Middleware

**Fichier:** `middleware.js`

```javascript
import { next } from '@vercel/edge';

export default function middleware(request) {
  const host = request.headers.get('host') || '';
  const url = new URL(request.url);
  const domain = host.split(':')[0]; // Remove port if present

  // --- PRODUCTION DOMAIN ENFORCEMENT ---
  // Only apply canonical redirect in production environments
  const isProductionDomain =
    domain === 'accesdirectaide.fr' ||
    domain === 'www.accesdirectaide.fr';

  if (isProductionDomain) {
    // Redirect apex to www (canonical)
    if (domain === 'accesdirectaide.fr') {
      const canonicalUrl = new URL(request.url);
      canonicalUrl.host = 'www.accesdirectaide.fr';

      return Response.redirect(canonicalUrl.toString(), 308);
    }

    // www domain: allow through (no X-Robots-Tag)
    return next();
  }

  // --- NON-PRODUCTION (PREVIEW / STAGING) ---
  // Apply noindex to prevent search engine indexing
  return next({
    headers: {
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export const config = {
  matcher: [
    '/((?!api/|assets/|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
```

**Avantages:**
1. ✅ Redirection apex → www **uniquement** si `host === 'accesdirectaide.fr'`
2. ✅ Preview/Staging (`*.vercel.app`, `staging.*`) ne sont jamais redirigés
3. ✅ `X-Robots-Tag: noindex` automatique sur non-production
4. ✅ Edge runtime (latence minimale)
5. ✅ Logique centralisée et versionnée dans le repo

### 3.4 Alternative: Redirects Conditionnels (Non Recommandé)

**Option:** Ajouter redirect dans `vercel.ts` avec condition via header

```typescript
redirects: [
  {
    source: "/:path*",
    has: [
      { type: "host", value: "accesdirectaide.fr" },
    ],
    destination: "https://www.accesdirectaide.fr/:path*",
    permanent: true,
  },
]
```

**Problème:**
- ❌ S'applique à **tous les environnements** (Preview inclus si DNS pointe vers apex)
- ❌ Pas de condition `if (VERCEL_ENV === 'production')` disponible dans `vercel.ts`
- ❌ Moins flexible que middleware

**Verdict:** ❌ **Non recommandé** pour ce cas d'usage.

---

## 4. PLAN D'IMPLÉMENTATION

### Phase 1: Préparation (Aucune Modification)

**Objectif:** Documenter l'état actuel

1. ✅ **Audit configuration Vercel UI:**
   - Vérifier Project Settings > Domains
   - Identifier si redirect apex → www est configuré via UI
   - Documenter les environnements (Prod / Staging)

2. ✅ **Vérifier comportement actuel:**
   ```bash
   # Test production apex
   curl -sI https://accesdirectaide.fr/ | grep -E "HTTP|location"
   # Expected: HTTP/2 308 + location: https://www.accesdirectaide.fr/

   # Test production www
   curl -sI https://www.accesdirectaide.fr/ | grep -E "HTTP|x-robots"
   # Expected: HTTP/2 200 (no x-robots-tag)

   # Test preview/staging
   curl -sI https://<preview-url>.vercel.app/ | grep -E "HTTP|x-robots|location"
   # Expected: HTTP/2 200 + x-robots-tag: noindex, nofollow (NO redirect)
   ```

3. ✅ **Documenter variables d'environnement:**
   - Vérifier présence de `VERCEL_ENV` dans `/api/_handlers/version.js`
   - Confirmer séparation des projets Vercel (prod vs staging)

### Phase 2: Solution Middleware (Recommandée)

**Objectif:** Implémenter la redirection conditionnelle via middleware

#### Étape 2.1: Modifier `middleware.js`

**Fichier:** `/vercel/sandbox/middleware.js`

**Changements:**

```diff
 import { next } from '@vercel/edge';

 export default function middleware(request) {
   const host = request.headers.get('host') || '';
+  const url = new URL(request.url);
   const domain = host.split(':')[0];

-  // Production domains
-  const isProduction = domain === 'accesdirectaide.fr' || domain === 'www.accesdirectaide.fr';
+  // --- PRODUCTION DOMAIN ENFORCEMENT ---
+  const isProductionDomain =
+    domain === 'accesdirectaide.fr' ||
+    domain === 'www.accesdirectaide.fr';

-  if (!isProduction) {
+  if (isProductionDomain) {
+    // Redirect apex to www (canonical)
+    if (domain === 'accesdirectaide.fr') {
+      const canonicalUrl = new URL(request.url);
+      canonicalUrl.host = 'www.accesdirectaide.fr';
+
+      return Response.redirect(canonicalUrl.toString(), 308);
+    }
+
+    // www domain: allow through (production = indexable)
+    return next();
+  }
+
+  // --- NON-PRODUCTION (PREVIEW / STAGING) ---
+  // Apply noindex to prevent search engine indexing
+  return next({
     headers: {
       'X-Robots-Tag': 'noindex, nofollow',
     },
-  });
+  });
-  }
-
-  return next();
 }

 export const config = {
   matcher: [
     '/((?!api/|assets/|favicon.ico|robots.txt|sitemap.xml).*)',
   ],
 };
```

**Justification des changements:**

1. **Ajout de la redirection apex → www:**
   - Détecte `accesdirectaide.fr` (sans www)
   - Construit URL canonique avec `www.accesdirectaide.fr`
   - Retourne redirect 308 (permanent)

2. **Inversion de la logique:**
   - Avant: `if (!isProduction)` → ajoute noindex
   - Après: `if (isProductionDomain)` → gère redirection, puis laisse passer
   - Sinon (preview/staging) → ajoute noindex

3. **Pas de changement pour Preview/Staging:**
   - Les domaines `*.vercel.app` et `staging.*` ne matchent pas `isProductionDomain`
   - Donc ils reçoivent `X-Robots-Tag: noindex` comme avant
   - **AUCUNE redirection** vers production

#### Étape 2.2: Désactiver Redirect Vercel UI (si activé)

**Attention:** Cette étape est cruciale pour éviter les conflits.

**Action:**
1. Aller dans Vercel Project Settings > Domains
2. Si un redirect "Redirect to www" est configuré via UI → **Le désactiver**
3. **Raison:** Le middleware gère maintenant la redirection avec logique conditionnelle

**Alternative:** Si le redirect UI doit rester (pour sécurité), vérifier qu'il n'entre pas en conflit avec le middleware.

#### Étape 2.3: Tests de Validation

**A. Test Local (Dev Server)**

```bash
# Lancer dev server
npm run dev

# Test avec curl (simuler différents hosts)
curl -H "Host: accesdirectaide.fr" http://localhost:5173/ -sI
# Expected: HTTP/1.1 308 + location: http://www.accesdirectaide.fr/

curl -H "Host: www.accesdirectaide.fr" http://localhost:5173/ -sI
# Expected: HTTP/1.1 200 (no x-robots-tag)

curl -H "Host: preview.vercel.app" http://localhost:5173/ -sI
# Expected: HTTP/1.1 200 + x-robots-tag: noindex
```

**Note:** Le dev server local peut ne pas supporter le middleware Edge. Tester en priorité sur un déploiement Preview.

**B. Test Preview Deployment**

```bash
# Créer une branche et pousser
git checkout -b test/middleware-canonical
git add middleware.js
git commit -m "feat(middleware): add conditional apex → www redirect for production only"
git push origin test/middleware-canonical

# Attendre le déploiement Preview sur Vercel
# URL: https://acces-direct-aide-<hash>.vercel.app

# Test 1: Preview ne redirige PAS vers production
curl -sI https://acces-direct-aide-<hash>.vercel.app/ | grep -E "HTTP|location|x-robots"
# Expected:
# - HTTP/2 200
# - x-robots-tag: noindex, nofollow
# - NO location header (pas de redirect)

# Test 2: Preview rendu fonctionne
curl -sL https://acces-direct-aide-<hash>.vercel.app/ | grep "<title>"
# Expected: HTML avec titre de l'application
```

**C. Test Staging**

```bash
# Si staging existe (staging.accesdirectaide.fr)
curl -sI https://staging.accesdirectaide.fr/ | grep -E "HTTP|x-robots|location"
# Expected:
# - HTTP/2 200
# - x-robots-tag: noindex, nofollow
# - NO location header
```

**D. Test Production (Après Merge)**

```bash
# Test apex redirect
curl -sI https://accesdirectaide.fr/ | grep -E "HTTP|location"
# Expected:
# - HTTP/2 308
# - location: https://www.accesdirectaide.fr/

# Test www (canonical)
curl -sI https://www.accesdirectaide.fr/ | grep -E "HTTP|x-robots"
# Expected:
# - HTTP/2 200
# - NO x-robots-tag header

# Test API not affected
curl -sI https://www.accesdirectaide.fr/api/taxonomy | grep -E "HTTP|content-type"
# Expected:
# - HTTP/2 200
# - content-type: application/json
```

#### Étape 2.4: Déploiement Production

**Workflow:**

```bash
# 1. Validation complète en Preview
# 2. Merge dans staging (si séparation staging/prod existe)
git checkout staging
git merge test/middleware-canonical
git push origin staging

# 3. Valider sur staging.accesdirectaide.fr
# 4. Merge dans main (production)
git checkout main
git merge staging
git push origin main

# 5. Vérifier déploiement production
# 6. Exécuter tests production (voir 2.3.D)
```

### Phase 3: Documentation et Monitoring

#### Étape 3.1: Mettre à jour la documentation

**Fichiers à modifier:**

1. **`INFRASTRUCTURE.md`:**
   - Ajouter section "Canonical Domain Enforcement"
   - Documenter le rôle du middleware
   - Expliquer pourquoi redirect via middleware plutôt que Vercel UI

2. **`VERCEL_AUDIT.md`:**
   - Marquer le problème "Broken Previews" comme résolu
   - Mettre à jour recommandation P0 "Remove Host Redirects from vercel.json"

3. **`production_domain_fix_report.md`:**
   - Ajouter addendum: "Update 2026-02-01: Canonical redirect migré vers middleware conditionnel"

#### Étape 3.2: Monitoring

**Métriques à surveiller (post-déploiement):**

1. **Redirects:**
   - Vercel Analytics > Redirects: Vérifier taux de 308 pour `accesdirectaide.fr`
   - Pas de redirects depuis `*.vercel.app` ou `staging.*`

2. **SEO:**
   - Google Search Console: Vérifier que `www.accesdirectaide.fr` reste canonique
   - Pas d'indexation de `staging.*` ou `*.vercel.app`

3. **Performance:**
   - Vercel Analytics: Edge Middleware latency (doit être <10ms)

4. **Erreurs:**
   - Vercel Logs: Rechercher "MIDDLEWARE_ERROR" ou 500 errors

#### Étape 3.3: Checklist Post-Déploiement

- [ ] Production apex (`accesdirectaide.fr`) redirige vers www (308)
- [ ] Production www (`www.accesdirectaide.fr`) répond 200 sans x-robots-tag
- [ ] Preview (`*.vercel.app`) répond 200 avec x-robots-tag, sans redirect
- [ ] Staging (`staging.*`) répond 200 avec x-robots-tag, sans redirect
- [ ] API endpoints fonctionnels sur tous les environnements
- [ ] Documentation à jour
- [ ] Pas de régression sur vitals Vercel (TTFB, FCP, LCP)

---

## 5. ALTERNATIVES ANALYSÉES (Non Retenues)

### Option A: Redirects dans `vercel.ts` avec Header Matching

**Implémentation:**
```typescript
redirects: [
  {
    source: "/:path*",
    has: [{ type: "host", value: "accesdirectaide.fr" }],
    destination: "https://www.accesdirectaide.fr/:path*",
    permanent: true,
  },
]
```

**Problèmes:**
- ❌ Pas de condition `if (env === 'production')`
- ❌ S'applique à tous les environnements si DNS pointe vers apex
- ❌ Moins flexible que middleware

**Verdict:** ❌ Rejeté

### Option B: Vercel UI Domain Redirect

**Implémentation:**
- Project Settings > Domains > "Redirect to www"

**Problèmes:**
- ❌ Global à tous les environnements (Preview inclus)
- ❌ Pas de contrôle granulaire
- ❌ Configuration split UI/code (source of truth fragmentée)

**Verdict:** ❌ Rejeté

### Option C: Nginx/Cloudflare Reverse Proxy

**Implémentation:**
- Ajouter un layer CDN/proxy devant Vercel

**Problèmes:**
- ❌ Complexité infrastructure accrue
- ❌ Latence supplémentaire
- ❌ Coût additionnel
- ❌ Over-engineering pour ce problème

**Verdict:** ❌ Rejeté

### Option D: Deux Projets Vercel Distincts

**Implémentation:**
- Projet A (prod): `main` branch → `www.accesdirectaide.fr`
- Projet B (staging): `staging` branch → `staging.accesdirectaide.fr`

**Avantages:**
- ✅ Séparation totale des environnements
- ✅ Redirects Vercel UI peuvent être activés uniquement sur projet prod

**Problèmes:**
- ⚠️ Déjà implémenté selon `INFRASTRUCTURE.md`
- ⚠️ Mais les Preview deployments (PR) sont attachés au projet prod
- ❌ Donc les Previews seraient quand même redirigés si redirect UI activé sur projet prod

**Verdict:** ⚠️ Partiellement déjà en place, mais ne résout pas le problème des Previews

---

## 6. RISQUES ET MITIGATION

### Risque 1: Middleware Crash

**Probabilité:** Faible
**Impact:** Critique (site inaccessible)

**Mitigation:**
- Tests approfondis en Preview avant production
- Rollback plan: `git revert` + redéploiement (< 3 min)
- Monitoring Vercel: alertes sur error rate >1%

### Risque 2: Redirect Loop

**Probabilité:** Très faible (si implémentation correcte)
**Impact:** Critique

**Mitigation:**
- Tests curl avec `-L --max-redirs 5` pour détecter loops
- Logique middleware explicite: `if (domain === 'accesdirectaide.fr')` → redirect une seule fois
- Pas de redirect si déjà sur `www.*`

### Risque 3: Latence Edge Middleware

**Probabilité:** Faible
**Impact:** Mineur (< 10ms ajouté)

**Mitigation:**
- Edge runtime Vercel optimisé (latence typique: 1-5ms)
- Matcher exclut `/api/*` (déjà dans config)
- Monitoring Vercel Analytics

### Risque 4: Conflit avec Redirect Vercel UI

**Probabilité:** Moyenne (si UI redirect pas désactivé)
**Impact:** Majeur (double redirect ou loop)

**Mitigation:**
- **Désactiver explicitement** le redirect UI dans Project Settings
- Documenter dans `INFRASTRUCTURE.md` que redirect est géré par middleware
- Test en staging avant prod

---

## 7. CHRONOLOGIE ESTIMÉE

| Phase | Tâche | Durée | Dépendances |
|-------|-------|-------|-------------|
| **Phase 1** | Audit Vercel UI settings | 15 min | - |
| | Tests comportement actuel | 15 min | - |
| | Documentation variables env | 10 min | - |
| **Phase 2** | Modification `middleware.js` | 30 min | Phase 1 |
| | Tests locaux (si possible) | 15 min | Modification |
| | Déploiement Preview | 5 min | Modification |
| | Tests Preview | 20 min | Déploiement Preview |
| | Déploiement Staging | 5 min | Tests Preview OK |
| | Tests Staging | 15 min | Déploiement Staging |
| | Merge main (prod) | 5 min | Tests Staging OK |
| | Tests Production | 20 min | Déploiement Production |
| **Phase 3** | Update documentation | 30 min | Tests Production OK |
| | Setup monitoring | 15 min | - |
| | Checklist post-deploy | 10 min | Tout |
| **TOTAL** | | **3h 30min** | |

**Note:** Durées indicatives pour une personne. Peut être parallélisé (tests pendant déploiements).

---

## 8. CONCLUSION

### Problème
Le système actuel ne distingue pas les environnements pour les redirects canoniques. Si configuré via Vercel UI, tous les environnements (y compris Preview/Staging) sont redirigés vers production, bloquant les workflows de développement.

### Solution Recommandée
**Middleware Edge conditionnel** qui:
1. Détecte le domaine production (`accesdirectaide.fr` / `www.accesdirectaide.fr`)
2. Applique redirect apex → www **uniquement** en production
3. Laisse Preview/Staging accessibles sans redirect
4. Maintient `X-Robots-Tag: noindex` sur non-production

### Avantages
- ✅ Logique centralisée dans le code (versionnée)
- ✅ Flexibilité totale (conditions, env vars)
- ✅ Performance Edge (< 5ms overhead)
- ✅ Pas de modification de l'infrastructure Vercel UI
- ✅ Testable en Preview avant production

### Livrables
1. ✅ **Analyse du problème:** Section 1
2. ✅ **Solution recommandée:** Section 3 (Middleware)
3. ✅ **Plan d'implémentation:** Section 4 (3 phases détaillées)

---

**Prochaine étape:** Valider cette approche avant implémentation.

**Contact:** Pour questions ou ajustements, se référer à `INFRASTRUCTURE.md` et `VERCEL_AUDIT.md`.
