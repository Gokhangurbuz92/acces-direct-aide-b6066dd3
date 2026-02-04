# Runbook (Exploitation)

Procédures de résolution d'incidents et maintenance courante.

## 1. Incidents Critiques

### Erreur 500 sur l'API
1. **Logs** : Vérifier les logs Vercel (Runtime Logs).
2. **Sentry** : Consulter le dashboard Sentry pour la stacktrace.
3. **Database** : Vérifier la connectivité Neon (Dashboard Neon).
4. **Action** : Si bug code, rollback (voir ci-dessous). Si infra, contacter support (Vercel/Neon).

### Site Inaccessible (Page Blanche)
1. **Build** : Vérifier le dernier déploiement Vercel.
2. **Console** : Vérifier la console navigateur pour erreurs JS bloquantes.
3. **Rollback** : Revenir à la version précédente via Vercel Dashboard ("Instant Rollback").

### Cron Job Failure (Ingestion/Sync)
1. **Logs** : Vérifier les logs de la fonction serverless du Cron.
2. **Reprise** : Relancer manuellement via `/admin/runs` ou URL directe si sécurisée.

## 2. Procédures Courantes

### Rollback
En cas de régression critique :
1. Aller sur le dashboard Vercel > Deployments.
2. Identifier le dernier déploiement vert (stable).
3. Cliquer sur "..." > "Promote to Production" (ou "Rollback").

### Rotation des Secrets
Si une clé (ex: `JWT_SECRET`) est compromise :
1. Générer une nouvelle clé.
2. Mettre à jour les Variables d'Environnement Vercel.
3. Redéployer (Redeploy) pour prise en compte.
4. **Impact** : Tous les utilisateurs seront déconnectés.

### Sauvegarde / Restore
- **Base de données** : Géré par Neon (Point-in-time recovery).
- **Contenu** : Les snapshots de contenu (Aides/Démarches) sont stockés dans la table `SourceSnapshot` ou `versions` (selon implémentation).
