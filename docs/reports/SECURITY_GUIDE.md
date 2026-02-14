# 🔒 Guide de Sécurité - AccesDirectAide

## ⚠️ ALERTE SÉCURITÉ

Ce document a été créé suite à la détection de **11 secrets exposés** dans la PR #114 par GitGuardian.

## 🚨 Problèmes Identifiés

### Secrets Exposés dans le Code

Les fichiers suivants contenaient des credentials hardcodés :

1. **Scripts de test** :
   - `scripts/test-db-production.cjs` - PostgreSQL credentials
   - `scripts/test-db-development.cjs` - PostgreSQL credentials
   - `DIAGNOSTIC_DB_RESULTS.md` - PostgreSQL credentials

2. **Documentation** :
   - `CONFIGURATION_COMPLETE.md` - PostgreSQL + Upstash credentials
   - `VERCEL_ENV_SETUP.md` - PostgreSQL + Upstash credentials
   - `RAPPORT_CONFIGURATION_ENV.md` - PostgreSQL credentials
   - Et 6 autres fichiers de documentation

### Types de Secrets Exposés

- ✅ **PostgreSQL Credentials** (mot de passe masqué - RÉVOQUÉ)
- ✅ **Upstash Redis Credentials** (token : `REDACTED` - RÉVOQUÉ)
- ✅ **JWT_SECRET**
- ✅ **CRON_SECRET**
- ✅ **ADA_ENCRYPTION_KEY**
- ✅ **ADMIN_TOKEN**
- ✅ **BYPASS_SECRET**

## ✅ Actions Correctives Appliquées

### 1. Scripts Sécurisés

Les scripts de test ont été modifiés pour utiliser les variables d'environnement :

**Avant (❌ DANGEREUX)** :
```javascript
const PROD_URL = 'postgresql://USER@HOST/DB';
```

**Après (✅ SÉCURISÉ)** :
```javascript
const PROD_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL_UNPOOLED;

if (!PROD_URL) {
  console.error('❌ ERREUR: Variable d\'environnement manquante');
  process.exit(1);
}
```

### 2. Documentation Supprimée

Tous les fichiers de documentation contenant des secrets ont été **supprimés** :
- `CONFIGURATION_COMPLETE.md`
- `DIAGNOSTIC_DB_RESULTS.md`
- `LIRE_MOI_CONFIGURATION.md`
- `RAPPORT_CONFIGURATION_ENV.md`
- `RAPPORT_DIAGNOSTIC_FINAL.md`
- `RESUME_FINAL_ENV.md`
- `SYNTHESE_TRAVAIL_EFFECTUE.md`
- `VERCEL_ENV_SETUP.md`
- `DEPLOYMENT_FIX_SUMMARY.md`

### 3. .gitignore Mis à Jour

Ajout de règles pour éviter de futurs commits de secrets :

```gitignore
# Documentation with sensitive data
CONFIGURATION_COMPLETE.md
DIAGNOSTIC_DB_RESULTS.md
LIRE_MOI_CONFIGURATION.md
RAPPORT_CONFIGURATION_ENV.md
RAPPORT_DIAGNOSTIC_FINAL.md
RESUME_FINAL_ENV.md
SYNTHESE_TRAVAIL_EFFECTUE.md
VERCEL_ENV_SETUP.md
DEPLOYMENT_FIX_SUMMARY.md

# Any file containing credentials or secrets
*_CREDENTIALS.md
*_SECRETS.md
```

## 🔐 Bonnes Pratiques de Sécurité

### 1. Variables d'Environnement

**TOUJOURS** utiliser les variables d'environnement pour les secrets :

```javascript
// ✅ BON
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

// ❌ MAUVAIS
const dbUrl = 'postgresql://USER@HOST/DB';
const jwtSecret = 'mon-secret-en-dur';
```

### 2. Fichiers .env

- ✅ **Utiliser** `.env.local` pour le développement local
- ✅ **Commiter** `.env.example` (sans valeurs réelles)
- ❌ **NE JAMAIS commiter** `.env`, `.env.local`, `.env.production`

**Exemple de `.env.example`** :
```bash
# Database
DATABASE_URL=postgresql://USER@HOST:5432/DBNAME
POSTGRES_URL_NON_POOLING=postgresql://USER@HOST:5432/DBNAME

# Authentication
JWT_SECRET=your-jwt-secret-here
CRON_SECRET=your-cron-secret-here

# Encryption
ADA_ENCRYPTION_KEY=your-encryption-key-here

# Admin
ADMIN_TOKEN=your-admin-token-here
BYPASS_SECRET=your-bypass-secret-here

# Upstash KV
KV_REST_API_URL=https://your-kv-url.upstash.io
KV_REST_API_TOKEN=your-kv-token-here

# Sentry
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 3. Documentation

**NE JAMAIS** inclure de secrets dans la documentation :

```markdown
<!-- ❌ MAUVAIS -->
Connexion DB : postgresql://USER@HOST/DB

