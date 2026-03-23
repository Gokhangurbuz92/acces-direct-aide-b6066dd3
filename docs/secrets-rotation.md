# Rotation des secrets — Accès Direct Aide

> Procédure documentée pour la rotation sécurisée des secrets de l'application.

## Inventaire des secrets

| Secret | Variable d'environnement | Où | Rotation recommandée |
|--------|-------------------------|-----|---------------------|
| JWT Admin | `JWT_SECRET` | Vercel env | Tous les 6 mois |
| JWT User (cookie) | `USER_SESSION_SECRET` | Vercel env | Tous les 6 mois |
| Gemini API key | `GEMINI_API_KEY` | Vercel env | Sur compromission |
| Cron secret | `CRON_SECRET` | Vercel env | Tous les 6 mois |
| Admin token | `ADMIN_TOKEN` | Vercel env | Tous les 3 mois |
| Admin password hash | `ADMIN_PASSWORD_HASH` | Vercel env | Sur changement |
| DB URL | `DATABASE_URL` | Vercel env | Sur compromission |
| KV token | `KV_REST_API_TOKEN` | Vercel env | Sur compromission |
| Storage keys | `STORAGE_ACCESS_KEY_ID` / `SECRET` | Vercel env | Tous les 6 mois |
| Mailjet keys | `MJ_APIKEY_PUBLIC` / `PRIVATE` | Vercel env | Tous les 6 mois |
| Sentry DSN | `SENTRY_DSN` | Vercel env | Rarement |

## Procédure de rotation

### JWT_SECRET / USER_SESSION_SECRET

**Impact** : tous les tokens en cours de validité seront invalidés (les utilisateurs devront se reconnecter).

1. Générer un nouveau secret :
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Mettre à jour dans Vercel → Settings → Environment Variables
3. **Redéployer** le projet (les fonctions serverless prendront le nouveau secret)
4. Communiquer aux utilisateurs admin qu'ils devront se reconnecter

### ADMIN_PASSWORD_HASH

1. Générer le nouveau hash :
   ```bash
   node -e "
   const crypto = require('crypto');
   const pass = 'NOUVEAU_MOT_DE_PASSE';
   const salt = crypto.randomBytes(16).toString('hex');
   crypto.scrypt(pass, salt, 64, (err, hash) => {
     console.log(salt + ':' + hash.toString('hex'));
   });
   "
   ```
2. Mettre à jour `ADMIN_PASSWORD_HASH` dans Vercel env
3. Redéployer

### GEMINI_API_KEY

1. Créer une nouvelle clé dans [Google AI Studio](https://aistudio.google.com/apikey)
2. Mettre à jour dans Vercel env
3. Désactiver l'ancienne clé dans Google AI Studio
4. Redéployer

### DATABASE_URL (Neon)

1. Aller dans [Neon Console](https://console.neon.tech)
2. Reset le mot de passe du rôle PostgreSQL
3. Copier la nouvelle connection string
4. Mettre à jour `DATABASE_URL` et `DIRECT_URL` dans Vercel env
5. Redéployer

### KV_REST_API_TOKEN (Upstash)

1. Aller dans [Upstash Console](https://console.upstash.com)
2. Database → votre DB → REST API → Reset Token
3. Mettre à jour `KV_REST_API_URL` et `KV_REST_API_TOKEN` dans Vercel env
4. Redéployer

## En cas de compromission

1. **Immédiat** : révoquer/regenerer le secret compromis
2. Mettre à jour dans Vercel env
3. Redéployer le projet
4. Vérifier les logs Sentry pour toute activité suspecte
5. Si un JWT est compromis : considérer de changer `JWT_SECRET` pour invalider tous les tokens

## Vérifications post-rotation

```bash
# Vérifier que le site fonctionne
curl https://www.accesdirectaide.fr/api/health

# Vérifier la santé profonde (avec auth)
curl -H "Authorization: Bearer <your-admin-token>" \
  https://www.accesdirectaide.fr/api/health/deep

# Vérifier les monitors
curl https://www.accesdirectaide.fr/api/monitor/core
```

## Automatisation future

- Configurer la détection de secrets avec GitGuardian (déjà en CI)
- Envisager la rotation automatique via Vercel API + cron
- Ajouter un check dans `health-alert.js` si un secret est > 6 mois
