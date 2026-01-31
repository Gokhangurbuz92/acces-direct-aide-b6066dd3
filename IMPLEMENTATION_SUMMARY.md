# Annuaire Organization/Establishment Implementation Summary

## Overview
Implemented a scalable organization/establishment hierarchy for the Annuaire feature to prevent flooding the main list with individual locations from large networks (e.g., France Travail with dozens of agencies).

## Changes Made

### 1. Database Schema (Prisma)
**Files Modified:**
- `prisma/schema.prisma`
- `prisma/migrations/20260131000000_add_organization_establishment_models/migration.sql`

**New Models:**
- **Organization** (parent entity):
  - Fields: id, slug, nom, description, type_organization, site_web_officiel, territoire_couverture, categories, tags, statut, published_at
  - Indexes: statut+published_at, type_organization, territoire_couverture, statut+nom
  
- **Establishment** (child entity):
  - Fields: id, organizationId (FK), nom, adresse, ville, code_postal, departement, telephone, email, horaires, services, latitude, longitude, source_url, retrieved_at, statut, published_at
  - Indexes: organizationId, ville, departement, statut, organizationId+statut

**Modified Models:**
- **Structure**: Added optional `organizationId` FK for backward compatibility and future migration

### 2. Backend API
**Files Created:**
- `api/_handlers/organizations.js` - Main handler for organizations and establishments

**Files Modified:**
- `api/routes.js` - Added organizations route
- `api/lib/search-query.js` - Added `searchOrganizations()` and `searchEstablishments()` functions
- `api/_utils/validators.js` - Added `searchOrganizationsSchema` and `searchEstablishmentsSchema`

**Endpoints:**
- `GET /api/organizations` - List/search organizations with filters (q, type, category, city, department, territoire)
- `GET /api/organizations?slug={slug}` - Get organization detail with establishment count
- `GET /api/organizations?organizationSlug={slug}&...` - List establishments for an organization with filters (city, department)

**Features:**
- Full-text search on organization name and description
- Filtering by type, category, territory coverage, city, department
- Pagination support (default 20 items per page)
- Establishment count aggregation for each organization
- Rate limiting integration

### 3. Frontend Components
**Files Created:**
- `src/components/cards/OrganizationCard.jsx` - Card component for organization list
- `src/components/cards/EstablishmentCard.jsx` - Card component for establishment list
- `src/pages/OrganizationDetail.jsx` - Detail page showing organization info and establishments

**Files Modified:**
- `src/pages/Annuaire.jsx` - Refactored to use organizations API instead of structures
- `src/pages/index.jsx` - Added routes for `/annuaire` and `/annuaire/:slug`
- `src/api/client.js` - Added Organization entity client

**UI Features:**
- Organization list with search, type filter, and department filter
- Organization cards showing: name, description, type, territory coverage, categories, establishment count
- Organization detail page with:
  - Organization header (name, description, official website, territory coverage)
  - Establishment count badge
  - Filters for establishments (city, department)
  - Paginated establishment list
  - Back to annuaire link
- Establishment cards showing: name, full address, phone (clickable), email (clickable), hours, services, source URL

### 4. Seed Data
**Files Modified:**
- `prisma/seed.js`

**Test Data Added:**
- **France Travail** (national service public):
  - Strasbourg Centre
  - Strasbourg Neudorf
  - Mulhouse
  
- **CAF** (departmental service public):
  - CAF du Bas-Rhin (67)
  - CAF du Haut-Rhin (68)
  
- **MDPH** (departmental service public):
  - MDPH du Bas-Rhin (67)
  - MDPH du Haut-Rhin (68)

### 5. Testing
**Files Created:**
- `tests/integration/organizations.test.js`

**Test Coverage:**
- List organizations endpoint
- Filter organizations by type
- Search organizations by name
- Get organization by slug
- 404 for non-existent organization
- List establishments for organization
- Filter establishments by department
- Filter establishments by city
- Pagination functionality

## Migration Strategy

### Backward Compatibility
- Existing `/api/structures` endpoint remains functional
- Existing structure detail pages continue to work
- Added optional `organizationId` FK to Structure model for gradual migration

### Future Migration Steps (Not Implemented)
1. Create script to identify structures that should become organizations
2. Create Organization records for networks
3. Link or create Establishment records
4. Update Structure.organizationId FK
5. Gradually deprecate flat structure model

## Data Model Benefits

### Scalability
- Main annuaire page shows organizations (not flooded with individual locations)
- Large networks (France Travail, CAF, etc.) appear as single entries
- Clicking organization shows all establishments with filters

### Data Quality
- Centralized organization information (official website, description, coverage)
- Detailed establishment information (address, phone, email, hours, services)
- Support for deduplication based on source_url and address normalization
- Timestamps for data freshness (retrieved_at)

### User Experience
- Cleaner main list (organizations instead of hundreds of individual locations)
- Easy filtering within organization (by city, department)
- Clear hierarchy: Organization → Establishments
- Establishment count visible on organization cards

## Build Verification
✅ Build successful: `npm run build` completed without errors
✅ Type checking passed: `npm run typecheck` completed without errors
✅ No breaking changes to existing structure pages

## Files Changed Summary
**Modified (8):**
- api/_utils/validators.js
- api/lib/search-query.js
- api/routes.js
- prisma/schema.prisma
- prisma/seed.js
- src/api/client.js
- src/pages/Annuaire.jsx
- src/pages/index.jsx

**Created (6):**
- api/_handlers/organizations.js
- prisma/migrations/20260131000000_add_organization_establishment_models/migration.sql
- src/components/cards/EstablishmentCard.jsx
- src/components/cards/OrganizationCard.jsx
- src/pages/OrganizationDetail.jsx
- tests/integration/organizations.test.js

**Total: 14 files**

## Next Steps (Recommendations)
1. Run database migration: `npx prisma migrate deploy` (in production)
2. Run seed script to populate test data: `npm run db:seed`
3. Create CSV import tool for bulk organization/establishment import
4. Implement data ingestion pipeline for automated updates
5. Add map view for establishments (optional, if geolocation data available)
6. Implement address normalization and deduplication logic
7. Create admin UI for managing organizations and establishments
8. Migrate existing structures to organization/establishment model
