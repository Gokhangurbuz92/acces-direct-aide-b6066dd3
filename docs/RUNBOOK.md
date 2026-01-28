# Runbook & Exploitation

Ce document décrit les procédures de résolution d'incidents et de maintenance.

## Incidents Critiques

### Erreur 500 sur l'API
1. **Vérifier les Logs Vercel** : Identifier la stacktrace.
2. **Vérifier la Base de Données** : La connexion Postgres est-elle active ?
   - Dashboard Neon > Connection string.
   - Vérifier `DATABASE_URL` dans les env vars Vercel.
3. **Vérifier les Secrets** :
   - `JWT_SECRET`, `ADA_ENCRYPTION_KEY`, `CRON_SECRET` sont-ils présents ?

### Base de Données Inaccessible
1. Vérifier le status Neon.tech.
2. Si maintenance, activer le mode maintenance (page statique sur Vercel si configuré).
3. Restaurer un snapshot si corruption de données (voir `docs/BACKUP_RESTORE.md` si existant, ou Dashboard Neon).

### Cron Jobs en échec
1. Vérifier `/api/admin/runs` pour voir les logs d'exécution.
2. Si timeout, réduire le volume de données traité par batch.
3. Déclencher manuellement via l'URL : `curl -H "Authorization: Bearer <CRON_SECRET>" https://.../api/cron/pipeline`

## Procédures de Rollback

Si une mise à jour casse la production :
1. **Instant Rollback Vercel** :
   - Aller sur le Dashboard Vercel > Deployments.
   - Trouver le dernier déploiement vert ("Ready").
   - Cliquer sur les 3 points > "Instant Rollback".
2. **Revert Git** :
   - `git revert main` (ou le commit fautif).
   - Merger la PR de revert.

## Maintenance

### Purge RGPD
- Automatisée via Cron `/api/cron/purge` (Logs > 90 jours, etc.).
- Vérification manuelle possible via `/admin/privacy`.

### Rotation des clés
- Si `JWT_SECRET` est compromis :
  1. Générer un nouveau secret.
  2. Mettre à jour la variable d'environnement Vercel.
  3. Redéployer (Invalidation immédiate de tous les tokens Pro).
