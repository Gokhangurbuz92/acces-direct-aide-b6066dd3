-- Migration: Aides Complete Model (DOD compliance)
-- Date: 2026-02-02
-- Purpose: Add all missing fields for /aides page DOD requirements

-- Step 1: Add new columns to Aide table
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "theme" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "sous_theme" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "organisme" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "territoire_niveau" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "territoire_codes" TEXT[];
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "apply_url" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "source_domain" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "fetched_at" TIMESTAMP(3);
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "source_last_modified" TIMESTAMP(3);
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "falc_steps" TEXT;

-- Step 2: Backfill theme from category relationship
UPDATE "Aide" a
SET "theme" = c.slug
FROM "AidCategory" c
WHERE a."categoryId" = c.id
  AND a."theme" IS NULL;

-- Step 3: Backfill organisme from providerName
UPDATE "Aide"
SET "organisme" = "providerName"
WHERE "organisme" IS NULL AND "providerName" IS NOT NULL;

-- Step 4: Backfill territoire_codes from existing territoires
UPDATE "Aide"
SET "territoire_codes" = "territoires"
WHERE "territoire_codes" IS NULL AND "territoires" IS NOT NULL;

-- Step 5: Backfill apply_url from lien_demande
UPDATE "Aide"
SET "apply_url" = "lien_demande"
WHERE "apply_url" IS NULL AND "lien_demande" IS NOT NULL;

-- Step 6: Extract source_domain from source_url if present
UPDATE "Aide"
SET "source_domain" =
  CASE
    WHEN "source_url" ~ '^https?://([^/]+)'
    THEN substring("source_url" from '^https?://([^/]+)')
    ELSE NULL
  END
WHERE "source_domain" IS NULL AND "source_url" IS NOT NULL;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS "Aide_theme_idx" ON "Aide"("theme");
CREATE INDEX IF NOT EXISTS "Aide_organisme_idx" ON "Aide"("organisme");
CREATE INDEX IF NOT EXISTS "Aide_est_urgent_idx" ON "Aide"("est_urgent");
CREATE INDEX IF NOT EXISTS "Aide_territoire_codes_idx" ON "Aide" USING GIN ("territoire_codes");
CREATE INDEX IF NOT EXISTS "Aide_source_url_idx" ON "Aide"("source_url");
CREATE INDEX IF NOT EXISTS "Aide_fetched_at_idx" ON "Aide"("fetched_at");

-- Step 8: Add unique constraint on source_url for deduplication (allow nulls)
-- Note: This creates a partial unique index (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS "Aide_source_url_unique_idx"
  ON "Aide"("source_url")
  WHERE "source_url" IS NOT NULL;

-- Step 9: Comment columns for documentation
COMMENT ON COLUMN "Aide"."theme" IS 'Thème principal (logement, sante, handicap, emploi, famille, etc.)';
COMMENT ON COLUMN "Aide"."sous_theme" IS 'Sous-thème pour catégorisation fine';
COMMENT ON COLUMN "Aide"."organisme" IS 'Organisme source (CAF, AGEFIPH, Région, etc.)';
COMMENT ON COLUMN "Aide"."territoire_niveau" IS 'Niveau territorial: national, region, departement, commune';
COMMENT ON COLUMN "Aide"."territoire_codes" IS 'Codes territoires (67, 68, FR-GES, etc.)';
COMMENT ON COLUMN "Aide"."apply_url" IS 'URL exacte pour faire la demande';
COMMENT ON COLUMN "Aide"."source_domain" IS 'Domaine source pour regroupement';
COMMENT ON COLUMN "Aide"."fetched_at" IS 'Date de récupération des données';
COMMENT ON COLUMN "Aide"."source_last_modified" IS 'Date dernière modification à la source (si disponible)';
COMMENT ON COLUMN "Aide"."falc_steps" IS 'Étapes en Facile À Lire et à Comprendre (FALC)';
