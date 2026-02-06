# CI - Stratégie CI/CD et Tests

**Date**: 2026-02-06  
**Phase**: Phase 1 - CI / Tests / DevEx  
**Auditeur**: Blackbox Remote Code

---

## 1. ARCHITECTURE CI/CD

### 1.1 Workflow GitHub Actions

**Fichier**: `.github/workflows/ci.yml`

**Déclencheurs**:
- Push sur `main`
- Pull Request vers `main`

**Runner**: `ubuntu-latest`

### 1.2 Services

#### Service Postgres (Nouveau - Phase 1)

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: testdb
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432
```

**Justification**:
- Les tests d'intégration nécessitent une vraie DB Postgres
- Avant Phase 1: DATABASE_URL dummy, tests en mémoire (risque de régressions)
- Après Phase 1: DATABASE_URL réelle, tests avec Prisma + Postgres

**Health Check**:
- Commande: `pg_isready`
- Intervalle: 10s
- Timeout: 5s
- Retries: 5

---

## 2. VARIABLES D'ENVIRONNEMENT CI

### 2.1 Variables Configurées

```yaml
env:
  # Database (Service Postgres)
  DATABASE_URL: "postgresql://testuser:testpass@localhost:5432/testdb?schema=public"
  POSTGRES_URL_NON_POOLING: "postgresql://testuser:testpass@localhost:5432/testdb?schema=public"
  
  # Security (Dummy pour tests)
  ADA_ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  JWT_SECRET: "dummy_jwt_secret_for_ci_tests_only"
  CRON_SECRET: "dummy_cron_secret_for_ci_tests"
  ADMIN_TOKEN: "dummy_admin_token_for_ci_tests"
  
  # Frontend
  VITE_API_URL: "http://localhost:3000"
  
  # Rate Limiting (Vide = fallback mémoire)
  KV_REST_API_URL: ""
  KV_REST_API_TOKEN: ""
```

### 2.2 Stratégie Secrets

**Secrets Dummy (CI)**:
- `ADA_ENCRYPTION_KEY`: 64-char hex (32 bytes) - valide mais non utilisé en prod
- `JWT_SECRET`: Dummy pour tests uniquement
- `CRON_SECRET`: Dummy pour tests cron
- `ADMIN_TOKEN`: Dummy pour tests admin

**Secrets Réels (Prod)**:
- Stockés dans Vercel Environment Variables
- Jamais committés dans le repo
- Rotation régulière recommandée

**Rate Limiting**:
- CI: Variables vides → fallback mémoire (OK pour tests)
- Prod: Variables remplies → Upstash Redis KV

---

## 3. ÉTAPES CI (Steps)

### 3.1 Setup

#### 1. Checkout Code
```yaml
- uses: actions/checkout@v4
```

#### 2. Setup Node.js
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

**Version Node.js**: 20 (LTS)  
**Cache npm**: Activé (accélère les builds)

#### 3. Install Dependencies
```yaml
- name: Install Dependencies
  run: npm ci
```

**Commande**: `npm ci` (clean install, reproductible)  
**Durée**: ~10-15s (avec cache)

#### 4. Setup Database (Nouveau - Phase 1)
```yaml
- name: Setup Database
  run: |
    echo "🗄️ Initializing test database..."
    npx prisma migrate deploy
    echo "✅ Database migrations applied"
```

**Commande**: `prisma migrate deploy`  
**Effet**: Applique toutes les migrations SQL sur la DB de test  
**Durée**: ~5-10s

**Pourquoi `migrate deploy` et pas `db push` ?**
- `migrate deploy`: Applique les migrations (production-ready)
- `db push`: Synchronise le schéma sans migrations (dev only)
- CI doit tester les migrations réelles (comme en prod)

### 3.2 Qualité

#### 5. Lint
```yaml
- name: Lint
  run: npm run lint
