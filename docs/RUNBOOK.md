# Runbook d'Exploitation

Ce document décrit les procédures opérationnelles pour la maintenance et la résolution d'incidents.

## 1. Incident Response (P0)

### 1.1 Service Indisponible (500/503)
**Symptômes** : Page blanche, erreurs "Network Error", alertes Sentry.
**Actions** :
1. **Check Status** : Vérifier [Vercel Status](https://www.vercel-status.com/) et [Neon Status](https://neon.tech/status).
2. **Logs Vercel** : Aller sur le dashboard Vercel -> Project -> Logs -> Filtrer par "Error".
3. **Rollback** : Si suite à un déploiement récent (< 1h), utiliser "Instant Rollback" sur Vercel (voir section 2).
4. **Rate Limit** : Si erreur 429 massive, vérifier Upstash Redis (quota dépassé ?).

### 1.2 Base de Données (Connexion Impossible)
**Symptômes** : Erreurs `P1001` (Can't reach db) ou `P1003` (DB does not exist) dans les logs.
**Actions** :
1. Vérifier la variable `DATABASE_URL` dans Vercel Settings.
2. Vérifier si le compute Neon est "Suspended" (réveil auto en 3-5s normalement).
3. Redémarrer les fonctions Vercel (Redeploy sans cache).

## 2. Procédure de Rollback

En cas de régression critique en production :

1. Aller sur **Vercel Dashboard** > **Deployments**.
2. Identifier le dernier déploiement "vert" (stable).
3. Cliquer sur les trois points `...` à droite -> **Instant Rollback**.
4. Confirmer. Le trafic est redirigé immédiatement.
5. **Ouvrir un incident** : Créer une issue GitHub "HOTFIX" pour analyser la cause racine.

## 3. Maintenance Base de Données

### 3.1 Migrations de Schéma
Toute modification de `schema.prisma` nécessite une migration.
**En Dev** : `npx prisma migrate dev --name <nom>`
**En Prod** : `npx prisma migrate deploy` (exécuté automatiquement via CI/CD ou manuellement si bloqué).

### 3.2 Seeding (Peuplement)
Pour réinitialiser les données de référence (Taxonomie, Aides de test) :
```bash
npx prisma db seed
```
*Attention : Ne jamais exécuter `db push` en production (perte de données).*

## 4. Tâches Planifiées (Crons)

Les jobs tournent via Vercel Cron.
**Monitoring** : Vercel Dashboard -> Settings -> Crons.
**Déclenchement Manuel** :
Pour forcer une exécution (ex: Ingestion immédiate) :
```bash
curl -X GET "https://acces-direct-aide.fr/api/cron/pipeline" \
     -H "Authorization: Bearer <CRON_SECRET>"
```
Ou via l'interface Admin `/admin/runs` si implémentée.

## 5. Renouvellement de Secrets

### 5.1 Rotation ADMIN_TOKEN
1. Générer un nouveau token fort (ex: `openssl rand -hex 32`).
2. Mettre à jour `ADMIN_TOKEN` dans Vercel (Environments).
3. Redéployer (Redeploy) pour prise en compte.
4. Informer l'équipe (et mettre à jour les gestionnaires de mots de passe).
