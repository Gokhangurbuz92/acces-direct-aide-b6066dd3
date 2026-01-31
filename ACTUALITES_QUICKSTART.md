# Actualités Ingestion - Quick Start Guide

## 🚀 Getting Started (3 Steps)

### 1. Seed RSS Sources
```bash
node scripts/seed-rss-sources.js
```
**Output**: Creates 4-5 official French government RSS sources

### 2. Run Initial Ingestion
```bash
node scripts/trigger-rss-ingestion.js --limit=20
```
**Output**: Fetches and processes 20 news items per source

### 3. Verify
```bash
node scripts/verify-actualites.js
```
**Output**: Shows stats, recent items, and system health

## 📡 Cron Endpoint

### Local Testing
```bash
# Start dev server
npm run dev

# In another terminal, trigger ingestion
curl "http://localhost:5173/api/cron/rss-ingest?secret=YOUR_CRON_SECRET"
```

### Production (Vercel)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/rss-ingest",
      "schedule": "0 */3 * * *"
    }
  ]
}
```

Set environment variable:
```
CRON_SECRET=your-secure-random-string
```

## 🔍 Monitoring

### Check Recent News
```bash
node scripts/verify-actualites.js
```

### Database Queries
```sql
-- Recent actualités
SELECT titre, categorie, score_fiabilite, date_publication 
FROM "Actualite" 
WHERE statut = 'publie' 
ORDER BY date_publication DESC 
LIMIT 10;

-- Ingestion logs
SELECT ran_at, status, items_created_count, items_updated_count 
FROM "UpdateLog" 
WHERE source_name = 'RSS_INGEST' 
ORDER BY ran_at DESC 
LIMIT 5;

-- RSS source health
SELECT name, enabled, last_run_at, error_count 
FROM "RssSource" 
ORDER BY last_run_at DESC;
```

## 🛠️ Troubleshooting

### No items fetched
```bash
# Test with dry-run
node scripts/trigger-rss-ingestion.js --dry-run --limit=5

# Check specific source
node scripts/trigger-rss-ingestion.js --source-id=<uuid> --limit=5
```

### Verify RSS feed URLs
```bash
# Test feed manually
curl -I "https://www.service-public.fr/particuliers/actualites.rss"
```

### Check logs
```sql
SELECT errors FROM "UpdateLog" 
WHERE source_name = 'RSS_INGEST' 
AND errors IS NOT NULL 
ORDER BY ran_at DESC 
LIMIT 1;
```

## 📚 Documentation

- Full guide: `docs/RSS_INGESTION.md`
- PR description: `PR_ACTUALITES_INGESTION.md`
- Integration tests: `tests/integration/rss-ingest.test.js`

## 🎯 Key Features

✅ Auto-categorization (10 categories)
✅ Deduplication (SHA-256 hash)
✅ Reliability scoring (90+ for official sources)
✅ Search & filter UI
✅ Auto-publishing
✅ Content change detection

## 📊 Expected Results

After first ingestion:
- **Sources**: 4 enabled
- **Items**: 50-200 news articles
- **Categories**: Distributed across 10+ themes
- **Scores**: 90-100 (official sources)
- **UI**: Search and filter functional

## ⚡ Quick Commands

```bash
# Full ingestion
node scripts/trigger-rss-ingestion.js

# Limited test
node scripts/trigger-rss-ingestion.js --limit=5

# Dry run
node scripts/trigger-rss-ingestion.js --dry-run

# Verify system
node scripts/verify-actualites.js

# Run tests
npm run test:api -- rss-ingest.test.js
```

## 🔐 Security

- Endpoint requires `CRON_SECRET` or Vercel cron header
- No user input processed
- Content sanitized before storage
- Rate limiting via Vercel KV

## 📞 Support

For issues or questions:
1. Check `docs/RSS_INGESTION.md`
2. Review `UpdateLog` table for errors
3. Run verification script
4. Check RSS source URLs are accessible
