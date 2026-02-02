# Commandes Utiles - Page /aides

## 🔧 Développement Local

### Installation
```bash
npm install
```

### Migrations Database
```bash
# Appliquer migrations
npm run db:deploy

# Créer nouvelle migration
npm run db:migrate

# Générer Prisma client
npx prisma generate

# Ouvrir Prisma Studio
npx prisma studio
```

### Serveur Dev
```bash
# Démarrer serveur
npm run dev

# Accéder à l'app
open http://localhost:5173
```

### Vérifications Code
```bash
# TypeScript
npm run typecheck

# Linting
npm run lint

# Fix lint auto
npm run lint -- --fix

# Build
npm run build
```

---

## 🧪 Tests

### Tests Unitaires
```bash
# Tous les tests
npm run test

# Tests API seulement
npm run test:api

# Mode watch
npm run test -- --watch
```

### Tests E2E
```bash
# Installer Playwright
npx playwright install

# Lancer tests E2E
npx playwright test e2e/aides.spec.js

# Mode UI
npx playwright test --ui

# Mode debug
npx playwright test --debug
```

---

## 🗄️ Database

### Requêtes Utiles

#### Compter les aides
```sql
SELECT COUNT(*) FROM "Aide" WHERE statut = 'publie';
```

#### Voir dernières aides
```sql
SELECT id, slug, titre, theme, organisme, fetched_at 
FROM "Aide" 
WHERE statut = 'publie' 
ORDER BY created_at DESC 
LIMIT 10;
```

#### Vérifier search_vector
```sql
SELECT id, titre, search_vector 
FROM "Aide" 
WHERE search_vector IS NOT NULL 
LIMIT 5;
```

#### Voir facettes
```sql
-- Themes
SELECT theme, COUNT(*) as count 
FROM "Aide" 
WHERE statut = 'publie' AND theme IS NOT NULL 
GROUP BY theme 
ORDER BY count DESC;

-- Organismes
SELECT organisme, COUNT(*) as count 
FROM "Aide" 
WHERE statut = 'publie' AND organisme IS NOT NULL 
GROUP BY organisme 
ORDER BY count DESC;

-- Territoires
SELECT unnest(territoires) as territoire, COUNT(*) as count 
FROM "Aide" 
WHERE statut = 'publie' 
GROUP BY territoire 
ORDER BY count DESC;
```

#### Logs ingestion
```sql
SELECT ran_at, status, items_created_count, items_updated_count, items_skipped_count, duration_ms 
FROM "UpdateLog" 
ORDER BY ran_at DESC 
LIMIT 10;
```

---

## 🔄 Ingestion

### Tester Connecteur (Dry Run)
```bash
# Région Grand Est
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids?sources=region-grand-est&dryRun=true"

# AGEFIPH
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids?sources=agefiph&dryRun=true"

# Toutes les sources
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids?dryRun=true"
```

### Lancer Ingestion Réelle
```bash
# Région Grand Est (limité à 5 items)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids?sources=region-grand-est&limit=5"

# AGEFIPH (limité à 5 items)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids?sources=agefiph&limit=5"

# Toutes les sources (production)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids"
```

### Vérifier Résultats
```bash
# Voir statistiques
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids?dryRun=true" | jq

# Compter nouvelles aides
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Aide\" WHERE fetched_at > NOW() - INTERVAL '1 hour';"
```

---

## 🌐 API Testing

### Endpoints Aides

#### Liste
```bash
# Toutes les aides publiées
curl "http://localhost:5173/api/aides?statut=publie&limit=10" | jq

# Filtrer par thème
curl "http://localhost:5173/api/aides?theme=logement&statut=publie" | jq

# Filtrer par territoire
curl "http://localhost:5173/api/aides?territoire=67&statut=publie" | jq

# Recherche
curl "http://localhost:5173/api/aides?q=handicap&statut=publie" | jq

# Combiné
curl "http://localhost:5173/api/aides?theme=handicap&territoire=national&statut=publie" | jq
```

