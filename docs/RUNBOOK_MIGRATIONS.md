# Runbook: Migrations Prisma

**Date:** 3 février 2026  
**Responsable:** DevOps / Tech Lead  
**Objectif:** Gérer les migrations Prisma de manière sûre et reproductible en production

---

## 📋 Table des Matières

1. [Principes Généraux](#principes-généraux)
2. [Commandes Standard](#commandes-standard)
3. [Diagnostic des Problèmes](#diagnostic-des-problèmes)
4. [Résolution P3009 (Migration Failed)](#résolution-p3009-migration-failed)
5. [Résolution P3008 (Already Exists)](#résolution-p3008-already-exists)
6. [Rollback et Recovery](#rollback-et-recovery)
7. [Checklist Pré-Déploiement](#checklist-pré-déploiement)

---

## Principes Généraux

### Règles d'Or

1. **JAMAIS `prisma migrate dev` en production**
   - `migrate dev` est pour le développement local uniquement
   - Utiliser `prisma migrate deploy` en staging/production

2. **Migrations idempotentes**
   - Toujours utiliser `IF NOT EXISTS` / `IF EXISTS`
   - Permet de rejouer une migration sans erreur

3. **Tester sur staging d'abord**
   - Toute migration doit passer sur staging avant prod
   - Vérifier l'état de `_prisma_migrations` après déploiement

4. **Backup avant migration critique**
   - Snapshot DB avant migration structurelle majeure
   - Neon: utiliser les snapshots automatiques

5. **Pas de migration destructrice sans garde-fou**
   - Jamais de `DROP TABLE` / `DROP COLUMN` sans confirmation explicite
   - Utiliser des migrations en 2 étapes (deprecate → remove)

---

## Commandes Standard

### Développement Local

```bash
# Créer une nouvelle migration
npm run db:migrate
# ou
npx prisma migrate dev --name descriptive_name

# Réinitialiser la DB locale (DANGER: perte de données)
npx prisma migrate reset

# Générer le client Prisma (après modification schema)
npx prisma generate
```

### Staging / Production

```bash
# Déployer les migrations en attente
npm run db:deploy
# ou
npx prisma migrate deploy

# Vérifier l'état des migrations
npx prisma migrate status

# Résoudre une migration failed (voir sections suivantes)
npx prisma migrate resolve --applied <migration_name>
npx prisma migrate resolve --rolled-back <migration_name>
```

### Inspection DB

```bash
# Se connecter à la DB (Neon)
psql $DATABASE_URL

# Vérifier l'historique des migrations
SELECT migration_name, finished_at, logs 
FROM _prisma_migrations 
ORDER BY started_at DESC 
LIMIT 10;

# Identifier les migrations failed
SELECT migration_name, started_at, logs 
FROM _prisma_migrations 
WHERE finished_at IS NULL OR logs LIKE '%error%';
```

---

## Diagnostic des Problèmes

### Symptômes Courants

#### 1. Erreur P3009: "Migration failed to apply"
**Cause:** Migration a échoué pendant l'exécution (erreur SQL)

**Diagnostic:**
```sql
SELECT migration_name, logs 
FROM _prisma_migrations 
WHERE finished_at IS NULL;
```

**Actions:** Voir [Résolution P3009](#résolution-p3009-migration-failed)

#### 2. Erreur P3008: "Already exists"
**Cause:** Colonne/table/index existe déjà (migration non idempotente)

**Exemple:**
```
ERROR: column "retrieved_at" of relation "Aide" already exists
```

**Actions:** Voir [Résolution P3008](#résolution-p3008-already-exists)

#### 3. Erreur P3014: "Pending migrations"
**Cause:** Migrations non appliquées sur la DB

**Solution:**
```bash
npx prisma migrate deploy
```

#### 4. Extension manquante (unaccent)
**Cause:** Extension PostgreSQL non installée

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
```

---

## Résolution P3009 (Migration Failed)

### Scénario: Migration a échoué partiellement

**Étape 1: Identifier la migration failed**
```sql
SELECT migration_name, started_at, logs 
FROM _prisma_migrations 
WHERE finished_at IS NULL;
```

**Étape 2: Analyser les logs**
- Lire le champ `logs` pour comprendre l'erreur
- Vérifier si la migration a été partiellement appliquée

**Étape 3: Vérifier l'état réel de la DB**
```sql
-- Exemple: vérifier si une colonne existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Aide' AND column_name = 'retrieved_at';
```

**Étape 4: Décider de la stratégie**

#### Option A: Migration partiellement appliquée (RECOMMANDÉ)
Si la migration a créé certaines colonnes mais pas toutes:

1. Créer une migration corrective idempotente:
```sql
-- migration: 20260203_fix_traceability_fields
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "retrieved_at" TIMESTAMP(3);
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "last_checked_at" TIMESTAMP(3);
-- etc.
```

2. Marquer la migration failed comme "rolled-back":
```bash
npx prisma migrate resolve --rolled-back 20250202120000_add_aides_fields_and_unaccent
```

3. Appliquer la nouvelle migration:
```bash
npx prisma migrate deploy
```

#### Option B: Migration totalement échouée
Si aucune modification n'a été appliquée:

1. Marquer comme "rolled-back":
```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

2. Corriger le SQL de la migration originale (ajouter IF NOT EXISTS)

3. Recréer la migration:
```bash
npx prisma migrate dev --name <migration_name>_fixed
```

#### Option C: Migration réussie mais marquée failed (rare)
Si toutes les modifications sont présentes mais `finished_at` est NULL:

```bash
npx prisma migrate resolve --applied <migration_name>
```

**⚠️ ATTENTION:** Vérifier manuellement que TOUTES les modifications sont appliquées avant de marquer "applied".

---

## Résolution P3008 (Already Exists)

### Scénario: Colonne/table existe déjà

**Cause:** Migration non idempotente rejouée

**Solution Immédiate:**

1. **Vérifier l'état de la DB:**
```sql
-- Lister les colonnes d'une table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Aide' 
ORDER BY ordinal_position;
```

2. **Créer une migration corrective idempotente:**
```sql
-- Utiliser IF NOT EXISTS
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "retrieved_at" TIMESTAMP(3);
```

3. **Appliquer la migration:**
```bash
npx prisma migrate deploy
```

**Solution Préventive:**

Toujours écrire des migrations idempotentes:

```sql
-- ✅ BON (idempotent)
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "retrieved_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "idx_aide_statut" ON "Aide"("statut");
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ❌ MAUVAIS (non idempotent)
ALTER TABLE "Aide" ADD COLUMN "retrieved_at" TIMESTAMP(3);
CREATE INDEX "idx_aide_statut" ON "Aide"("statut");
CREATE EXTENSION unaccent;
```

---

## Rollback et Recovery

### Rollback d'une Migration

**⚠️ ATTENTION:** Prisma ne supporte pas le rollback automatique. Il faut le faire manuellement.

**Étape 1: Créer une migration de rollback**
```sql
-- migration: 20260203_rollback_traceability
ALTER TABLE "Aide" DROP COLUMN IF EXISTS "retrieved_at";
ALTER TABLE "Aide" DROP COLUMN IF EXISTS "last_checked_at";
```

**Étape 2: Appliquer le rollback**
```bash
npx prisma migrate deploy
```

**Étape 3: Mettre à jour le schema.prisma**
- Supprimer les champs du schema
- Régénérer le client: `npx prisma generate`

### Recovery après Échec Critique

**Scénario:** DB dans un état incohérent

**Option 1: Restore depuis backup (RECOMMANDÉ)**
```bash
# Neon: utiliser l'interface web pour restore un snapshot
# Ou via CLI Neon (si disponible)
```

**Option 2: Réinitialiser les migrations (DANGER)**
```bash
# ⚠️ UNIQUEMENT EN DEV/STAGING
# Supprime toutes les données
npx prisma migrate reset
```

**Option 3: Synchroniser manuellement**
```bash
# Forcer le schema actuel (sans migrations)
npx prisma db push --skip-generate
```

---

## Checklist Pré-Déploiement

### Avant de déployer une migration en production

- [ ] **Migration testée sur DB locale**
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```

- [ ] **Migration idempotente (IF NOT EXISTS)**
  - Vérifier chaque `ALTER TABLE`, `CREATE INDEX`, `CREATE EXTENSION`

- [ ] **Migration testée sur staging**
  ```bash
  # Sur staging
  npx prisma migrate deploy
  npx prisma migrate status
  ```

- [ ] **Vérifier l'état de `_prisma_migrations` sur staging**
  ```sql
  SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;
  ```

- [ ] **Backup DB prod (si migration critique)**
  - Neon: créer un snapshot manuel

- [ ] **Plan de rollback documenté**
  - Écrire la migration inverse
  - Tester le rollback sur staging

- [ ] **Fenêtre de maintenance (si nécessaire)**
  - Migrations lourdes (ajout d'index sur grosse table)
  - Migrations avec downtime

- [ ] **Monitoring post-déploiement**
  - Vérifier logs Sentry
  - Vérifier métriques DB (latence, erreurs)

---

## Migrations Problématiques Identifiées

### 1. Migration `20250202120000_add_aides_fields_and_unaccent`

**Problème:** Date incohérente (2025 au lieu de 2026) + non idempotente

**SQL Original:**
```sql
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- ✅ OK
ALTER TABLE "Aide" ADD COLUMN "apply_url" TEXT; -- ❌ Non idempotent
ALTER TABLE "Aide" ADD COLUMN "fetched_at" TIMESTAMP(3); -- ❌ Non idempotent
-- etc.
```

**Solution:** Migration corrective créée (`20260203_fix_aide_fields_idempotent`)

**Statut:** ✅ Résolu (migration corrective idempotente créée)

---

## Commandes Utiles

### Vérifier l'état des migrations
```bash
npx prisma migrate status
```

### Lister les migrations appliquées
```sql
SELECT migration_name, finished_at 
FROM _prisma_migrations 
WHERE finished_at IS NOT NULL 
ORDER BY started_at DESC;
```

### Vérifier si une colonne existe
```sql
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'Aide' AND column_name = 'retrieved_at'
);
```

### Vérifier si une extension est installée
```sql
SELECT * FROM pg_extension WHERE extname = 'unaccent';
```

### Taille des tables
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Contacts & Escalation

**Équipe DevOps:** Blackbox Agent  
**DB Provider:** Neon (PostgreSQL)  
**Documentation Prisma:** https://www.prisma.io/docs/concepts/components/prisma-migrate

**En cas d'urgence:**
1. Vérifier Sentry pour erreurs DB
2. Vérifier logs Vercel
3. Contacter support Neon si problème infrastructure

---

**Dernière mise à jour:** 3 février 2026  
**Version:** 1.0
