-- Migration: Add Required Fields for Demarches (P0)
-- Date: 2026-02-02
-- Purpose: Support complete traceability, filtering, and content structure

-- Drop existing unique constraint on source_url_exact if exists (idempotent)
DO $$ BEGIN
  ALTER TABLE "Demarche" DROP CONSTRAINT IF EXISTS "Demarche_source_url_exact_key";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Add P0 Required Fields (Traçabilité + Filtres)
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "source_url" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "apply_url" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "source_domain" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "fetched_at" TIMESTAMP(3);
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "source_last_modified" TIMESTAMP(3);

-- Add Organisme & Canal (Filtres P0)
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "organisme" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "canal" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "location" TEXT;

-- Add Territoire (Filtres P0)
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "territoire_niveau" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "territoire_codes" TEXT[];
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "territoire_label" TEXT;

-- Add Public cible (Filtres P1)
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "public" TEXT[];

-- Add Détails démarche (Contenu P0)
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "steps" JSONB;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "pieces_a_fournir" TEXT[];
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "processing_time" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "cost" TEXT;

-- Add Formulaires & Contacts (P1)
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "forms" JSONB;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "contacts" JSONB;

-- Add FALC Support (P1)
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "falc_summary" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "falc_steps" TEXT;

-- Add Sub-categorization (P2 - optionnel)
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "sous_categorie" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "sous_situation" TEXT;

-- Re-add unique constraint on source_url_exact (for deduplication)
DO $$ BEGIN
  ALTER TABLE "Demarche" ADD CONSTRAINT "Demarche_source_url_exact_key" UNIQUE ("source_url_exact");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS "Demarche_organisme_idx" ON "Demarche"("organisme");
CREATE INDEX IF NOT EXISTS "Demarche_canal_idx" ON "Demarche"("canal");
CREATE INDEX IF NOT EXISTS "Demarche_territoire_niveau_idx" ON "Demarche"("territoire_niveau");
CREATE INDEX IF NOT EXISTS "Demarche_fetched_at_idx" ON "Demarche"("fetched_at");
CREATE INDEX IF NOT EXISTS "Demarche_source_domain_idx" ON "Demarche"("source_domain");
CREATE INDEX IF NOT EXISTS "Demarche_territoire_codes_idx" ON "Demarche" USING GIN ("territoire_codes");
CREATE INDEX IF NOT EXISTS "Demarche_public_idx" ON "Demarche" USING GIN ("public");
