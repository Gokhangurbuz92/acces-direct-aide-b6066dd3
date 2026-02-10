# ✅ CHECKLIST VARIABLES D'ENVIRONNEMENT VERCEL

**Objectif:** Vérifier que toutes les variables nécessaires sont définies sur Vercel

---

## 🎯 ACCÈS RAPIDE

**Vercel Dashboard:**
1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `acces-direct-aide`
3. Aller dans **Settings** → **Environment Variables**

---

## 📋 VARIABLES OBLIGATOIRES (P0)

### 1. Base de données PostgreSQL

#### Production & Preview
```bash
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:PASSWORD@ep-summer-cloud-ag14ucwz.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Environnements à configurer:**
- ✅ Production
- ✅ Preview
- ⚠️ Development (optionnel, peut utiliser l'autre endpoint)

**Comment vérifier:**
- [ ] Variable existe
- [ ] Pas d'espace dans le mot de passe
- [ ] URL complète (pas tronquée)
- [ ] Endpoint correct: `ep-summer-cloud-ag14ucwz`

#### Development (optionnel)
```bash
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:PASSWORD@ep-crimson-night-ag7jy3cm.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Environnements à configurer:**
- ⚠️ Development uniquement

**Comment vérifier:**
- [ ] Variable existe (si utilisée)
- [ ] Endpoint correct: `ep-crimson-night-ag7jy3cm`

---

### 2. Sécurité CRON

```bash
CRON_SECRET=votre-secret-aleatoire-long-et-complexe
```

**Environnements à configurer:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Comment vérifier:**
- [ ] Variable existe
- [ ] Secret long (minimum 32 caractères)
- [ ] Secret aléatoire (pas "secret123")
- [ ] Même valeur partout (ou différente par env)

**Générer un nouveau secret:**
```bash
# Sur votre Mac
openssl rand -base64 32
```

---

### 3. Vercel KV (Rate Limiting)

```bash
KV_REST_API_URL=https://your-kv-instance.kv.vercel-storage.com
KV_REST_API_TOKEN=your-kv-token
```

**Environnements à configurer:**
- ✅ Production
- ✅ Preview
- ⚠️ Development (optionnel)

**Comment vérifier:**
- [ ] Variables existent
- [ ] URL commence par `https://`
- [ ] Token est valide

**Si vous n'avez pas de KV:**
1. Aller dans Storage → Create Database → KV
2. Copier les credentials
3. Ajouter aux variables d'environnement

---

## 📋 VARIABLES OPTIONNELLES (P1)

### 4. Monitoring & Logs

```bash
# Niveau de log (optionnel)
LOG_LEVEL=info

# Sentry (optionnel)
SENTRY_DSN=https://...
```

### 5. API externes (si utilisées)

```bash
# Exemple: API gouvernementale
API_GOUV_KEY=votre-cle-api

# Exemple: Service de géocodage
GEOCODING_API_KEY=votre-cle
```

---

## 🔍 COMMENT VÉRIFIER SUR VERCEL

### Méthode 1: Via l'interface

1. **Aller sur Vercel Dashboard**
   - https://vercel.com/dashboard
   - Sélectionner le projet

2. **Ouvrir Settings → Environment Variables**

3. **Vérifier chaque variable:**
   - Nom correct
   - Valeur non vide
   - Environnements cochés (Production, Preview, Development)

4. **Tester en cliquant sur "Reveal"**
   - Vérifier qu'il n'y a pas d'espaces
   - Vérifier que la valeur est complète

### Méthode 2: Via les logs de build

1. **Aller dans Deployments**
2. **Cliquer sur le dernier déploiement**
3. **Ouvrir "Build Logs"**
4. **Chercher des erreurs:**
   ```
   DATABASE_URL is not defined
   CRON_SECRET is missing
   ```

### Méthode 3: Via les logs runtime

1. **Aller dans Deployments**
2. **Cliquer sur "Functions"**
3. **Chercher des erreurs:**
   ```
   Error: connect ECONNREFUSED
   Error: password authentication failed
   ```

---

## 🚨 ERREURS FRÉQUENTES

### ❌ Erreur 1: Variable définie uniquement en Preview

**Symptôme:**
- Site fonctionne en preview
- Site vide en production

**Solution:**
- Cocher "Production" lors de l'ajout de la variable
- Ou dupliquer la variable pour Production

### ❌ Erreur 2: Espace dans la valeur

