# 🚀 GUIDE DE DÉPLOIEMENT - CORRECTIONS CRITIQUES

**Date:** 7 février 2026  
**Durée estimée:** 10 minutes  
**Priorité:** P0 (CRITIQUE)

---

## 📋 RÉSUMÉ EN 30 SECONDES

**Problème:** Erreurs 500 sur `/api/demarches`, `/api/structures`, `/api/actualites`  
**Cause:** Colonne `search_vector` manquante dans la base de données  
**Solution:** Migration SQL appliquée avec succès ✅  
**Action requise:** Redéployer l'application sur Vercel

---

## ✅ ÉTAPE 1: VÉRIFIER QUE LA MIGRATION EST APPLIQUÉE

La migration a déjà été appliquée sur la base de données de production.

**Vérification rapide:**

```bash
node scripts/check-db-extensions.cjs
```

**Résultat attendu:**
```
✅ Aide.search_vector: EXISTE
✅ Structure.search_vector: EXISTE
✅ Demarche.search_vector: EXISTE
```

---

## 🚀 ÉTAPE 2: REDÉPLOYER SUR VERCEL

### Option A: Via le Dashboard Vercel (recommandé)

1. Aller sur [Vercel Dashboard](https://vercel.com)
2. Sélectionner le projet **AccesDirectAide**
3. Aller dans l'onglet **Deployments**
4. Cliquer sur le dernier déploiement de la branche `main`
5. Cliquer sur **Redeploy** (bouton en haut à droite)
6. Confirmer le redéploiement

### Option B: Via la CLI Vercel

```bash
# Installer la CLI Vercel si nécessaire
npm i -g vercel

# Se connecter
vercel login

# Redéployer en production
vercel --prod
```

### Option C: Forcer un nouveau commit (si nécessaire)

```bash
# Créer un commit vide pour déclencher un déploiement
git commit --allow-empty -m "chore: trigger deployment after search_vector migration"
git push origin main
```

---

## 🧪 ÉTAPE 3: VÉRIFIER LES ENDPOINTS EN PRODUCTION

**Attendre 2-3 minutes** après le déploiement, puis tester:

### Test 1: Démarches
```bash
curl -i https://www.accesdirectaide.fr/api/demarches?limit=5
```
**Résultat attendu:** `HTTP/2 200`

### Test 2: Structures
```bash
curl -i https://www.accesdirectaide.fr/api/structures?limit=5
```
**Résultat attendu:** `HTTP/2 200`

### Test 3: Actualités
```bash
curl -i https://www.accesdirectaide.fr/api/actualites?limit=5
```
**Résultat attendu:** `HTTP/2 200`

### Test 4: Aides
```bash
curl -i https://www.accesdirectaide.fr/api/aides?limit=5
```
**Résultat attendu:** `HTTP/2 200` ou `HTTP/2 400` (si paramètres invalides)

---

## 📊 ÉTAPE 4: VÉRIFIER LES LOGS VERCEL

1. Aller dans **Vercel Dashboard** → **Deployments**
2. Cliquer sur le dernier déploiement
3. Cliquer sur **View Function Logs**
4. Vérifier qu'il n'y a **plus d'erreurs 500** liées à `search_vector`

**Erreurs à ne plus voir:**
```
❌ column "search_vector" does not exist
❌ Prisma error: P2022
❌ The column Demarche.updatedBy does not exist
```

**Logs normaux attendus:**
```
✅ SEARCH_AIDES_SUCCESS
✅ SEARCH_DEMARCHES_SUCCESS
✅ SEARCH_STRUCTURES_SUCCESS
```

---

## 🎯 ÉTAPE 5: TESTER LE SITE EN PRODUCTION

### Test manuel (2 minutes):

1. **Ouvrir le site:** https://www.accesdirectaide.fr
2. **Tester la recherche d'aides:**
   - Aller sur la page Aides
   - Utiliser la barre de recherche
   - Vérifier que les résultats s'affichent
3. **Tester la recherche de structures:**
   - Aller sur la page Annuaire
   - Rechercher une ville
   - Vérifier que les résultats s'affichent
4. **Tester la page Démarches:**
   - Aller sur la page Démarches
   - Vérifier que la liste s'affiche

### Vérification console navigateur:

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet **Console**
3. Vérifier qu'il n'y a **pas d'erreurs rouges**
4. Aller dans l'onglet **Network**
5. Filtrer sur **XHR/Fetch**
6. Vérifier que les appels API retournent **200 OK**

---

## ⚠️ TROUBLESHOOTING

### Si les erreurs 500 persistent:

#### 1. Vérifier la connexion à la base de données

```bash
node scripts/test-db-simple.cjs
```

**Résultat attendu:**
```
✅ Connexion réussie!
✅ Nombre d'aides: 10
```

#### 2. Vérifier que la migration est bien appliquée

```bash
node scripts/check-db-extensions.cjs
```

**Si `search_vector` n'existe pas:**
```bash
# Réappliquer la migration
node scripts/apply-search-vector-migration.cjs
```

#### 3. Vérifier les variables d'environnement Vercel

1. Aller dans **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Vérifier que `POSTGRES_URL_NON_POOLING` est bien définie pour **Production**
3. Vérifier que la valeur est correcte:
   ```
   postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
   ```

#### 4. Vérifier les logs Vercel en détail

1. Aller dans **Vercel Dashboard** → **Deployments**
2. Cliquer sur le dernier déploiement
3. Cliquer sur **View Function Logs**
4. Chercher les erreurs spécifiques:
   - `search_vector`
   - `Prisma`
   - `P2022`
   - `column does not exist`

### Si les erreurs 400 sont trop fréquentes:

Les erreurs 400 sont **normales** si les paramètres de requête sont invalides.

**Exemples de requêtes invalides:**
```bash
# Page = 0 (minimum: 1)
curl https://www.accesdirectaide.fr/api/aides?page=0

# PageSize > 100 (maximum: 100)
curl https://www.accesdirectaide.fr/api/aides?pageSize=200

# Sort invalide (valeurs: pertinence, date, alpha)
curl https://www.accesdirectaide.fr/api/aides?sort=invalid
```

**Pour réduire les erreurs 400:**
1. Améliorer la validation côté frontend
2. Afficher des messages d'erreur clairs
3. Ajouter des contraintes sur les inputs (min/max)

---

## 📈 MÉTRIQUES DE SUCCÈS

### Avant la correction:
- ❌ `/api/demarches` → 500 (100% des requêtes)
- ❌ `/api/structures` → 500 (100% des requêtes)
- ❌ `/api/actualites` → "Recovered" (fallback)

### Après la correction (attendu):
- ✅ `/api/demarches` → 200
- ✅ `/api/structures` → 200
- ✅ `/api/actualites` → 200
- ✅ Recherche full-text fonctionnelle

---

## 🎯 CHECKLIST FINALE

### Avant de considérer le déploiement comme réussi:

- [ ] Migration `search_vector` appliquée (vérifiée)
- [ ] Application redéployée sur Vercel
- [ ] Endpoints API testés (200 OK)
- [ ] Logs Vercel vérifiés (pas d'erreurs 500)
- [ ] Site testé manuellement (recherche fonctionne)
- [ ] Console navigateur vérifiée (pas d'erreurs)
- [ ] Network tab vérifiée (API répond 200)

### Si tous les points sont cochés:

✅ **DÉPLOIEMENT RÉUSSI !**

Le site est maintenant fonctionnel et stable.

---

## 📞 BESOIN D'AIDE ?

### Ressources disponibles:

1. **Documentation complète:** `CRITICAL_FIX_COMPLETE.md`
2. **Scripts de diagnostic:**
   - `scripts/check-db-columns.cjs`
   - `scripts/check-db-extensions.cjs`
   - `scripts/test-db-simple.cjs`
3. **Scripts de migration:**
   - `scripts/add-search-vector.sql`
   - `scripts/apply-search-vector-migration.cjs`

### Commandes utiles:

```bash
# Vérifier la connexion DB
node scripts/test-db-simple.cjs

# Vérifier les extensions et search_vector
node scripts/check-db-extensions.cjs

# Vérifier les colonnes
node scripts/check-db-columns.cjs

# Réappliquer la migration (si nécessaire)
node scripts/apply-search-vector-migration.cjs
```

---

**Travail effectué par:** Blackbox AI Agent  
**Date:** 7 février 2026  
**Statut:** ✅ Prêt pour déploiement  
**Prochaine action:** Redéployer sur Vercel (Étape 2)