#### Détail
```bash
# Par slug
curl "http://localhost:5173/api/aides?slug=test-aide" | jq

# Par ID
curl "http://localhost:5173/api/aides?id=UUID" | jq
```

#### Taxonomie
```bash
curl "http://localhost:5173/api/taxonomy" | jq
```

---

## 🚀 Production

### Déploiement Vercel
```bash
# Build local
npm run build

# Preview
npm run preview

# Deploy (via Git push)
git push origin main
```

### Vérifier Production
```bash
# Health check
curl https://www.accesdirectaide.fr/api/health

# Aides
curl "https://www.accesdirectaide.fr/api/aides?statut=publie&limit=5" | jq

# Taxonomie
curl "https://www.accesdirectaide.fr/api/taxonomy" | jq
```

### Ingestion Production
```bash
# Dry run
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.accesdirectaide.fr/api/cron/ingest-aids?dryRun=true" | jq

# Réel (limité)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.accesdirectaide.fr/api/cron/ingest-aids?sources=region-grand-est&limit=10" | jq
```

---

## 🔍 Debug

### Logs Vercel
```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Voir logs
vercel logs
```

### Logs Locaux
```bash
# Suivre logs dev server
npm run dev | grep AIDE

# Filtrer erreurs
npm run dev 2>&1 | grep ERROR
```

### Prisma Debug
```bash
# Activer logs SQL
export DEBUG="prisma:query"
npm run dev
```

---

## 🧹 Maintenance

### Nettoyer Doublons
```sql
-- Trouver doublons par content_hash
SELECT content_hash, COUNT(*) as count 
FROM "Aide" 
WHERE content_hash IS NOT NULL 
GROUP BY content_hash 
HAVING COUNT(*) > 1;

-- Supprimer doublons (garder le plus récent)
DELETE FROM "Aide" a
USING "Aide" b
WHERE a.content_hash = b.content_hash 
  AND a.created_at < b.created_at;
```

### Régénérer search_vector
```sql
-- Forcer mise à jour search_vector
UPDATE "Aide" SET "updatedAt" = "updatedAt";
```

### Nettoyer Logs Anciens
```sql
-- Supprimer logs > 30 jours
DELETE FROM "UpdateLog" WHERE ran_at < NOW() - INTERVAL '30 days';
```

---

## 📊 Monitoring

### Métriques Ingestion
```sql
-- Stats dernières 24h
SELECT 
  source_name,
  COUNT(*) as runs,
  SUM(items_created_count) as created,
  SUM(items_updated_count) as updated,
  SUM(items_skipped_count) as skipped,
  AVG(duration_ms) as avg_duration_ms
FROM "UpdateLog"
WHERE ran_at > NOW() - INTERVAL '24 hours'
GROUP BY source_name;
```

### Qualité Données
```sql
-- Aides sans source_url
SELECT COUNT(*) FROM "Aide" WHERE source_url IS NULL;

-- Aides sans theme
SELECT COUNT(*) FROM "Aide" WHERE theme IS NULL;

-- Aides sans slug
SELECT COUNT(*) FROM "Aide" WHERE slug IS NULL;
```

---

## 🆘 Troubleshooting

### Erreur "search_vector does not exist"
```bash
# Appliquer migration
npm run db:deploy

# Vérifier
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'Aide' AND column_name = 'search_vector';"
```

### Erreur "unaccent function does not exist"
```sql
-- Créer extension
CREATE EXTENSION IF NOT EXISTS unaccent;
```

### Ingestion échoue
```bash
# Vérifier logs
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids?dryRun=true" 2>&1 | tee ingestion.log

# Vérifier connectivité
curl -I https://www.grandest.fr/vos-aides/
curl -I https://www.agefiph.fr/aides-handicap
```

### Tests échouent
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Régénérer Prisma
npx prisma generate

# Relancer tests
npm run test
```

---

## 📚 Ressources

- **Audit**: `AUDIT_AIDES.md`
- **Guide Ingestion**: `docs/INGESTION_GUIDE.md`
- **PR Description**: `PR_DESCRIPTION_AIDES.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Taxonomie**: `config/taxonomy.json`