**Symptôme:**
```
password authentication failed
```

**Solution:**
- Copier-coller depuis Neon Dashboard
- Vérifier avec "Reveal" sur Vercel
- Supprimer les espaces en début/fin

### ❌ Erreur 3: Variable tronquée

**Symptôme:**
- Connection string incomplète
- Token API invalide

**Solution:**
- Copier la valeur COMPLÈTE
- Vérifier qu'elle se termine correctement
- Exemple: `?sslmode=require` à la fin

### ❌ Erreur 4: Mauvais environnement

**Symptôme:**
- Base de données DEV utilisée en PROD
- Données de test en production

**Solution:**
- Vérifier l'endpoint dans la connection string
- PROD: `ep-summer-cloud-ag14ucwz`
- DEV: `ep-crimson-night-ag7jy3cm`

---

## 🔧 PROCÉDURE DE CORRECTION

### Si une variable manque:

1. **Ajouter la variable**
   - Settings → Environment Variables → Add
   - Nom: `POSTGRES_URL_NON_POOLING`
   - Value: (coller la connection string)
   - Environments: cocher Production + Preview

2. **Redéployer**
   - Deployments → Latest → Redeploy
   - Ou: `git commit --allow-empty -m "Trigger redeploy" && git push`

3. **Vérifier les logs**
   - Attendre la fin du build
   - Vérifier qu'il n'y a plus d'erreur

### Si une variable est incorrecte:

1. **Éditer la variable**
   - Settings → Environment Variables
   - Cliquer sur les 3 points → Edit
   - Corriger la valeur
   - Save

2. **Redéployer** (obligatoire)
   - Les variables ne sont appliquées qu'au build
   - Un simple refresh ne suffit pas

---

## 📊 TEMPLATE DE VÉRIFICATION

Copiez ce template et remplissez-le:

```
✅ POSTGRES_URL_NON_POOLING
   - Production: ✅ / ❌
   - Preview: ✅ / ❌
   - Endpoint: ep-summer-cloud-ag14ucwz
   - Pas d'espace: ✅ / ❌

✅ CRON_SECRET
   - Production: ✅ / ❌
   - Preview: ✅ / ❌
   - Longueur > 32 chars: ✅ / ❌

⚠️ KV_REST_API_URL
   - Production: ✅ / ❌ / N/A
   - Preview: ✅ / ❌ / N/A

⚠️ KV_REST_API_TOKEN
   - Production: ✅ / ❌ / N/A
   - Preview: ✅ / ❌ / N/A
```

---

## 🎯 APRÈS CORRECTION

### 1. Redéployer

```bash
# Depuis votre Mac
git commit --allow-empty -m "chore: trigger redeploy after env vars update"
git push origin main
```

### 2. Vérifier le build

- Aller dans Deployments
- Attendre la fin du build
- Vérifier qu'il est vert (Ready)

### 3. Tester le site

- Ouvrir l'URL de production
- Vérifier que le contenu s'affiche
- Vérifier la console navigateur (pas d'erreur)

### 4. Vérifier les logs

- Deployments → Functions
- Chercher des erreurs
- Vérifier que les API répondent

---

## 📞 SI VOUS ÊTES BLOQUÉ

**Fournissez ces informations:**

1. Screenshot de Settings → Environment Variables
   - Masquer les valeurs sensibles
   - Montrer les noms et environnements cochés

2. Logs de build (dernières 50 lignes)
   ```bash
   # Copier depuis Vercel Dashboard
   # Deployments → Latest → Build Logs
   ```

3. Logs runtime (si erreur)
   ```bash
   # Copier depuis Vercel Dashboard
   # Deployments → Functions → Logs
   ```

4. Résultat de la commande locale:
   ```bash
   psql "$POSTGRES_URL_NON_POOLING" -c "\dt"
   ```

---

## ✅ CHECKLIST FINALE

Avant de considérer que c'est OK:

- [ ] Toutes les variables P0 sont définies
- [ ] Aucune variable ne contient d'espace
- [ ] Les environnements corrects sont cochés
- [ ] Le build Vercel est vert (Ready)
- [ ] Le site affiche du contenu
- [ ] Aucune erreur dans la console navigateur
- [ ] Les logs Vercel sont propres

---

**Créé par:** Blackbox AI Agent  
**Date:** 7 février 2026  
**Objectif:** Garantir que l'environnement Vercel est correctement configuré
