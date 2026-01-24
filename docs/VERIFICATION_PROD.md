# Vérification de la Production en 60 Secondes

Ce document décrit comment vérifier rapidement que la version déployée est correcte et que l'observabilité (Sentry) fonctionne.

## 1. Vérification de la Version (/api/version)

Cet endpoint expose des informations sur le déploiement. Il est protégé par un token.

**Prérequis :**
- Récupérer le `DEBUG_TOKEN` (variable d'environnement).
- Connaitre l'URL de base (ex: `https://accesdirectaide.fr`).

**Commande curl :**

```bash
curl -H "X-Debug-Token: <VOTRE_TOKEN>" https://<DOMAINE>/api/version
```

**Résultat attendu :**

```json
{
  "commitSha": "a1b2c3d...",
  "buildTime": "2024-05-20T10:00:00.000Z",
  "vercelEnv": "production",
  "effectiveBaseUrl": "https://accesdirectaide.fr",
  "dbHost": "aws...com"
}
```

Vérifiez que :
- `commitSha` correspond au dernier commit mergé.
- `vercelEnv` est bien `production` (ou `preview` selon le cas).

## 2. Vérification des Headers Globaux

Les réponses de l'API et les pages statiques (via build script) doivent contenir les headers de version.

**Commande curl :**

```bash
curl -I https://<DOMAINE>/api/health
```

**Résultat attendu :**

```
HTTP/2 200
...
x-release-sha: a1b2c3d...
x-deploy-env: production
...
```

## 3. Vérification Sentry

Pour tester la remontée d'erreurs :

1. Aller sur une URL qui n'existe pas ou utiliser une route de test (si disponible).
   - L'application ne doit pas exposer de route de "crash" publique sans authentification.
2. Pour les développeurs : utiliser le script de test local ou déclencher une erreur en Preview.

**Vérification Dashboard Sentry :**
- Aller sur [Sentry > Projects > acces-direct-aide](https://sentry.io).
- Vérifier que la Release est bien tagguée (ex: `a1b2c3d...`).
- Vérifier que l'environnement est correct (`production` ou `preview`).
- Vérifier que les sourcemaps sont présents (le code source doit être visible dans la stacktrace).
