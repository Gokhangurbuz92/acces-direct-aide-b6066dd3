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
   - `KV_REST_API_URL` et `KV_REST_API_TOKEN` (Upstash REST) pour le Rate Limit.

### Rate Limit (Quota Exceeded)
Le système utilise **Upstash REST** (via HTTPS).
- Backend Actif : Vérifier les logs pour `[RateLimit] Init: Backend=KV_REST_API`.
- Fallback : Si les clés manquent ou échouent, le système passe en `MEMORY` (logs: `Backend=MEMORY`).
- Configuration : `api/_utils/rateLimit.js`.
### Base de Données Inaccessible
1. Vérifier le status Neon.tech.
2. Si maintenance, activer le mode maintenance (page statique sur Vercel si configuré).
3. Restaurer un snapshot si corruption de données (voir `docs/BACKUP_RESTORE.md` si existant, ou Dashboard Neon).

### Cron Jobs en échec
1. Vérifier `/api/admin/runs` pour voir les logs d'exécution.
2. Si timeout, réduire le volume de données traité### 3. Commandes Utiles

Pour déclencher le pipeline manuellement (Production ou Local) :

Il y a 3 méthodes d'authentification supportées :
1.  **Header Bearer** (Recommandé) : `-H "Authorization: Bearer <CRON_SECRET>"`
2.  **Query Param** (Fallback) : `?secret=<CRON_SECRET>`
3.  **Vercel Cron** (Automatique) : Header `x-vercel-cron: 1`

#### Smoke Test (Vérification Rapide)
```bash
# Via Bearer Token
curl -X POST "https://votre-url.net/api/cron/pipeline?source=structures&mode=smoke" \
     -H "Authorization: Bearer $CRON_SECRET"

# Via Query Param
curl -X POST "https://votre-url.net/api/cron/pipeline?source=structures&mode=smoke&secret=$CRON_SECRET"
```

#### Ingestion Complète (Aides)
```bash
curl -X POST "https://votre-url.net/api/cron/pipeline?source=aides" \
     -H "Authorization: Bearer $CRON_SECRET"
```
   # Run RSS (via Alias 'actualites') - Safe Limit (Start with 50)
   # Note: Ajustez la limite si durationMs > 35s (Timeout à 50s)
   curl -X POST "https://.../api/cron/pipeline?source=actualites&limit=50" \
     --header "Authorization: Bearer \$CRON_SECRET"
   ```

   **Réponse Type (JSON):**
   Le pipeline retourne désormais des statistiques détaillées pour le monitoring :
   ```json
   {
     "ok": true,
     "source": "demarches",
     "sourceResolved": "aides",
     "stats": {
       "fetched": 5,
       "processed": 5,
       "created": 2,
       "updated": 3,
       "skippedExisting": 0,
       "errors": [],
       "durationByStage": { "fetchMs": 120, "processingMs": 45 }
     }
   }
   ```

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
