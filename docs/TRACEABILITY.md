# Data Traceability Model

## Overview

This document describes the traceability model for tracking the origin and provenance of all data ingested into the platform (Aides, Démarches, Structures, Dispositifs).

## Database Schema

### DataSource

Represents an external data source (API, website, RSS feed, etc.).

**Fields:**
- `id`: Unique identifier
- `name`: Human-readable name (e.g., "Service-Public.fr", "Strasbourg Open Data")
- `base_url`: Base URL of the source
- `region_scope`: Geographic scope (`national`, `67`, `68`, etc.)
- `license`: License information (e.g., "Open License 2.0")
- `trust_level`: Trust level (`OFFICIAL`, `VERIFIED`, `COMMUNITY`)
- `last_sync_at`: Last successful sync timestamp
- `last_status`: Last sync status (`success`, `partial`, `failed`)

### SourceDocument

Represents a specific document/page fetched from a DataSource.

**Fields:**
- `id`: Unique identifier
- `source_id`: Reference to DataSource
- `source_url_exact`: Exact URL of the document (unique constraint)
- `fetched_at`: When the document was fetched
- `content_hash`: Hash of the content (for change detection)
- `raw_excerpt`: Optional excerpt of raw content
- `http_status`: HTTP status code from fetch
- `license`: Document-specific license (if different from source)

**Relations:**
- Links to multiple Aide, Demarche, Structure, Dispositif records

### SyncRun

Tracks each synchronization/ingestion run.

**Fields:**
- `id`: Unique identifier
- `source_id`: Reference to DataSource (optional for multi-source runs)
- `started_at`: Run start timestamp
- `ended_at`: Run end timestamp
- `status`: Run status (`running`, `success`, `partial`, `failed`)
- `error`: Error message if failed
- `stats`: JSON stats (`{ fetched, created, updated, errors: [] }`)

## Content Model Updates

All content models (Aide, Demarche, Structure, Dispositif, ResourceAccessibility) now include:

- `source_document_id`: Foreign key to SourceDocument
- `sourceDocument`: Relation to SourceDocument

This allows tracking the exact source URL for each item.

## Migration Strategy

1. **Schema Migration**: Add new tables and foreign keys
2. **Backfill**: Optionally create SourceDocument records for existing data based on `source_url_exact` field
3. **Pipeline Update**: Update ingestion pipelines to create/link SourceDocument records

## Usage Examples

### Creating a Source

```javascript
const source = await prisma.dataSource.create({
  data: {
    name: "Service-Public.fr - Aides",
    base_url: "https://www.service-public.fr",
    region_scope: "national",
    license: "Open License 2.0",
    trust_level: "OFFICIAL"
  }
});
```

### Creating a SourceDocument

```javascript
const doc = await prisma.sourceDocument.create({
  data: {
    source_id: source.id,
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/F12",
    content_hash: "abc123...",
    http_status: 200
  }
});
```

### Linking Content to Source

```javascript
const aide = await prisma.aide.create({
  data: {
    titre: "Aide au logement",
    source_document_id: doc.id,
    // ... other fields
  }
});
```

### Querying with Traceability

```javascript
// Get aide with source information
const aide = await prisma.aide.findUnique({
  where: { id: aideId },
  include: {
    sourceDocument: {
      include: {
        source: true
      }
    }
  }
});

console.log(aide.sourceDocument.source_url_exact);
console.log(aide.sourceDocument.source.name);
```

## Benefits

1. **Transparency**: Users can see the exact source of each piece of information
2. **Audit Trail**: Track when and from where data was fetched
3. **Change Detection**: Use content_hash to detect updates
4. **Quality Control**: Filter by trust_level or region_scope
5. **Compliance**: Meet legal requirements for data provenance
6. **Debugging**: Trace issues back to specific sources

## Next Steps

- Implement manifest-based source configuration (PR-1B)
- Update ingestion pipelines to use traceability model (PR-1C)
- Add UI to display source information to users
