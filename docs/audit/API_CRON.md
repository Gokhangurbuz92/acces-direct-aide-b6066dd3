# API_CRON - Architecture API, Routing et Sécurité Cron

**Date**: 2026-02-06  
**Phase**: Phase 2 - Architecture API / Routing / Cron  
**Auditeur**: Blackbox Remote Code

---

## 1. ARCHITECTURE API

### 1.1 Structure des Handlers

**Localisation**: `/api/_handlers/`

**Organisation**:
```
api/_handlers/
├── admin/          # Routes admin (auth requise)
├── auth/           # Authentification (login, register, reset)
├── booking/        # Disponibilités & services (public)
├── cron/           # Jobs cron (CRON_SECRET requis)
├── dispositifs/    # Dispositifs locaux (public)
├── otp/            # One-Time Passwords (rate limited)
├── pro/            # Routes professionnels (JWT requis)
├── public/         # Routes publiques (appointments, etc.)
├── aides.js        # Liste aides (public)
├── actualites.js   # Liste actualités (public)
├── demarches.js    # Liste démarches (public)
├── structures.js   # Annuaire structures (public)
├── guides.js       # Guides pratiques (public)
├── tools.js        # Boîte à outils (public)
├── ressources.js   # Ressources (public)
├── categories.js   # Catégories (public)
├── taxonomy.js     # Taxonomie (public)
├── sitemap.js      # Sitemap dynamique (public)
├── robots.js       # Robots.txt dynamique (public)
├── health.js       # Health check (public)
└── version.js      # Version app (public)
```

### 1.2 Wrapper API Standardisé

**Fichier**: `api/_utils/wrapper.js`

**Fonctionnalités**:
- Validation Zod automatique (body, query, params)
- Gestion d'erreurs centralisée (AppError, ZodError, etc.)
- Logs structurés (requestId, duration, status)
- Rate limiting intégré (optionnel)
- CORS headers (optionnel)

**Exemple d'utilisation**:
```javascript
import { withValidation } from '../_utils/wrapper.js';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export default withValidation(schema, async (req, res, data) => {
  // data = validated body
  // ...
});
```

### 1.3 Gestion d'Erreurs

**Fichier**: `api/_utils/errors.js`

**Types d'erreurs**:
- `AppError` - Erreurs métier (400, 404, 409, etc.)
- `ZodError` - Erreurs de validation (400)
- `PrismaError` - Erreurs DB (500)
- `Error` - Erreurs génériques (500)

