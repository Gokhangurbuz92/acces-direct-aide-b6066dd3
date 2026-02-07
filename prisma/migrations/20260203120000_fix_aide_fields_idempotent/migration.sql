-- Corrective migration: Make 20250202120000_add_aides_fields_and_unaccent idempotent
-- This migration ensures all fields are added with IF NOT EXISTS to prevent P3008 errors

-- Ensure unaccent extension (already idempotent in original)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Add Aide fields idempotently
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "apply_url" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "fetched_at" TIMESTAMP(3);
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "providerType" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "source_last_modified" TIMESTAMP(3);
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "sub_theme" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "theme" TEXT;
