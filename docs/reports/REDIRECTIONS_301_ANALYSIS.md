# 🔍 ANALYSE DES REDIRECTIONS 301 STAGING

**Date:** 7 février 2026  
**Statut:** ℹ️ Analyse documentée (non critique)  
**Priorité:** P2 (Optimisation)

---

## 📊 SYMPTÔME OBSERVÉ

**Logs Vercel:**
```
GET 301 acces-direct-aide-staging.vercel.app /
GET 301 acces-direct-aide-staging.vercel.app /
GET 301 acces-direct-aide-staging.vercel.app /
...
```

**Fréquence:** Toutes les minutes (ou régulièrement)

**Impact:**
- ⚠️ Pollution des logs Vercel
- ℹ️ Pas d'impact fonctionnel sur le site
- ℹ️ Pas d'impact sur les performances

---

## 🔍 CAUSES PROBABLES

### 1. Monitoring externe (TRÈS PROBABLE)

**Services de monitoring courants:**
- UptimeRobot
- BetterUptime
- Pingdom
- Healthchecks.io
- StatusCake
- Site24x7

**Symptômes:**
- Requêtes régulières (toutes les 1-5 minutes)
- Toujours sur la même URL (généralement `/`)
- User-Agent spécifique (ex: `UptimeRobot/2.0`)

**Comment vérifier:**
1. Aller dans **Vercel Dashboard** → **Deployments** → **View Function Logs**
2. Chercher les requêtes 301 sur `acces-direct-aide-staging.vercel.app`
3. Vérifier le **User-Agent** dans les logs
4. Vérifier si vous avez configuré un service de monitoring

**Solution:**
- Mettre à jour l'URL du monitoring pour pointer vers `www.accesdirectaide.fr` (production)
- Ou désactiver le monitoring sur staging si non nécessaire

---

### 2. Redirect global dans Vercel (PROBABLE)

**Configuration possible:**

Dans `vercel.json`, il peut y avoir une règle de redirection qui force le domaine canonique:

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "destination": "https://www.accesdirectaide.fr/:path*",
      "permanent": true
    }
  ]
}
```

**Comment vérifier:**

1. Ouvrir `vercel.json`
2. Chercher la section `redirects`
3. Vérifier s'il y a une règle qui redirige vers le domaine de production

**Solution:**
- Ajouter une condition pour exclure staging:
  ```json
  {
    "redirects": [
      {
        "source": "/:path*",
        "has": [
          {
            "type": "host",
            "value": "(?!.*staging).*"
          }
        ],
        "destination": "https://www.accesdirectaide.fr/:path*",
        "permanent": true
      }
    ]
  }
  ```

---

### 3. Redirect dans le code de l'application (POSSIBLE)

**Fichiers à vérifier:**

1. **`src/App.jsx`** ou **`src/main.jsx`**
   - Vérifier s'il y a une logique de redirection basée sur le domaine

2. **Middleware Vercel** (`middleware.js` ou `middleware.ts`)
   - Vérifier s'il y a une redirection automatique

**Exemple de code qui pourrait causer cela:**

```javascript
// Dans App.jsx ou middleware
if (window.location.hostname.includes('staging')) {
  window.location.href = 'https://www.accesdirectaide.fr';
}
```

**Solution:**
- Supprimer ou conditionner cette logique

---

### 4. Cron job ou script automatique (POSSIBLE)

**Vérifier dans `vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/_handlers/cron/pipeline",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Comment vérifier:**
1. Ouvrir `vercel.json`
2. Chercher la section `crons`
3. Vérifier si un cron pointe vers staging

**Solution:**
- S'assurer que les crons pointent vers le bon environnement

---

## 🛠️ DIAGNOSTIC ÉTAPE PAR ÉTAPE

### Étape 1: Vérifier les logs Vercel en détail

