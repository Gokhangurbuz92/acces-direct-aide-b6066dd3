# Runbook - Exploitation & Incidents

## 1. Incidents Critiques (P0)

### 1.1 Erreur 500 sur Parcours Public (Aides, RDV)

**Impact** : Service indisponible pour l'usager.

**Actions** :
1.  **Vérifier Sentry** : Identifier l'exception (ex: `PrismaClientInitializationError`, `UpstashError`).
2.  **Vérifier Statut** : Base de données (Postgres) et Redis (Upstash).
3.  **Logs Vercel** : Filtrer par `level:error` pour voir la stack trace complète.
4.  **Si lié au déploiement** : Rollback Vercel via Dashboard (onglet "Deployments", bouton "Instant Rollback").
5.  **Si lié à la DB** : Vérifier la connexion string, redémarrer le pool si possible.

### 1.2 Base de Données Indisponible

**Symptômes** : Erreurs `P1001`, `P1003` (Prisma) ou timeouts.

**Actions** :
1.  **Status Page Neon/Supabase** : Vérifier panne fournisseur.
2.  **Connexions** : Vérifier nombre connexions actives vs limite.
3.  **Redémarrage** : Si instance managée, redémarrer via console cloud.

### 1.3 Cron Jobs en Échec (Ingestion)

**Impact** : Données obsolètes (Aides, Actus).

**Actions** :
1.  **Admin > Runs** : Consulter `/admin/runs` pour voir l'erreur exacte.
2.  **Relancer** : Via `/admin/sync` (bouton "Force Sync").
3.  **Logs** : Vérifier logs spécifiques au job (ex: `api/cron/ingest-aids`).

## 2. Procédures Courantes (P1)

### 2.1 Déploiement (Production)

1.  **Checklist** : Suivre `docs/RELEASE_CHECKLIST.md`.
2.  **Merge** : PR validée -> Merge vers `main`.
3.  **Vérification** : Smoke test sur URL production (ex: `/health`).

### 2.2 Rollback (Retour Arrière)

1.  **Vercel** : Dashboard > Project > Deployments > "..." sur version précédente > "Instant Rollback".
2.  **Base de données** : Si migration destructive appliquée, restaurer backup (voir `docs/BACKUP_RESTORE.md`).

### 2.3 Rotation des Secrets

Voir `docs/ROTATE_SECRETS.md`.
1.  Générer nouveau secret (ex: `JWT_SECRET`).
2.  Mettre à jour Vercel Environment Variables.
3.  Redéployer (Redeploy sans changement code).

## 3. Contact & Escalade

| Rôle | Contact | Responsabilité |
| :--- | :--- | :--- |
| **Tech Lead** | Slack / Email | Décision Rollback, Architecture. |
| **DevOps** | Slack / Email | Infra Vercel, DB, Secrets. |
| **Produit** | Slack / Email | Communication usagers si downtime. |