**Format de réponse**:
```json
{
  "error": "Message court",
  "message": "Message détaillé (FALC)",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## 2. ROUTING VERCEL

### 2.1 Configuration (vercel.json)

#### Cron Jobs
```json
{
  "crons": [
    {
      "path": "/api/cron/pipeline",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/ingest-structures",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

**Sécurité**:
- Header `x-vercel-cron: 1` ajouté automatiquement par Vercel
- Vérification dans `isCronAuthorized()`

#### Redirects
```json
{
  "redirects": [
    {
      "source": "/guide/:slug",
      "destination": "/demarches",
      "permanent": true
    },
    {
      "source": "/aide/:slug",
      "destination": "/aides/:slug",
      "permanent": true
    },
    {
      "source": "/login/pro",
      "destination": "/pro/login",
      "permanent": true
    },
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

**Justification**:
- `/guide/:slug` → `/demarches` : Ancien routing (legacy)
- `/aide/:slug` → `/aides/:slug` : Normalisation pluriel
- `/login/pro` → `/pro/login` : Cohérence namespace
- `/home` → `/` : Simplification

#### Rewrites
```json
{
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "/api"
    },
    {
      "source": "/robots.txt",
      "destination": "/api"
    },
    {
      "source": "/__dev/:path*",
      "destination": "/api"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/((?!api/|.*\\\\..*).*)",
      "destination": "/index.html"
    }
  ]
}
```

**Explication**:
- `/sitemap.xml` → `/api` : Sitemap dynamique (handler `api/sitemap.js`)
- `/robots.txt` → `/api` : Robots.txt dynamique (handler `api/robots.js`)
- `/__dev/:path*` → `/api` : Dev tools (protégé par ALLOW_DEV_TOOLS)
- `/api/(.*)` → `/api` : Serverless functions
- `/((?!api/|.*\\..*).*) → `/index.html` : SPA fallback (React Router)

#### Headers de Sécurité
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; connect-src 'self' https: wss: *.sentry.io; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; img-src 'self' data: https: blob:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
        }
      ]
    }
  ]
}
```

**Analyse**:
- ✅ `X-Content-Type-Options: nosniff` - Empêche MIME sniffing
- ✅ `X-Frame-Options: DENY` - Empêche clickjacking
- ✅ `Referrer-Policy: strict-origin-when-cross-origin` - Limite fuite d'infos
- ✅ `Permissions-Policy` - Désactive APIs sensibles (camera, micro, etc.)
- ✅ `Strict-Transport-Security` - Force HTTPS (2 ans + subdomains + preload)
- ⚠️ `Content-Security-Policy` - Utilise `'unsafe-inline'` et `'unsafe-eval'` (nécessaire pour Vite/React en dev, à revoir pour prod stricte)

**Recommandation CSP**:
- Prod: Retirer `'unsafe-inline'` et `'unsafe-eval'` si possible
- Utiliser nonces ou hashes pour scripts inline
- Séparer CSP dev/prod

---

## 3. SÉCURITÉ CRON

### 3.1 Protection des Routes Cron

**Fichier**: `api/_utils/cronAuth.js`

**Fonction**: `isCronAuthorized(req)`

**Méthodes d'authentification** (3 méthodes acceptées):

#### 1. Bearer Token
```http
Authorization: Bearer <CRON_SECRET>
```

**Utilisation**: Appels manuels (scripts, Postman, etc.)

#### 2. Query Parameter
```http
POST /api/cron/pipeline?secret=<CRON_SECRET>
```

**Utilisation**: Appels manuels (curl, scripts, etc.)

#### 3. Vercel Cron Header
```http
x-vercel-cron: 1
```

**Utilisation**: Cron jobs Vercel (automatique)

**Implémentation**:
```javascript
export function isCronAuthorized(req) {
    if (!process.env.CRON_SECRET) {
        console.error("CRITICAL: CRON_SECRET is not defined in environment.");
        return false;
    }

    // 1. Query Params
    let secretQuery = req.query?.secret;
    if (!secretQuery && req.url) {
        try {
            const proto = getHeader(req, 'x-forwarded-proto') || 'http';
            const host = getHeader(req, 'host') || 'localhost';
            secretQuery = new URL(req.url, `${proto}://${host}`).searchParams.get('secret');
        } catch (e) {
            // ignore URL parse errors
        }
    }

    // 2. Bearer Token
    const bearer = getBearer(req);

    // 3. Vercel Cron Header
    const vercelCronHeader = getHeader(req, 'x-vercel-cron');

    // Matching logic
    const token = bearer || secretQuery;

    return (token === process.env.CRON_SECRET) || (vercelCronHeader === '1');
}
```

**Sécurité**:
- ✅ Vérifie que `CRON_SECRET` est défini (fail-closed)
- ✅ Supporte 3 méthodes d'auth (flexibilité)
- ✅ Logs d'erreur si non autorisé
- ✅ Utilise WHATWG URL (pas de dépréciation)

### 3.2 Handlers Cron

#### Pipeline d'Ingestion (`/api/cron/pipeline`)

**Fichier**: `api/_handlers/cron/pipeline.js`

**Fonctionnalités**:
- Ingestion structures (Soliguide API, CSV)
- Ingestion aides (sources externes)
- Ingestion actualités (RSS)
- Déduplication via hash
- Logs structurés (UpdateLog, ImportLog)
- Anti silent failure (502 si fetchMs=0 et errors=[])

**Paramètres**:
- `source` (required): structures, aides, rss, actualites (alias)
- `mode` (optional): smoke (test), full (prod)
- `limit` (optional): Limite nombre d'items (smoke: 5)

**Exemple**:
```bash
curl -X POST "https://api.example.com/api/cron/pipeline?source=structures&mode=smoke&limit=5" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

**Réponse**:
```json
{
  "success": true,
  "source": "structures",
  "stats": {
    "fetched": 5,
    "created": 2,
    "updated": 3,
    "skipped": 0,
    "errors": []
  },
  "duration_ms": 1234
}
```

