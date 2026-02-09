# 🔍 DIAGNOSTIC ENVIRONNEMENT - INSTRUCTIONS

## 📋 CONTEXTE

Suite à l'audit du code, **aucun bug n'a été détecté dans le code source**. Le problème de "pages vides" est très probablement **environnemental** (variables d'environnement, base de données vide, cron non exécutés).

## 🎯 OBJECTIF

Identifier la cause réelle du problème en vérifiant :
1. Variables d'environnement Vercel
2. État de la base de données
3. Exécution des cron jobs
4. Pipeline d'ingestion

---

## ⚡ DIAGNOSTIC RAPIDE (5 minutes)

### Option A : Depuis votre machine locale

```bash
# 1. Charger les variables d'environnement de production
# (adaptez selon votre méthode : .env.production, vercel env pull, etc.)

# 2. Exécuter le script de diagnostic
node scripts/diagnostic-env.js
```

### Option B : Vérification manuelle Vercel

#### 1️⃣ Variables d'environnement (2 min)

Aller sur : **Vercel Dashboard > Votre Projet > Settings > Environment Variables**

Vérifier que ces variables sont définies pour **Production** :

- ✅ `DATABASE_URL` (ou `POSTGRES_URL_NON_POOLING`)
- ✅ `JWT_SECRET`
- ✅ `ADA_ENCRYPTION_KEY`
- ✅ `ADMIN_TOKEN`
- ✅ `CRON_SECRET`
- ✅ `PUBLIC_BASE_URL`
- ✅ `KV_REST_API_URL`
- ✅ `KV_REST_API_TOKEN`

⚠️ **Piège fréquent** : Variables présentes en Preview mais **pas en Production**

#### 2️⃣ Logs Vercel (2 min)

Aller sur : **Vercel Dashboard > Votre Projet > Logs**

Filtrer sur :
- Routes : `/api/cron/*`
- Rechercher : `CRON_SECRET`, `DATABASE_URL`, `401`, `403`, `500`

Vérifier :
- ❌ Erreurs `CRON_SECRET missing` → Variable non définie
- ❌ Erreurs `DATABASE_URL undefined` → Variable non définie
- ❌ `401 Unauthorized` → CRON_SECRET incorrect
- ✅ `200 OK` → Cron s'exécute correctement

#### 3️⃣ Base de données (1 min)

Si vous avez accès à la base de données en production :

```sql
-- Compter les aides publiées
SELECT COUNT(*) AS aides_publiees FROM "Aide" WHERE statut = 'publie';

-- Compter les structures publiées
SELECT COUNT(*) AS structures_publiees FROM "Structure" WHERE statut = 'publie';

-- Compter les actualités publiées
SELECT COUNT(*) AS actualites_publiees FROM "Actualite" WHERE statut = 'publie';

-- Voir la répartition par statut
SELECT statut, COUNT(*) FROM "Aide" GROUP BY statut;
```

**Interprétation** :
- `0` partout → Base vide, pipeline jamais exécuté
- Uniquement `brouillon` → Pipeline exécuté mais données non publiées
- `publie > 0` → Données présentes, problème ailleurs

---

## 🔧 ACTIONS CORRECTIVES

### Cas 1 : Variables d'environnement manquantes

**Symptôme** : Erreurs dans les logs Vercel, variables `undefined`

**Solution** :
1. Aller dans Vercel > Settings > Environment Variables
2. Ajouter les variables manquantes pour **Production**
3. Redéployer (Vercel > Deployments > ... > Redeploy)

### Cas 2 : Base de données vide

**Symptôme** : `COUNT(*) = 0` ou uniquement des brouillons

**Solution** : Déclencher manuellement le pipeline

```bash
# Remplacer par votre domaine et CRON_SECRET
curl -i "https://www.accesdirectaide.fr/api/cron/pipeline" \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"

# Vérifier la réponse
# ✅ 200 OK → Pipeline exécuté
# ❌ 401 → CRON_SECRET incorrect
# ❌ 500 → Erreur serveur (voir logs)
```

Puis re-vérifier les counts dans la base.

### Cas 3 : Cron jobs non déclenchés

**Symptôme** : Aucun log de cron dans Vercel, base vide

**Vérification** :
1. Le fichier `vercel.json` contient bien la config cron (✅ déjà vérifié)
2. Le projet Vercel est sur un plan qui supporte les crons (Pro/Enterprise)
3. Les crons sont activés dans les settings du projet

**Solution** :
- Vérifier le plan Vercel
- Déclencher manuellement (voir Cas 2)
- Contacter le support Vercel si les crons ne se déclenchent jamais

### Cas 4 : Tout est OK mais le site est vide

**Si** :
- ✅ Variables d'environnement OK
- ✅ Base de données avec contenu publié
- ✅ Crons s'exécutent
- ❌ Site toujours vide

**Alors** : Problème dans le code frontend (rare)

**Actions** :
1. Vérifier la console navigateur (F12) pour les erreurs
2. Vérifier l'onglet Network : les API répondent-elles ?
3. Vérifier si le problème est en Production ET Preview ou seulement l'un des deux

---

## 📊 CHECKLIST DE VÉRIFICATION

Cochez au fur et à mesure :

### Environnement Vercel
- [ ] Variables d'environnement définies pour Production
- [ ] Aucune variable vide ou avec valeur placeholder (`your-...`, `...`)
- [ ] CRON_SECRET défini
- [ ] DATABASE_URL défini et valide

### Base de données
- [ ] Connexion réussie
- [ ] Au moins 1 aide publiée (`statut = 'publie'`)
- [ ] Au moins 1 structure publiée
- [ ] Pas uniquement des brouillons

### Cron jobs
- [ ] Logs Vercel montrent des exécutions de `/api/cron/*`
- [ ] Pas d'erreur 401/403 dans les logs cron
- [ ] Pipeline exécuté au moins une fois

### Site en production
- [ ] Page d'accueil affiche du contenu
- [ ] Page /aides affiche des aides
- [ ] Page /annuaire affiche des structures
- [ ] Aucune erreur dans la console navigateur

---

## 🚨 SI TOUT EST VERT MAIS LE SITE EST VIDE

Alors seulement, on revient au code. Mais selon l'audit :
- ✅ Build réussi
- ✅ Pas d'erreur de compilation
- ✅ Code frontend propre
- ✅ API handlers corrects

**Probabilité** : < 10%

**Action** : Ouvrir une issue avec :
- Résultat du diagnostic complet
- Screenshots de la console navigateur
- Logs Vercel
- Résultat des requêtes SQL

---

## 📞 BESOIN D'AIDE ?

Si après ce diagnostic vous êtes bloqué, fournissez :

1. **Résultat du script** : `node scripts/diagnostic-env.js`
2. **Counts SQL** : Nombre d'aides/structures publiées
3. **Logs Vercel** : Screenshot des logs cron
4. **Console navigateur** : Screenshot des erreurs (F12)

Cela permettra un diagnostic précis sans hypothèses.

---

## ✅ RÉSUMÉ

**80-90% des cas** : Le problème est environnemental
- Variables manquantes
- Base vide
- Cron non exécutés

**10-20% des cas** : Problème de configuration
- Mauvais projet Vercel lié
- Variables en Preview mais pas en Prod

**< 5% des cas** : Bug dans le code
- Déjà audité, rien trouvé

👉 **Commencez par le diagnostic environnemental avant toute modification de code.**
