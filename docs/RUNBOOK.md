# Runbook & Exploitation

Ce document décrit les procédures de gestion d'incidents et d'exploitation courante.

## 1. Gestion des Incidents

### Erreurs 500 (Internal Server Error)
1. **Identifier** : Consulter les logs (Vercel Logs ou Sentry).
2. **Analyser** : Chercher "Error" ou "Exception". Noter le `requestId`.
3. **Corriger** : Si bug code -> Hotfix PR. Si panne externe (DB, API tierce) -> Vérifier status provider.

### Base de Données Inaccessible
1. Vérifier `DATABASE_URL`.
2. Vérifier status provider (Neon/Supabase/etc.).
3. Vérifier quota de connexions (Prisma connection pool).

### Echec Cron Job (Ingestion)
1. Aller sur `/admin/sync` ou `/admin/runs` pour voir les logs d'exécution.
2. Relancer manuellement via l'interface Admin ou via API `/api/cron/pipeline?force=true` (si implémenté).

## 2. Rollback
Si un déploiement cause une régression critique :
1. Aller sur le dashboard Vercel.
2. Sélectionner le déploiement précédent ("Instant Rollback").
3. Vérifier que la version précédente est stable.
4. Analyser la cause sur l'environnement de Dev/Preview.

## 3. Maintenance
- **Purge RGPD** : Automatisée par cron (`/api/cron/gdpr-purge`). Vérifier les logs mensuels.
- **Renouvellement Secrets** : Voir `docs/ROTATE_SECRETS.md`.