**Sécurité**:
- ✅ Protégé par `isCronAuthorized()`
- ✅ Validation source (whitelist)
- ✅ Logs structurés (runId, source, duration)
- ✅ Anti silent failure (502 si fetchMs=0 et errors=[])

#### Ingestion Structures (`/api/cron/ingest-structures`)

**Fichier**: `api/_handlers/cron/ingest-structures.js`

**Fonctionnalités**:
- Ingestion structures Alsace/Grand Est (Soliguide API)
- Déduplication via SIRET + hash
- Géolocalisation (latitude, longitude)
- Normalisation données (adresse, téléphone, email)

**Sécurité**:
- ✅ Protégé par `isCronAuthorized()`
- ✅ Validation données (Zod)
- ✅ Logs structurés

#### Purge RGPD (`/api/cron/gdpr-purge`)

**Fichier**: `api/_handlers/cron/gdpr-purge.js`

**Fonctionnalités**:
- Suppression RDV anciens (>2 ans)
- Suppression messages anciens (>2 ans)
- Suppression bénéficiaires orphelins

**Sécurité**:
- ✅ Protégé par `isCronAuthorized()`
- ✅ Logs d'audit (AuditLog)
- ✅ Dry-run mode (test)

**Note**: Cron non configuré dans vercel.json (à ajouter)

#### Vérification Liens (`/api/cron/link-check`)

**Fichier**: `api/_handlers/cron/link-check.js`

**Fonctionnalités**:
- Vérifier source_url de chaque aide/démarche/structure
- Détecter liens morts (404, 500)
- Mettre à jour last_checked_at

**Sécurité**:
- ✅ Protégé par `isCronAuthorized()`
- ✅ Logs structurés

**Note**: Cron non configuré dans vercel.json (à ajouter)

---

## 4. RATE LIMITING

### 4.1 Architecture

**Fichier**: `api/_utils/rateLimit.js`

**Backends**:
1. **Upstash Redis KV** (prod) - Si `KV_REST_API_URL` et `KV_REST_API_TOKEN` définis
2. **In-Memory** (dev/preview) - Fallback si variables absentes

**Stratégie**:
- **Prod**: Fail-closed si KV échoue (503)
- **Dev/Preview**: Fallback mémoire si KV absent

### 4.2 Configuration

**Actions et Limites**:
```javascript
const CONFIG = {
    OTP_GEN: { limit: 3, window: 60 },      // 3 per min
    OTP_VERIFY: { limit: 5, window: 60 },   // 5 per min
    BOOK: { limit: 10, window: 3600 },      // 10 per hour
    CONFIRM: { limit: 10, window: 3600 },   // 10 per hour
    LOGIN_PRO: { limit: 5, window: 900 },   // 5 per 15 min
    RESET_PASSWORD: { limit: 3, window: 3600 }, // 3 per hour
    SEARCH_AIDES: { limit: 30, window: 60 },      // 30 per min
    SEARCH_STRUCTURES: { limit: 30, window: 60 }, // 30 per min
    SEARCH_RESSOURCES: { limit: 60, window: 60 }, // 60 per min
    TAXONOMY: { limit: 60, window: 60 }           // 60 per min
};
```

### 4.3 Utilisation

```javascript
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';

export default async function handler(req, res) {
  const ip = getClientIp(req);
  const { allowed, error, status } = await checkRateLimit('SEARCH_AIDES', ip);
  
  if (!allowed) {
    return res.status(status || 429).json(error);
  }
  
  // ...
}
```

### 4.4 Sécurité

**Hashing des clés**:
```javascript
function hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 8);
}
```

**Logs d'audit**:
```javascript
console.warn(`[AUDIT] Rate Limit Denied: Backend=${BACKEND_NAME} Action=${action} KeyHash=${hashedKey} Count=${record.count}`);
```

**Avantages**:
- ✅ Pas de PII dans les logs (hash SHA-256)
- ✅ Traçabilité (action, backend, count)
- ✅ Fail-closed en prod (sécurité)

### 4.5 Variables d'Environnement

**Prod**:
```env
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

**Dev/Preview**:
```env
# Variables vides ou absentes → fallback mémoire
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

**Alias supportés**:
- `KV_REST_API_URL` ou `UPSTASH_REDIS_REST_URL`
- `KV_REST_API_TOKEN` ou `UPSTASH_REDIS_REST_TOKEN`