1. Aller dans **Vercel Dashboard** → **Deployments**
2. Sélectionner le projet **staging** (si existant)
3. Cliquer sur **View Function Logs**
4. Chercher les requêtes 301
5. Noter:
   - **User-Agent** (pour identifier le service)
   - **Fréquence** (toutes les X minutes)
   - **IP source** (pour identifier l'origine)

### Étape 2: Vérifier vercel.json

```bash
cat vercel.json | grep -A 10 "redirects"
```

**Résultat attendu:**
- Pas de section `redirects`, OU
- Section `redirects` avec conditions appropriées

### Étape 3: Vérifier les services de monitoring

1. Vérifier si vous avez configuré:
   - UptimeRobot
   - BetterUptime
   - Pingdom
   - Autre service de monitoring

2. Si oui, vérifier l'URL configurée:
   - Est-ce `acces-direct-aide-staging.vercel.app` ?
   - Mettre à jour vers `www.accesdirectaide.fr`

### Étape 4: Vérifier les domaines Vercel

1. Aller dans **Vercel Dashboard** → **Settings** → **Domains**
2. Vérifier la configuration:
   - Domaine principal: `www.accesdirectaide.fr`
   - Domaine staging: `acces-direct-aide-staging.vercel.app`
3. Vérifier s'il y a une redirection automatique configurée

---

## 🔧 SOLUTIONS RECOMMANDÉES

### Solution 1: Mettre à jour le monitoring (RECOMMANDÉ)

**Si vous utilisez un service de monitoring:**

1. Se connecter au service (UptimeRobot, BetterUptime, etc.)
2. Trouver le monitor pour AccesDirectAide
3. Mettre à jour l'URL:
   - ❌ Ancienne: `https://acces-direct-aide-staging.vercel.app`
   - ✅ Nouvelle: `https://www.accesdirectaide.fr`
4. Sauvegarder

**Impact:**
- ✅ Plus de requêtes 301 sur staging
- ✅ Logs Vercel plus propres
- ✅ Monitoring sur le bon environnement

---

### Solution 2: Conditionner les redirections dans vercel.json

**Si vous avez une règle de redirection globale:**

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "^(?!.*staging).*$"
        }
      ],
      "destination": "https://www.accesdirectaide.fr/:path*",
      "permanent": true
    }
  ]
}
```

**Impact:**
- ✅ Staging ne redirige plus vers production
- ✅ Production continue de rediriger vers le domaine canonique

---

### Solution 3: Désactiver le monitoring sur staging

**Si le monitoring n'est pas nécessaire sur staging:**

1. Se connecter au service de monitoring
2. Désactiver ou supprimer le monitor pour staging
3. Garder uniquement le monitor pour production

**Impact:**
- ✅ Plus de requêtes 301 sur staging
- ⚠️ Pas de monitoring sur staging (acceptable si non critique)

---

## 📊 VÉRIFICATION POST-CORRECTION

### Après avoir appliqué une solution:

1. **Attendre 5-10 minutes**
2. **Vérifier les logs Vercel:**
   - Aller dans **Vercel Dashboard** → **Deployments** → **View Function Logs**
   - Vérifier qu'il n'y a **plus de requêtes 301** répétées sur staging

3. **Vérifier le monitoring:**
   - Si vous utilisez un service de monitoring, vérifier qu'il pointe vers production
   - Vérifier que le site est bien "UP"

---

## 📈 IMPACT ET PRIORITÉ

### Impact actuel:

- ⚠️ **Logs pollués** (difficulté à identifier les vraies erreurs)
- ℹ️ **Pas d'impact fonctionnel** (le site fonctionne normalement)
- ℹ️ **Pas d'impact performance** (les redirections sont rapides)

### Priorité:

- **P2 (Optimisation)** - Pas urgent, mais à corriger pour améliorer la lisibilité des logs

### Recommandation:

- ✅ Corriger après avoir vérifié que les endpoints API fonctionnent (P0)
- ✅ Corriger après avoir résolu les erreurs 400 sur `/api/aides` (P1)
- ✅ Prendre le temps de bien identifier la cause avant de corriger

---

## 🎯 CHECKLIST DE DIAGNOSTIC

- [ ] Vérifier les logs Vercel (User-Agent, fréquence, IP)
- [ ] Vérifier `vercel.json` (section `redirects`)
- [ ] Vérifier les services de monitoring (UptimeRobot, etc.)
- [ ] Vérifier les domaines Vercel (configuration)
- [ ] Vérifier le code de l'application (redirections)
- [ ] Vérifier les cron jobs (vercel.json)

### Une fois la cause identifiée:

- [ ] Appliquer la solution appropriée
- [ ] Attendre 5-10 minutes
- [ ] Vérifier les logs Vercel (plus de 301 répétés)
- [ ] Vérifier le monitoring (pointe vers production)

---

## 📞 BESOIN D'AIDE ?

### Commandes utiles:

```bash
# Vérifier vercel.json
cat vercel.json | grep -A 10 "redirects"

# Vérifier les crons
cat vercel.json | grep -A 10 "crons"

# Vérifier les domaines configurés
vercel domains ls
```

### Ressources:

- [Vercel Redirects Documentation](https://vercel.com/docs/edge-network/redirects)
- [Vercel Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)

---

**Travail effectué par:** Blackbox AI Agent  
**Date:** 7 février 2026  
**Statut:** ℹ️ Analyse documentée  
**Prochaine action:** Identifier la cause spécifique (après P0 et P1)
