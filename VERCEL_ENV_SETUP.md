# 🚀 CONFIGURATION DES VARIABLES D'ENVIRONNEMENT VERCEL

**Date:** 7 février 2026  
**Projet:** AccesDirectAide  
**Statut:** ✅ Prêt pour configuration

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Variables obligatoires](#variables-obligatoires)
3. [Variables optionnelles](#variables-optionnelles)
4. [Instructions de configuration Vercel](#instructions-de-configuration-vercel)
5. [Vérification post-configuration](#vérification-post-configuration)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 VUE D'ENSEMBLE

### ⚠️ PROBLÈME CRITIQUE IDENTIFIÉ

**Les URLs PostgreSQL fournies contiennent un ESPACE après le mot de passe:**

```
❌ INCORRECT: npg_xXADTwi7o4RC @ep-summer-cloud...
                            ↑ ESPACE ICI
✅ CORRECT:   npg_xXADTwi7o4RC@ep-summer-cloud...
```

**Cet espace empêche la connexion à la base de données.**  
Toutes les URLs ci-dessous ont été **corrigées** (espace supprimé).

### 📊 Résumé des variables

| Catégorie | Nombre | Statut |
|-----------|--------|--------|
| **Database** | 4 | ✅ Fournies (corrigées) |
| **Security** | 3 | ✅ Fournies |
| **Upstash KV** | 5 | ✅ Fournies |
| **Sentry** | 1 | ✅ Fournie |
| **Site Config** | 1 | ⚠️ À vérifier |
| **Admin** | 1 | ❌ Manquante (optionnelle) |
| **TOTAL** | **15** | **14/15 OK** |

---

## 🔴 VARIABLES OBLIGATOIRES

### 1️⃣ DATABASE (PostgreSQL via Neon)

#### Production & Preview

```bash
# URL poolée (utilisée par Prisma par défaut)
DATABASE_URL="postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# URL non-poolée (pour migrations et opérations directes)
POSTGRES_URL_NON_POOLING="postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# Alias Prisma (même valeur que DATABASE_URL)
POSTGRES_PRISMA_URL="postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Alias unpooled (même valeur que POSTGRES_URL_NON_POOLING)
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
```

**Environnements Vercel:** Production, Preview

#### Development (optionnel)

```bash
DATABASE_URL="postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-crimson-night-ag7jy3cm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

POSTGRES_URL_NON_POOLING="postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-crimson-night-ag7jy3cm.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

POSTGRES_PRISMA_URL="postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-crimson-night-ag7jy3cm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-crimson-night-ag7jy3cm.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
```

**Environnement Vercel:** Development

---

### 2️⃣ SECURITY & AUTHENTICATION

```bash
# JWT Secret (pour l'authentification des tokens)
JWT_SECRET="8062cf60f7e2ae245a9d0767f3f7a1418cf7ef94352d8c4bc58e2253c1ceb904"

# ADA Encryption Key (pour le chiffrement AES-256-GCM)
ADA_ENCRYPTION_KEY="113d10632a14300d8870da6783a427e45986e0f9e60de51627279243aff086d2"

# Cron Secret (pour sécuriser les endpoints cron)
CRON_SECRET="756709f776f7146e4aa8ba541f533f8265499e8392f0ef0c66efaba9ec12a1f5"
```

**Environnements Vercel:** Production, Preview, Development

---

### 3️⃣ UPSTASH KV (Redis - Rate Limiting)

```bash
# URLs REST API
KV_REST_API_URL="https://great-kite-60758.upstash.io"
KV_REST_API_TOKEN="Ae1WAAIncDFkNmE3NzVkN2MyMDc0NTg2OTE5ODE1ZTI2MWEzMzVhZHAxNjA3NTg"

# Alias Upstash (mêmes valeurs)
UPSTASH_KV_KV_REST_API_URL="https://great-kite-60758.upstash.io"
UPSTASH_KV_KV_REST_API_TOKEN="Ae1WAAIncDFkNmE3NzVkN2MyMDc0NTg2OTE5ODE1ZTI2MWEzMzVhZHAxNjA3NTg"

# Token read-only (optionnel)
UPSTASH_KV_KV_REST_API_READ_ONLY_TOKEN="Au1WAAIgcDGeeKJ7AsJ37WIG6SgZItHrcOlJMZpId83p2Ewguq_dag"

# URLs Redis (format rediss://)
UPSTASH_KV_REDIS_URL="rediss://default:Ae1WAAIncDFkNmE3NzVkN2MyMDc0NTg2OTE5ODE1ZTI2MWEzMzVhZHAxNjA3NTg@great-kite-60758.upstash.io:6379"
UPSTASH_KV_KV_URL="rediss://default:Ae1WAAIncDFkNmE3NzVkN2MyMDc0NTg2OTE5ODE1ZTI2MWEzMzVhZHAxNjA3NTg@great-kite-60758.upstash.io:6379"
```

**Environnements Vercel:** Production, Preview, Development

---

### 4️⃣ SENTRY (Monitoring & Error Tracking)

```bash
# DSN Sentry (pour le frontend Vite)
VITE_SENTRY_DSN="https://a1f0f2001361095c45e2cc24d5d38fc7@o4509125147361280.ingest.de.sentry.io/4509125158371408"
```

**Environnements Vercel:** Production, Preview

---

## 🟡 VARIABLES OPTIONNELLES

### 5️⃣ SITE CONFIGURATION

```bash
# URL de base du site (pour les liens canoniques, sitemap, etc.)
PUBLIC_BASE_URL="https://www.accesdirectaide.fr"
```

**Environnements Vercel:** Production, Preview

**⚠️ À vérifier:** Cette URL est-elle correcte pour votre domaine de production ?

---

### 6️⃣ ADMIN & AUTOMATION

```bash
# Token admin pour l'API (MANQUANT - à générer si nécessaire)
# ADMIN_TOKEN="your-admin-token-for-api-auth"

# Secret pour bypass automation (MANQUANT - optionnel)
# BYPASS_SECRET="optional-automation-bypass-secret"
```

**Statut:** ❌ Non fournies  
**Impact:** Fonctionnalités d'administration limitées  
**Action:** Générer si nécessaire avec `openssl rand -hex 32`

---

## 🛠️ INSTRUCTIONS DE CONFIGURATION VERCEL

### Étape 1: Accéder aux paramètres

1. Connectez-vous à [Vercel Dashboard](https://vercel.com)
2. Sélectionnez votre projet **AccesDirectAide**
3. Allez dans **Settings** → **Environment Variables**

### Étape 2: Ajouter les variables (Production & Preview)

Pour chaque variable ci-dessous, cliquez sur **Add New** et remplissez:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | ✅ Production, ✅ Preview |
| `POSTGRES_URL_NON_POOLING` | `postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require` | ✅ Production, ✅ Preview |
| `POSTGRES_PRISMA_URL` | `postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | ✅ Production, ✅ Preview |
| `DATABASE_URL_UNPOOLED` | `postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require` | ✅ Production, ✅ Preview |
| `JWT_SECRET` | `8062cf60f7e2ae245a9d0767f3f7a1418cf7ef94352d8c4bc58e2253c1ceb904` | ✅ Production, ✅ Preview, ✅ Development |
| `ADA_ENCRYPTION_KEY` | `113d10632a14300d8870da6783a427e45986e0f9e60de51627279243aff086d2` | ✅ Production, ✅ Preview, ✅ Development |
| `CRON_SECRET` | `756709f776f7146e4aa8ba541f533f8265499e8392f0ef0c66efaba9ec12a1f5` | ✅ Production, ✅ Preview, ✅ Development |
| `KV_REST_API_URL` | `https://great-kite-60758.upstash.io` | ✅ Production, ✅ Preview, ✅ Development |
| `KV_REST_API_TOKEN` | `Ae1WAAIncDFkNmE3NzVkN2MyMDc0NTg2OTE5ODE1ZTI2MWEzMzVhZHAxNjA3NTg` | ✅ Production, ✅ Preview, ✅ Development |
| `UPSTASH_KV_KV_REST_API_URL` | `https://great-kite-60758.upstash.io` | ✅ Production, ✅ Preview, ✅ Development |
| `UPSTASH_KV_KV_REST_API_TOKEN` | `Ae1WAAIncDFkNmE3NzVkN2MyMDc0NTg2OTE5ODE1ZTI2MWEzMzVhZHAxNjA3NTg` | ✅ Production, ✅ Preview, ✅ Development |
| `UPSTASH_KV_KV_REST_API_READ_ONLY_TOKEN` | `Au1WAAIgcDGeeKJ7AsJ37WIG6SgZItHrcOlJMZpId83p2Ewguq_dag` | ✅ Production, ✅ Preview, ✅ Development |
| `UPSTASH_KV_REDIS_URL` | `rediss://default:Ae1WAAIncDFkNmE3NzVkN2MyMDc0NTg2OTE5ODE1ZTI2MWEzMzVhZHAxNjA3NTg@great-kite-60758.upstash.io:6379` | ✅ Production, ✅ Preview, ✅ Development |
| `UPSTASH_KV_KV_URL` | `rediss://default:Ae1WAAIncDFkNmE3NzVkN2MyMDc0NTg2OTE5ODE1ZTI2MWEzMzVhZHAxNjA3NTg@great-kite-60758.upstash.io:6379` | ✅ Production, ✅ Preview, ✅ Development |
| `VITE_SENTRY_DSN` | `https://a1f0f2001361095c45e2cc24d5d38fc7@o4509125147361280.ingest.de.sentry.io/4509125158371408` | ✅ Production, ✅ Preview |
| `PUBLIC_BASE_URL` | `https://www.accesdirectaide.fr` | ✅ Production, ✅ Preview |

### Étape 3: Ajouter les variables Development (optionnel)

Si vous souhaitez utiliser une base de données différente pour le développement local:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-crimson-night-ag7jy3cm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require` | ✅ Development |
| `POSTGRES_URL_NON_POOLING` | `postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-crimson-night-ag7jy3cm.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require` | ✅ Development |
| `POSTGRES_PRISMA_URL` | `postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-crimson-night-ag7jy3cm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require` | ✅ Development |
| `DATABASE_URL_UNPOOLED` | `postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-crimson-night-ag7jy3cm.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require` | ✅ Development |

### Étape 4: Sauvegarder

Cliquez sur **Save** pour chaque variable ajoutée.

---

## ✅ VÉRIFICATION POST-CONFIGURATION

### 1. Vérifier les variables dans Vercel

1. Allez dans **Settings** → **Environment Variables**
2. Vérifiez que toutes les variables sont présentes
3. Vérifiez les environnements sélectionnés (Production, Preview, Development)

### 2. Redéployer le projet

1. Allez dans **Deployments**
2. Cliquez sur **Redeploy** pour le dernier déploiement
3. Attendez la fin du build

### 3. Tester la connexion DB

Utilisez le script de diagnostic fourni:

```bash
# Depuis votre machine locale
npm run test:db:prod
```

**Résultat attendu:**
```
✅ Connexion réussie à la base de données
✅ X aides publiées
✅ X structures publiées
✅ X actualités publiées
```

### 4. Vérifier les logs Vercel

1. Allez dans **Deployments** → Sélectionnez le dernier déploiement
2. Cliquez sur **View Function Logs**
3. Vérifiez qu'il n'y a pas d'erreurs liées aux variables d'environnement:
   - ❌ `DATABASE_URL is not defined`
   - ❌ `JWT_SECRET is missing`
   - ❌ `CRON_SECRET non configuré`

### 5. Tester le site en production

1. Visitez votre site: https://www.accesdirectaide.fr
2. Vérifiez que les pages affichent du contenu:
   - ✅ Page Accueil: contenu visible
   - ✅ Page Aides: liste d'aides affichée
   - ✅ Page Structures: liste de structures affichée
   - ✅ Page Actualités: liste d'actualités affichée

---

## 🔧 TROUBLESHOOTING

### Problème 1: "DATABASE_URL is not defined"

**Cause:** Variable non configurée ou mal orthographiée  
**Solution:**
1. Vérifiez l'orthographe exacte: `DATABASE_URL` (sensible à la casse)
2. Vérifiez que l'environnement est bien sélectionné (Production/Preview)
3. Redéployez le projet

### Problème 2: "Connection refused" ou "ECONNREFUSED"

**Cause:** Espace dans l'URL PostgreSQL  
**Solution:**
1. Vérifiez que l'URL ne contient PAS d'espace après le mot de passe
2. Format correct: `npg_xXADTwi7o4RC@ep-summer-cloud...` (SANS espace)
3. Mettez à jour la variable dans Vercel
4. Redéployez

### Problème 3: "CRON_SECRET non configuré"

**Cause:** Variable manquante  
**Solution:**
1. Ajoutez `CRON_SECRET` dans Vercel
2. Valeur: `756709f776f7146e4aa8ba541f533f8265499e8392f0ef0c66efaba9ec12a1f5`
3. Environnements: Production, Preview, Development
4. Redéployez

### Problème 4: Pages vides / Pas de contenu

**Causes possibles:**
1. Base de données vide (pipeline jamais exécuté)
2. Données en statut "brouillon" au lieu de "publié"
3. Cron jobs non déclenchés

**Solutions:**
1. Vérifiez le contenu de la DB:
   ```bash
   npm run test:db:prod
   ```
2. Vérifiez les logs Vercel pour les cron jobs
3. Déclenchez manuellement le pipeline:
   ```bash
   curl -X POST "https://www.accesdirectaide.fr/api/cron/pipeline" \
     -H "Authorization: Bearer 756709f776f7146e4aa8ba541f533f8265499e8392f0ef0c66efaba9ec12a1f5"
   ```

### Problème 5: Rate limiting ne fonctionne pas

**Cause:** Variables Upstash KV manquantes  
**Solution:**
1. Vérifiez que `KV_REST_API_URL` et `KV_REST_API_TOKEN` sont configurées
2. Testez la connexion Upstash:
   ```bash
   curl -H "Authorization: Bearer Ae1WAAIncDFkNmE3NzVkN2MyMDc0NTg2OTE5ODE1ZTI2MWEzMzVhZHAxNjA3NTg" \
     https://great-kite-60758.upstash.io/get/test
   ```

### Problème 6: Sentry ne reçoit pas d'erreurs

**Cause:** `VITE_SENTRY_DSN` manquante ou incorrecte  
**Solution:**
1. Vérifiez que `VITE_SENTRY_DSN` est configurée
2. Vérifiez le DSN sur https://sentry.io
3. Redéployez (les variables `VITE_*` sont injectées au build)

---

## 📞 SUPPORT

Si vous rencontrez des problèmes après avoir suivi ce guide:

1. **Vérifiez les logs Vercel:**
   - Deployments → View Function Logs
   - Recherchez les erreurs liées aux variables d'environnement

2. **Testez localement:**
   ```bash
   # Copiez .env.local avec les vraies valeurs
   npm run test:db:prod
   npm run diagnostic
   ```

3. **Vérifiez la documentation:**
   - `README_NEXT_STEPS.md` - Prochaines étapes
   - `DIAGNOSTIC_DB_RESULTS.md` - Résultats des tests DB
   - `RAPPORT_DIAGNOSTIC_FINAL.md` - Rapport complet

---

## ✅ CHECKLIST FINALE

Avant de considérer la configuration terminée:

- [ ] Toutes les variables obligatoires sont configurées dans Vercel
- [ ] Les environnements sont correctement sélectionnés (Production, Preview)
- [ ] Les URLs PostgreSQL ne contiennent PAS d'espace
- [ ] Le projet a été redéployé après l'ajout des variables
- [ ] Les logs Vercel ne montrent pas d'erreurs de variables manquantes
- [ ] Le test de connexion DB réussit (`npm run test:db:prod`)
- [ ] Le site affiche du contenu (pas de pages vides)
- [ ] Les cron jobs s'exécutent correctement (vérifier les logs)
- [ ] Sentry reçoit des événements (vérifier le dashboard Sentry)

---

**Document créé par:** Blackbox AI Agent  
**Date:** 7 février 2026  
**Version:** 1.0  
**Statut:** ✅ Prêt pour utilisation