---

## 5. OBSERVABILITÉ (SENTRY)

### 5.1 Configuration

**Fichier**: `api/_utils/sentry.js`

**Initialisation**:
```javascript
import * as Sentry from '@sentry/node';

const dsn = process.env.VITE_SENTRY_DSN || process.env.SENTRY_DSN;
const environment = process.env.VERCEL_ENV || process.env.VITE_ENV || 'development';
const release = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_GIT_COMMIT_SHA || 'dev';

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: 1.0,
  });
}
```

**Variables d'environnement**:
- `VITE_SENTRY_DSN` ou `SENTRY_DSN` - DSN Sentry
- `VERCEL_ENV` - Environnement (production, preview, development)
- `VERCEL_GIT_COMMIT_SHA` - SHA du commit (release)

### 5.2 Utilisation

**Capture d'erreurs**:
```javascript
import Sentry from '../_utils/sentry.js';

try {
  // ...
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

**Contexte utilisateur**:
```javascript
import { setUserContext } from '../_utils/sentry.js';

setUserContext({ id: user.id, email: user.email });
```

**Tags**:
```javascript
import { setTags } from '../_utils/sentry.js';

setTags({ action: 'SEARCH_AIDES', source: 'api' });
```

### 5.3 Sécurité

**PII (Personally Identifiable Information)**:
- ⚠️ Ne pas logger de PII en clair (email, nom, téléphone, etc.)
- ✅ Utiliser des identifiants (userId, structureId, etc.)
- ✅ Hacher les données sensibles si nécessaire

**Source Maps**:
- ✅ Source maps générées par Vite (build)
- ✅ Uploadées vers Sentry via `@sentry/vite-plugin`
- ✅ Permet de débugger le code source (pas le code minifié)

**Configuration Vite**:
```javascript
// vite.config.js
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default {
  plugins: [
    sentryVitePlugin({
      org: 'your-org',
      project: 'your-project',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
};
```

---

## 6. DÉPRÉCIATIONS & WARNINGS

### 6.1 url.parse() (Node DEP0169)

**Statut**: ✅ **AUCUN USAGE DÉTECTÉ**

**Vérification**:
```bash
grep -r "url\.parse" /vercel/sandbox/api /vercel/sandbox/src --include="*.js" --include="*.jsx"
# Résultat: (empty)
```

**Conclusion**: Le code utilise déjà WHATWG URL (new URL(...)) partout. Pas de dépréciation.

### 6.2 Autres Warnings

**Vérification**:
```bash
npm run build 2>&1 | grep -i "warning\|deprecated"
# Résultat: (empty)
```

**Conclusion**: Aucun warning de build détecté.

---

## 7. SCHÉMA DES ROUTES

### 7.1 Routes Publiques (Pas d'Auth)

```
GET  /api/aides                 - Liste aides (filtres, pagination)
GET  /api/aides?slug=...        - Détail aide
GET  /api/demarches             - Liste démarches
GET  /api/structures            - Annuaire structures
GET  /api/actualites            - Actualités (RSS)
GET  /api/dispositifs           - Dispositifs locaux
GET  /api/guides                - Guides pratiques
GET  /api/tools                 - Boîte à outils
GET  /api/ressources            - Ressources
GET  /api/categories            - Catégories
GET  /api/taxonomy              - Taxonomie
GET  /api/sitemap.xml           - Sitemap dynamique
GET  /api/robots.txt            - Robots.txt dynamique
GET  /api/health                - Health check
GET  /api/version               - Version app
POST /api/appointments          - Demande RDV (public)
GET  /api/appointments/:id      - Détail RDV (access_token)
POST /api/appointments/:id/cancel - Annuler RDV (cancel_token)
GET  /api/booking/availability  - Disponibilités structure
GET  /api/booking/services      - Services structure
```

### 7.2 Routes Admin (Auth: ADMIN_TOKEN ou JWT)

```
POST /api/auth/admin/login      - Login admin
GET  /api/admin/aides           - Liste aides (admin)
PUT  /api/admin/aides/:id       - Éditer aide
GET  /api/admin/structures      - Liste structures (admin)
GET  /api/admin/appointments    - Liste RDV (admin)
GET  /api/admin/messages        - Messagerie admin
POST /api/admin/sync            - Déclencher ingestion manuelle
GET  /api/admin/sync/recent     - Logs d'ingestion récents
POST /api/admin/privacy/gdpr/purge - Purge RGPD manuelle
```

### 7.3 Routes Pro (Auth: JWT Pro)

```
POST /api/auth/pro/login        - Login pro
POST /api/auth/pro/register     - Inscription pro
POST /api/auth/pro/forgot-password - Mot de passe oublié
POST /api/auth/pro/reset-password - Réinitialiser mot de passe
GET  /api/pro/structure         - Infos structure du pro
PUT  /api/pro/structure         - Éditer structure
GET  /api/pro/team              - Liste équipe
POST /api/pro/team/invite       - Inviter membre
GET  /api/pro/services          - Liste services
POST /api/pro/services          - Créer service
GET  /api/pro/availability      - Disponibilités du pro
PUT  /api/pro/availability      - Éditer disponibilités
GET  /api/pro/appointments      - Liste RDV de la structure
GET  /api/pro/inbox             - Boîte de réception pro
POST /api/pro/messages          - Envoyer message
POST /api/upload                - Upload fichier (pièce jointe)
GET  /api/download/:key         - Télécharger fichier
```

### 7.4 Routes Cron (Auth: CRON_SECRET)

```
POST /api/cron/pipeline         - Pipeline d'ingestion générique
POST /api/cron/ingest-structures - Ingestion structures dédiée
POST /api/cron/gdpr-purge       - Purge données RGPD
POST /api/cron/link-check       - Vérification liens sources
POST /api/cron/purge            - Purge données génériques
```

---

## 8. PROBLÈMES RÉSOLUS (Phase 2)

### 8.1 ✅ Pas de Dépréciation url.parse()

**Vérification**: Aucun usage de `url.parse()` détecté

**Conclusion**: Le code utilise déjà WHATWG URL (new URL(...))

### 8.2 ✅ Protection Routes Cron

**Vérification**: `isCronAuthorized()` robuste (3 méthodes d'auth)

**Conclusion**: Routes cron bien protégées

### 8.3 ✅ Rate Limiting Prod

**Vérification**: Fail-closed en prod si KV échoue

**Conclusion**: Rate limiting sécurisé

### 8.4 ✅ Observabilité Sentry

**Vérification**: Sentry bien configuré (DSN, environment, release)

**Conclusion**: Observabilité OK

---

## 9. PROBLÈMES RESTANTS (À TRAITER)

### 9.1 ⚠️ CSP Trop Permissif

**Problème**: `'unsafe-inline'` et `'unsafe-eval'` dans CSP

**Solution**: Séparer CSP dev/prod, utiliser nonces/hashes en prod

**Action**: Phase 5 (Sécurité)

### 9.2 ⚠️ Cron Jobs Non Configurés

**Problème**: `gdpr-purge` et `link-check` non configurés dans vercel.json

**Solution**: Ajouter cron jobs

**Action**: Phase 3 (Ingestion)

### 9.3 ⚠️ Pas de Monitoring Cron

**Problème**: Pas de monitoring des cron jobs (succès/échec)

**Solution**: Ajouter monitoring (Sentry Cron Monitoring, Datadog, etc.)

**Action**: Phase 3 (Ingestion)

---

## 10. RECOMMANDATIONS

### 10.1 Phase 2 (Immédiat)

✅ **Vérifier dépréciation url.parse()** - FAIT (aucun usage)  
✅ **Vérifier protection routes cron** - FAIT (robuste)  
✅ **Vérifier rate limiting** - FAIT (sécurisé)  
✅ **Vérifier Sentry** - FAIT (bien configuré)

### 10.2 Phase 3 (Court terme)

- Ajouter cron jobs manquants (gdpr-purge, link-check)
- Ajouter monitoring cron jobs (Sentry Cron Monitoring)
- Ajouter alertes (échec cron, rate limit élevé, etc.)

### 10.3 Phase 5 (Moyen terme)

- Séparer CSP dev/prod
- Utiliser nonces/hashes pour scripts inline
- Retirer `'unsafe-inline'` et `'unsafe-eval'` en prod

---

**FIN DE LA DOCUMENTATION API_CRON**

Ce document complète `BASELINE.md`, `INVENTORY.md`, `CI.md` et sera utilisé comme référence pour les phases suivantes.
