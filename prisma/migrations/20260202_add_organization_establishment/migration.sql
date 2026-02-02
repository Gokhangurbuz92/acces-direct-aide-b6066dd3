-- ============================================================================
-- Migration: Add Organization and Establishment models for Annuaire
-- Date: 2026-02-02
-- Purpose: Implement 3-level hierarchy (Organization → Establishment)
-- to avoid duplicates (e.g., 150x "France Travail")
-- ============================================================================

-- Create Organization table
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "orgKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronyms" TEXT[],
    "category" TEXT,
    "domains" TEXT[],
    "publics" TEXT[],
    "description" TEXT,
    "website_url" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "address_city" TEXT,
    "address_postal_code" TEXT,
    "territory_level" TEXT,
    "territory_codes" TEXT[],
    "source_url" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_last_modified" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'brouillon',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- Create Establishment table
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "services" TEXT[],
    "address_line1" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "department_code" TEXT,
    "region" TEXT,
    "geo_lat" DOUBLE PRECISION,
    "geo_lng" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "opening_hours" JSONB,
    "accessibility" TEXT[],
    "appointment_url" TEXT,
    "source_url" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_last_modified" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'brouillon',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Organization_orgKey_key" ON "Organization"("orgKey");
CREATE UNIQUE INDEX "Establishment_slug_key" ON "Establishment"("slug");
CREATE UNIQUE INDEX "Establishment_siteKey_key" ON "Establishment"("siteKey");

-- Create performance indexes (Organization)
CREATE INDEX "Organization_orgKey_idx" ON "Organization"("orgKey");
CREATE INDEX "Organization_category_idx" ON "Organization"("category");
CREATE INDEX "Organization_status_idx" ON "Organization"("status");
CREATE INDEX "Organization_territory_level_idx" ON "Organization"("territory_level");
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- Create performance indexes (Establishment)
CREATE INDEX "Establishment_organizationId_idx" ON "Establishment"("organizationId");
CREATE INDEX "Establishment_siteKey_idx" ON "Establishment"("siteKey");
CREATE INDEX "Establishment_type_idx" ON "Establishment"("type");
CREATE INDEX "Establishment_department_code_idx" ON "Establishment"("department_code");
CREATE INDEX "Establishment_city_idx" ON "Establishment"("city");
CREATE INDEX "Establishment_postal_code_idx" ON "Establishment"("postal_code");
CREATE INDEX "Establishment_status_idx" ON "Establishment"("status");

-- Create foreign key constraint
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add full-text search support (if unaccent extension exists)
-- This assumes unaccent extension is already installed (from previous migration 20260228000000_ensure_unaccent)

-- Optional: Create GIN indexes for array fields (for fast filtering)
-- These will be added if performance testing shows they're beneficial
-- CREATE INDEX "Organization_domains_gin_idx" ON "Organization" USING GIN ("domains");
-- CREATE INDEX "Organization_publics_gin_idx" ON "Organization" USING GIN ("publics");
-- CREATE INDEX "Establishment_services_gin_idx" ON "Establishment" USING GIN ("services");
-- CREATE INDEX "Establishment_accessibility_gin_idx" ON "Establishment" USING GIN ("accessibility");
