# RSS Ingestion System

## Overview

The RSS ingestion system automatically fetches news from official French government sources and populates the Actualités section with reliable, categorized, and deduplicated content.

## Features

- **Reliable Sources**: Official RSS feeds from service-public.fr, gouvernement.fr, CAF, etc.
- **Auto-Categorization**: Intelligent categorization based on content keywords
- **Deduplication**: SHA-256 hash-based deduplication to prevent duplicates
- **Reliability Scoring**: Trust-based scoring (90+ for official sources)
- **Auto-Publishing**: News items are automatically published
- **Update Detection**: Content hash comparison to detect and update changed items

## Architecture

### Components

1. **RSS Sources** (`RssSource` table)
   - Stores feed URLs and metadata
   - Tracks last run time and error counts
   - Trust levels: OFFICIAL, VERIFIED, COMMUNITY

2. **Ingestion Endpoint** (`/api/cron/rss-ingest`)
   - Fetches RSS feeds using `rss-parser`
   - Processes items with deduplication
   - Categorizes and scores content
   - Updates database

3. **Actualités** (`Actualite` table)
   - Stores processed news items
   - Includes dedupe_hash, score_fiabilite, categorie
   - Auto-published with statut='publie'

## Usage

### Manual Trigger

```bash
# Trigger ingestion for all enabled sources
node scripts/trigger-rss-ingestion.js

# Limit to 10 items per source
node scripts/trigger-rss-ingestion.js --limit=10

# Dry run (no database changes)
node scripts/trigger-rss-ingestion.js --dry-run

# Specific source only
node scripts/trigger-rss-ingestion.js --source-id=<uuid>
```

### Cron Endpoint

```bash
# Via HTTP (requires CRON_SECRET)
curl -X GET "https://your-domain.com/api/cron/rss-ingest?secret=YOUR_CRON_SECRET"

# With Vercel Cron header
curl -X GET "https://your-domain.com/api/cron/rss-ingest" \
  -H "x-vercel-cron: 1"
```

### Vercel Cron Configuration

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

This runs every 3 hours. Adjust schedule as needed:
- `0 */1 * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 8,14,20 * * *` - At 8am, 2pm, 8pm

## Categorization

News items are automatically categorized based on keywords:

- **logement**: logement, hlm, loyer, apl
- **sante**: santé, médical, cpam, soins
- **handicap**: handicap, aah, mdph
- **emploi**: emploi, chômage, pôle emploi, rsa
- **famille**: famille, enfant, caf, allocation
- **budget**: budget, impôt, taxe, prime
- **mobilite**: transport, permis, mobilité
- **justice**: justice, droit, tribunal
- **numerique**: numérique, internet, téléservice
- **etrangers**: étranger, immigration, titre de séjour
- **general**: Default fallback

## Reliability Scoring

Scores are calculated based on:

1. **Source Trust Level**:
   - OFFICIAL: 90 base points
   - VERIFIED: 70 base points
   - COMMUNITY: 50 base points

2. **Content Quality**:
   - Title length > 10 chars: +5 points
   - Content length > 100 chars: +5 points

Maximum score: 100

## Deduplication

Items are deduplicated using:

1. **dedupe_hash**: SHA-256 hash of `title + link`
2. **canonical_url**: Unique constraint on source URL
3. **slug**: Unique constraint with auto-increment suffix

## Monitoring

### Check Ingestion Logs

```sql
SELECT * FROM "UpdateLog" 
WHERE source_name = 'RSS_INGEST' 
ORDER BY ran_at DESC 
LIMIT 10;
```

### Check RSS Source Status

```sql
SELECT name, enabled, last_run_at, error_count, last_error 
FROM "RssSource" 
ORDER BY last_run_at DESC;
```

### Check Recent Actualités

```sql
SELECT titre, categorie, score_fiabilite, source_nom, fetched_at 
FROM "Actualite" 
WHERE statut = 'publie' 
ORDER BY date_publication DESC 
LIMIT 20;
```

## Adding New Sources

1. Add to `scripts/seed-rss-sources.js`:

```javascript
{
  name: "Source Name",
  feed_url: "https://example.com/feed.rss",
  domain: "example.com",
  trust_level: "OFFICIAL", // or VERIFIED, COMMUNITY
  enabled: true
}
```

2. Run seed script:

```bash
node scripts/seed-rss-sources.js
```

3. Test with specific source:

```bash
node scripts/trigger-rss-ingestion.js --source-id=<new-source-id> --limit=5
```

## Troubleshooting

### No items fetched

- Check RSS feed URL is accessible
- Verify feed format is valid RSS/Atom
- Check network connectivity
- Review error logs in `UpdateLog` table

### Duplicate items

- Verify dedupe_hash is being generated correctly
- Check for URL variations (http vs https, trailing slashes)
- Review canonical_url uniqueness

### Wrong categories

- Update keyword lists in `categorizeItem()` function
- Add domain-specific category mappings
- Consider manual category override field

### Low reliability scores

- Verify source trust_level is set correctly
- Check content quality indicators
- Review scoring algorithm in `calculateReliabilityScore()`

## Testing

Run integration tests:

```bash
npm run test:api -- rss-ingest.test.js
```

Tests cover:
- RSS feed fetching and parsing
- Deduplication logic
- Categorization accuracy
- Reliability scoring
- Slug uniqueness
- Update log creation
- Dry run mode

## Performance

- **Fetch time**: ~2-5s per RSS feed
- **Processing**: ~50-100 items/second
- **Memory**: ~50MB for typical run
- **Recommended frequency**: Every 3-6 hours

## Security

- CRON_SECRET required for endpoint access
- Vercel cron header (`x-vercel-cron: 1`) also accepted
- No user input processed (RSS feeds only)
- Content sanitized before storage
- Rate limiting via Vercel KV (if configured)