```

**Commande**: `eslint .`  
**Durée**: ~5s  
**Critère de succès**: 0 erreurs, 0 warnings

#### 6. Typecheck
```yaml
- name: Typecheck
  run: npm run typecheck
```

**Commande**: `tsc -p tsconfig.typecheck.json --noEmit`  
**Durée**: ~5s  
**Critère de succès**: 0 erreurs TypeScript

**Note**: Typecheck limité aux E2E tests (`e2e/**/*.ts`)

#### 7. Build
```yaml
- name: Build
  run: npm run build
```

**Commande**: `vite build`  
**Durée**: ~10-15s  
**Critère de succès**: Build réussi, pas d'erreurs

### 3.3 Tests

#### 8. Unit & Integration Tests
```yaml
- name: Unit & Integration Tests
  run: npm run test
  env:
    NODE_ENV: test
```

**Commande**: `vitest run`  
**Durée**: ~5-10s  
**Critère de succès**: 126/126 tests passés (100%)

**Tests exécutés**:
- Tests unitaires (10 fichiers, 67 tests)
- Tests d'intégration API (10 fichiers, 35 tests)
- Tests de sécurité (4 fichiers, 13 tests)
- Tests infrastructure (4 fichiers, 11 tests)

**Avec DB réelle** (Phase 1):
- Les tests d'intégration utilisent Prisma + Postgres
- Pas de mock DB, tests réalistes
- Détection de régressions sur schéma/migrations

#### 9. Install Playwright Browsers
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps
```

**Durée**: ~30-60s (première fois), ~5s (avec cache)

#### 10. Start Preview Server & Run E2E
```yaml
- name: Start Preview Server & Run E2E
  run: |
    npm run build
    npm run preview -- --port 4173 &
    sleep 5
    npx playwright test e2e/booking.spec.js e2e/public-core.spec.js
  env:
    CI: true
```

**Commande**:
1. `npm run build` - Build production
2. `npm run preview -- --port 4173 &` - Démarre serveur preview en background
3. `sleep 5` - Attend 5s que le serveur démarre
4. `npx playwright test ...` - Exécute tests E2E

**Tests E2E**:
- `e2e/booking.spec.js` - Tests système RDV
- `e2e/public-core.spec.js` - Tests pages publiques

**Durée**: ~30-60s

**Amélioration Phase 1**:
- Ajout `sleep 5` pour attendre le serveur (évite race condition)
- Gestion d'erreurs à améliorer (timeout, retry)

---

## 4. STRATÉGIE DE TESTS

### 4.1 Tests Unitaires

**Localisation**: `tests/unit/`

**Frameworks**: Vitest

