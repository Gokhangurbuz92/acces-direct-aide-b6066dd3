# Démarches Ingestion Documentation

## Overview

This document describes the démarches (administrative procedures) ingestion system for AccesDirectAide.

## Architecture

### Data Flow

```
Official Sources → Ingestion Script → Database → API → Frontend
     ↓                    ↓              ↓        ↓       ↓
service-public.fr   ingest-demarches  Prisma   /api/   Demarches.jsx
                    -real.js          Demarche demarches DemarcheDetail.jsx
```

### Components

1. **Ingestion Script** (`scripts/ingest-demarches-real.js`)
   - Curated data from official French administrative sources
   - Idempotent upserts using content hashing
   - Automatic categorization
   - Source tracking with exact URLs

2. **Database Schema** (`prisma/schema.prisma`)
   - `Demarche` model with full-text search support
   - Relations to `AidCategory` and `LifeSituation`
   - Ingestion metadata fields (content_hash, source_url_exact, etc.)

3. **API Endpoints** (`api/_handlers/demarches.js`)
   - GET /api/demarches - List with filters (category, situation, search)
   - GET /api/demarches?slug=xxx - Single démarche by slug
   - GET /api/demarches?id=xxx - Single démarche by ID

4. **Frontend Pages**
   - `/src/pages/Demarches.jsx` - List view with filters
   - `/src/pages/DemarcheDetail.jsx` - Detail view with steps, documents, sources

## Content Structure

Each démarche includes:

### Required Fields
- **titre**: Clear, actionable title
- **slug**: URL-friendly identifier
- **categorie**: Category (Identité, Santé, Emploi, etc.)
- **statut**: Publication status (brouillon, publie)

### Content Fields
- **description_courte**: Brief summary (1-2 sentences)
- **pour_qui**: Who is concerned by this procedure
- **etapes**: Ordered steps with numero, titre, description
- **documents_necessaires**: Required documents list
- **delai**: Processing time
- **cout**: Cost information
- **ou_faire**: Where to do it (online/office)
- **lien_officiel**: Official link to start the procedure

### Metadata Fields
- **source_url_exact**: Exact source URL for traceability
- **date_verification**: Last verification date
- **territory_scope**: Geographic scope (FRANCE, ALSACE, etc.)
- **departements**: Applicable departments (67, 68 for Alsace)
- **audiences**: Target audiences
- **mots_cles**: Keywords for search

### Ingestion Fields
- **content_hash**: SHA-256 hash for deduplication
- **published_at**: Publication timestamp
- **categoryId**: Foreign key to AidCategory

## Content Rules

### Writing Style
- **Plain French**: Avoid administrative jargon
- **Short paragraphs**: 2-3 sentences max
- **Actionable**: Focus on what the user needs to do
- **FALC-friendly**: Simple language, clear structure

### Source Requirements
- **Official sources only**: service-public.fr, prefecture websites, etc.
- **Deep links**: Link to the exact page, not homepage
- **Verification date**: Always record when content was verified
- **Alsace-specific**: Include local variations when applicable

### Categorization
Standard categories:
- Identité (ID cards, passports)
- Étrangers (Foreign nationals)
- Citoyenneté (Voting, military service)
- Social (RSA, Prime d'activité)
- Santé (Health insurance, C2S)
- Travail (Employment, unemployment)
- Logement (Housing, HLM)
- Transport (Driver's license, vehicle registration)
- Finances (Taxes, banking)
- Famille (Family benefits, childcare)

## Running Ingestion

### Manual Execution

```bash
# Run the ingestion script directly
node scripts/ingest-demarches-real.js

# With environment variables
DATABASE_URL="postgresql://..." node scripts/ingest-demarches-real.js
```

### Via Cron API

```bash
# Trigger via API (requires CRON_SECRET)
curl -X POST "https://your-domain.com/api/cron/pipeline?source=demarches" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Automated Schedule

Configured in `vercel.json`:
- **Weekly refresh**: Every Sunday at 2 AM (0 2 * * 0)
- Ensures content stays up-to-date without manual intervention

## Deduplication Strategy

The system uses content hashing to prevent duplicates:

1. **Hash Generation**: SHA-256 of `titre + pour_qui + etapes`
2. **Upsert Logic**: 
   - If hash exists → skip (no changes)
   - If hash differs → update (content changed)
   - If slug new → create (new démarche)

This ensures:
- No duplicate entries
- Automatic updates when source content changes
- Idempotent execution (safe to run multiple times)

## Adding New Démarches

### Step 1: Research
1. Find official source (service-public.fr preferred)
2. Verify information is current
3. Note exact URL and verification date

### Step 2: Structure Content
```javascript
{
  titre: "Clear, actionable title",
  categorie: "Category",
  description_courte: "Brief summary",
  pour_qui: "Who is concerned",
  etapes: [
    {
      numero: 1,
      titre: "Step title",
      description: "What to do"
    }
  ],
  documents_necessaires: ["Doc 1", "Doc 2"],
  delai: "Processing time",
  cout: "Cost",
  ou_faire: "Where to do it",
  lien_officiel: "https://...",
  source_url_exact: "https://www.service-public.fr/...",
  territory_scope: "FRANCE",
  departements: ["67", "68"],
  audiences: ["particuliers"],
  mots_cles: ["keyword1", "keyword2"],
  statut: "publie"
}
```

### Step 3: Add to Script
1. Open `scripts/ingest-demarches-real.js`
2. Add entry to `demarchesData` array
3. Test locally
4. Commit and deploy

## Monitoring

### Logs
Check ingestion logs in database:
```sql
SELECT * FROM "ImportLog" 
WHERE source_name = 'CRON_DEMARCHES' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### Metrics
- **Created**: New démarches added
- **Updated**: Existing démarches modified
- **Skipped**: No changes detected
- **Errors**: Failed ingestions

### Health Checks
- Verify cron runs weekly
- Check for errors in logs
- Monitor user feedback for outdated content

## Troubleshooting

### Common Issues

**Issue**: Démarches not appearing on frontend
- Check `statut = 'publie'` in database
- Verify `published_at` is set
- Check API response: `/api/demarches`

**Issue**: Duplicate entries
- Verify content_hash is being generated
- Check slug uniqueness
- Review upsert logic

**Issue**: Outdated content
- Update source_url_exact
- Modify content in script
- Re-run ingestion
- Update date_verification

**Issue**: Search not working
- Verify search_vector is populated
- Check FTS migration ran successfully
- Test with simple queries first

## Future Enhancements

### Planned Features
1. **Automatic scraping**: Fetch content from service-public.fr API
2. **Change detection**: Alert when source content changes
3. **Multi-language**: Support for German (Alsace)
4. **User contributions**: Allow verified users to suggest updates
5. **AI summarization**: Auto-generate FALC summaries

### Data Quality
1. **Validation rules**: Enforce required fields
2. **Quality scoring**: Rate completeness and accuracy
3. **Review workflow**: Admin approval for changes
4. **Version history**: Track content changes over time

## References

- [Service-Public.fr](https://www.service-public.fr/)
- [ANEF (Étrangers)](https://administration-etrangers-en-france.interieur.gouv.fr/)
- [CAF](https://www.caf.fr/)
- [Ameli](https://www.ameli.fr/)
- [France Travail](https://www.francetravail.fr/)
- [ANTS](https://ants.gouv.fr/)

## Contact

For questions or issues with démarches ingestion:
- Technical: Check GitHub issues
- Content: Review with domain experts
- Urgent: Contact project maintainers