<!-- ✅ BON -->
Connexion DB : Utiliser la variable d'environnement DATABASE_URL
```

### 4. Scripts de Test

**TOUJOURS** utiliser les variables d'environnement dans les scripts :

```javascript
// ✅ BON
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ❌ MAUVAIS
const client = new Client({
  connectionString: 'postgresql://USER@HOST/DB',
  ssl: { rejectUnauthorized: false }
});
```

### 5. Git Hooks (Recommandé)

Installer **GitGuardian** ou **git-secrets** pour détecter les secrets avant commit :

```bash
# Installer git-secrets
brew install git-secrets  # macOS
# ou
apt-get install git-secrets  # Linux

# Configurer pour le projet
git secrets --install
git secrets --register-aws
```

## 🔄 Actions Requises IMMÉDIATEMENT

### 1. Rotation des Secrets (URGENT)

**TOUS les secrets exposés doivent être révoqués et régénérés** :

#### PostgreSQL (Neon)
1. Se connecter à [Neon Console](https://console.neon.tech)
2. Aller dans **Settings** → **Reset Password**
3. Générer un nouveau mot de passe
4. Mettre à jour sur Vercel (Settings → Environment Variables)

#### Upstash Redis
1. Se connecter à [Upstash Console](https://console.upstash.io)
2. Aller dans **Database** → **Details** → **REST API**
3. Cliquer sur **Rotate Token**
4. Mettre à jour sur Vercel

#### JWT_SECRET, CRON_SECRET, ADA_ENCRYPTION_KEY
```bash
# Générer de nouveaux secrets sécurisés
openssl rand -hex 32  # Pour JWT_SECRET
openssl rand -hex 32  # Pour CRON_SECRET
openssl rand -hex 32  # Pour ADA_ENCRYPTION_KEY
```

Mettre à jour sur Vercel :
1. Aller dans **Settings** → **Environment Variables**
2. Modifier chaque variable
3. Redéployer l'application

#### ADMIN_TOKEN, BYPASS_SECRET
```bash
# Générer de nouveaux tokens
openssl rand -base64 48  # Pour ADMIN_TOKEN
openssl rand -hex 32     # Pour BYPASS_SECRET
```

### 2. Vérifier l'Historique Git

Les secrets sont **toujours présents dans l'historique Git**. Options :

#### Option A : Rewrite Git History (Recommandé pour les repos privés)
```bash
# Utiliser git-filter-repo (plus sûr que filter-branch)
pip install git-filter-repo

# Supprimer les fichiers contenant des secrets de l'historique
git filter-repo --path scripts/test-db-production.cjs --invert-paths
git filter-repo --path scripts/test-db-development.cjs --invert-paths
git filter-repo --path CONFIGURATION_COMPLETE.md --invert-paths
# ... répéter pour tous les fichiers

# Force push (ATTENTION : coordonner avec l'équipe)
git push origin --force --all
```

#### Option B : Accepter et Révoquer (Plus simple)
1. Révoquer TOUS les secrets exposés
2. Générer de nouveaux secrets
3. Continuer avec le nouveau code sécurisé

### 3. Configurer GitGuardian (Recommandé)

1. Aller sur [GitGuardian](https://www.gitguardian.com/)
2. Connecter le repository GitHub
3. Activer les scans automatiques
4. Configurer les alertes par email

## 📋 Checklist de Sécurité

Avant chaque commit :

- [ ] Aucun secret hardcodé dans le code
- [ ] Aucun secret dans les fichiers de documentation
- [ ] `.env.local` est dans `.gitignore`
- [ ] `.env.example` ne contient que des exemples (pas de vraies valeurs)
- [ ] Les scripts utilisent `process.env.*`
- [ ] Aucun fichier `*_CREDENTIALS.md` ou `*_SECRETS.md`

Avant chaque PR :

- [ ] GitGuardian scan passé (0 secrets détectés)
- [ ] Revue de code effectuée
- [ ] Tests passés
- [ ] Documentation mise à jour (sans secrets)

## 🆘 En Cas de Fuite de Secrets

1. **STOP** : Ne pas paniquer
2. **RÉVOQUER** : Révoquer immédiatement le secret exposé
3. **RÉGÉNÉRER** : Créer un nouveau secret
4. **METTRE À JOUR** : Mettre à jour Vercel et `.env.local`
5. **REDÉPLOYER** : Redéployer l'application
6. **DOCUMENTER** : Documenter l'incident (date, secret, action)
7. **PRÉVENIR** : Ajouter des règles `.gitignore` si nécessaire

## 📞 Contact

Pour toute question de sécurité :
- Créer une issue GitHub avec le label `security`
- Contacter l'équipe DevOps

## 📚 Ressources

- [GitGuardian Documentation](https://docs.gitguardian.com/)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Neon Security Best Practices](https://neon.tech/docs/security/security-overview)

---

**Dernière mise à jour** : 7 février 2026  
**Créé suite à** : PR #114 - GitGuardian Security Alert (11 secrets exposés)