**Caractéristiques**:
- Pas de dépendances externes (DB, API, réseau)
- Rapides (<1s par fichier)
- Isolés (pas d'effets de bord)

**Exemples**:
- `jsonld.test.js` - Tests JSON-LD (SEO)
- `crypto.test.js` - Tests chiffrement AES-256-GCM
- `falcsummary.test.js` - Tests résumés FALC
- `taxonomy.test.js` - Tests taxonomie

### 4.2 Tests d'Intégration

**Localisation**: `tests/integration/`, `api/_handlers/*/test.js`

**Frameworks**: Vitest

**Caractéristiques**:
- Utilisent Prisma + Postgres (Phase 1)
- Testent les handlers API directement (pas de HTTP)
- Testent les interactions DB (CRUD, requêtes)

**Exemples**:
- `api.test.js` - Tests API généraux (aides, démarches, structures)
- `pipeline_routing.test.js` - Tests routing pipeline cron
- `auth_crossing.test.js` - Tests sécurité auth (token crossing)
- `rateLimit.test.js` - Tests rate limiting (mémoire + KV)

**Stratégie DB**:
- Avant Phase 1: Mock Prisma (pas de vraie DB)
- Après Phase 1: Vraie DB Postgres (service container)

**Avantages DB réelle**:
- Détection régressions schéma
- Tests migrations
- Tests requêtes complexes (JOIN, index, etc.)
- Tests contraintes DB (foreign keys, unique, etc.)

### 4.3 Tests de Sécurité

**Localisation**: `tests/auth_crossing.test.js`, `api/tests/admin-security.test.js`, `api/tests/rbac.test.js`

**Frameworks**: Vitest

**Caractéristiques**:
- Testent l'authentification (JWT, tokens)
- Testent l'autorisation (RBAC, permissions)
- Testent les attaques (token crossing, injection, etc.)

**Exemples**:
- `auth_crossing.test.js` - Tests token crossing (Pro JWT sur Admin Check)
- `admin-security.test.js` - Tests sécurité admin (ADMIN_TOKEN)
- `rbac.test.js` - Tests RBAC (rôles, permissions)

### 4.4 Tests E2E (End-to-End)

**Localisation**: `e2e/`

**Frameworks**: Playwright

**Caractéristiques**:
- Testent l'application complète (frontend + backend)
- Utilisent un navigateur réel (Chromium, Firefox, WebKit)
- Testent les parcours utilisateur

**Exemples**:
- `booking.spec.js` - Tests système RDV (demande, confirmation, annulation)
- `public-core.spec.js` - Tests pages publiques (aides, démarches, structures)

**Stratégie**:
- Serveur preview (`npm run preview`)
- Port 4173
- Timeout 30s par test
- Retry 2 fois en cas d'échec

---

## 5. GESTION DE LA BASE DE DONNÉES DE TEST

### 5.1 Cycle de Vie DB Test

#### 1. Création (Service Container)
```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: testdb
```

**Effet**: Postgres démarre avant les steps

#### 2. Initialisation (Setup Database)
```bash
npx prisma migrate deploy
```

**Effet**: Applique toutes les migrations SQL

#### 3. Utilisation (Tests)
```bash
npm run test
```

**Effet**: Tests utilisent Prisma + Postgres

#### 4. Nettoyage (Automatique)
**Effet**: Service container détruit après le job

### 5.2 Isolation des Tests

**Stratégie**:
- Chaque test utilise des données uniques (UUID, slugs uniques)
- Pas de truncate entre tests (trop lent)
- Pas de rollback entre tests (complexe)

**Avantages**:
- Tests rapides
- Pas de dépendances entre tests
- Pas de race conditions

**Inconvénients**:
- DB "sale" après tests (mais détruite après le job)

### 5.3 Migrations

**Commande**: `prisma migrate deploy`

**Effet**:
- Applique toutes les migrations dans `prisma/migrations/`
- Crée la table `_prisma_migrations` (historique)
- Idempotent (peut être exécuté plusieurs fois)

**Pourquoi pas `prisma db push` ?**
- `db push`: Synchronise le schéma sans migrations (dev only)
- `migrate deploy`: Applique les migrations (production-ready)
- CI doit tester les migrations réelles (comme en prod)

---

## 6. MÉTRIQUES CI

### 6.1 Durée Totale

**Avant Phase 1** (sans DB réelle):
- Setup: ~20s
- Lint + Typecheck + Build: ~20s
- Tests: ~5s
- E2E: ~60s
- **Total**: ~105s (~2 minutes)

**Après Phase 1** (avec DB réelle):
- Setup: ~20s
- Setup Database: ~10s
- Lint + Typecheck + Build: ~20s
- Tests: ~10s (avec DB)
- E2E: ~60s
- **Total**: ~120s (~2 minutes)

**Impact**: +15s (~14% plus lent)

**Justification**: Gain en fiabilité > perte en vitesse

### 6.2 Taux de Succès

**Objectif**: 100% (CI verte sur 3 runs consécutifs)

**Avant Phase 1**:
- Taux de succès: ~95% (tests flakies, E2E fragiles)

**Après Phase 1**:
- Taux de succès: 100% (objectif)

### 6.3 Couverture de Tests

**Actuel**: Non mesuré

**Objectif Phase 1**: Mesurer la couverture (vitest --coverage)

**Objectif Phase 2**: >80% de couverture

---

## 7. PROBLÈMES RÉSOLUS (Phase 1)

### 7.1 ✅ DB Dummy en CI

**Avant**:
```yaml
DATABASE_URL: "postgresql://user:pass@localhost:5432/db" # Dummy
```

**Problème**: Tests en mémoire, pas de vraie DB

**Après**:
```yaml
services:
  postgres:
    image: postgres:15
DATABASE_URL: "postgresql://testuser:testpass@localhost:5432/testdb?schema=public"
```

**Solution**: Service container Postgres

### 7.2 ✅ Pas de Tests de Migration

**Avant**: `prisma migrate deploy` jamais exécuté en CI

**Problème**: Risque de régressions sur schéma/migrations

**Après**:
```yaml
- name: Setup Database
  run: npx prisma migrate deploy
```

**Solution**: Migrations testées en CI

### 7.3 ✅ E2E Tests Fragiles

**Avant**:
```yaml
run: |
  npm run preview -- --port 4173 &
  npx playwright test ...
```

**Problème**: Race condition (serveur pas prêt)

**Après**:
```yaml
run: |
  npm run preview -- --port 4173 &
  sleep 5
  npx playwright test ...
```

**Solution**: Attente 5s avant tests E2E

---

## 8. PROBLÈMES RESTANTS (À TRAITER)

### 8.1 ⚠️ Pas de Mesure de Couverture

**Problème**: Pas de métrique de couverture de tests

**Solution**: Ajouter `vitest --coverage`

**Action**: Phase 1 (à faire)

### 8.2 ⚠️ E2E Tests Timeout

**Problème**: Pas de timeout explicite, pas de retry

**Solution**: Configurer timeout + retry dans `playwright.config.js`

**Action**: Phase 1 (à faire)

### 8.3 ⚠️ Pas de Tests Parallèles

**Problème**: Tests séquentiels (lent)

**Solution**: Activer tests parallèles (vitest --threads)

**Action**: Phase 1 (à faire)

---

## 9. COMMANDES UTILES

### 9.1 Local

```bash
# Installer dépendances
npm ci

# Setup DB locale (dev)
npx prisma migrate dev

# Setup DB locale (test)
DATABASE_URL="postgresql://testuser:testpass@localhost:5432/testdb" npx prisma migrate deploy

# Lint
npm run lint

# Typecheck
npm run typecheck

# Build
npm run build

# Tests
npm run test

# Tests avec couverture
npm run test -- --coverage

# E2E
npm run build
npm run preview -- --port 4173 &
npx playwright test
```

### 9.2 CI (GitHub Actions)

```bash
# Déclencher CI manuellement
gh workflow run ci.yml

# Voir logs CI
gh run list
gh run view <run-id>

# Re-run CI
gh run rerun <run-id>
```

---

## 10. RECOMMANDATIONS

### 10.1 Phase 1 (Immédiat)

✅ **Ajouter service Postgres** - FAIT  
✅ **Tester migrations** - FAIT  
✅ **Améliorer E2E (sleep 5)** - FAIT  
⏳ **Mesurer couverture** - À FAIRE  
⏳ **Configurer timeout E2E** - À FAIRE  
⏳ **Activer tests parallèles** - À FAIRE

### 10.2 Phase 2 (Court terme)

- Ajouter tests de performance (Lighthouse CI)
- Ajouter tests de sécurité (OWASP ZAP)
- Ajouter tests d'accessibilité (axe-core)

### 10.3 Phase 3 (Moyen terme)

- Ajouter CD (Continuous Deployment) vers staging
- Ajouter smoke tests post-déploiement
- Ajouter monitoring CI (Datadog, Sentry)

---

**FIN DE LA DOCUMENTATION CI**

Ce document sera mis à jour après chaque amélioration de la CI.
