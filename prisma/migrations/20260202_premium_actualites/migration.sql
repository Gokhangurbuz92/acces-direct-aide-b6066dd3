-- Premium Actualités Migration
-- Adds all required fields for the premium /actualites page

-- Add new fields to Actualite table
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "excerpt" TEXT;
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "content_markdown" TEXT;
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "falc_summary" TEXT;
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "change_summary" TEXT;
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "next_steps" TEXT;

-- Topics (multi-topics support)
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "topic_primary" TEXT;

-- Impact & Audience
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "impact" TEXT DEFAULT 'info';
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "audience" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Territory
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "territory_level" TEXT;
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "territory_codes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Source tracking (exact URLs + metadata)
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "source_domain" TEXT;
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "source_type" TEXT DEFAULT 'official';
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "reliability_score" INTEGER DEFAULT 50;
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "source_published_at" TIMESTAMP;
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "source_last_modified" TIMESTAMP;

-- First seen tracking (for "Nouveau" badge)
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "first_seen_at" TIMESTAMP DEFAULT NOW();
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "is_new" BOOLEAN GENERATED ALWAYS AS (
  EXTRACT(DAY FROM (NOW() - "first_seen_at")) <= 7
) STORED;

-- Related entities
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "related_aide_slugs" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "related_demarche_slugs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update status field to use standard values
UPDATE "Actualite" SET "statut" = 'publie' WHERE "statut" = 'publie' OR "statut" = 'published';
UPDATE "Actualite" SET "statut" = 'brouillon' WHERE "statut" NOT IN ('publie', 'archive');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_actualite_source_published_at" ON "Actualite"("source_published_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_actualite_fetched_at" ON "Actualite"("fetched_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_actualite_first_seen_at" ON "Actualite"("first_seen_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_actualite_impact" ON "Actualite"("impact") WHERE "statut" = 'publie';
CREATE INDEX IF NOT EXISTS "idx_actualite_status" ON "Actualite"("statut");

-- GIN indexes for arrays (topics, tags, audience, territory_codes)
CREATE INDEX IF NOT EXISTS "idx_actualite_topics_gin" ON "Actualite" USING GIN ("topics");
CREATE INDEX IF NOT EXISTS "idx_actualite_tags_gin" ON "Actualite" USING GIN ("tags");
CREATE INDEX IF NOT EXISTS "idx_actualite_audience_gin" ON "Actualite" USING GIN ("audience");
CREATE INDEX IF NOT EXISTS "idx_actualite_territory_codes_gin" ON "Actualite" USING GIN ("territory_codes");

-- Full-text search index (title + excerpt + tags + source_name)
CREATE INDEX IF NOT EXISTS "idx_actualite_search" ON "Actualite" USING GIN (
  to_tsvector('french', COALESCE("titre", '') || ' ' || COALESCE("excerpt", '') || ' ' || COALESCE("source_name", '') || ' ' || array_to_string("tags", ' '))
);

-- Unique constraint on canonical_url (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'actualite_canonical_url_unique'
  ) THEN
    ALTER TABLE "Actualite" ADD CONSTRAINT "actualite_canonical_url_unique" UNIQUE ("canonical_url");
  END IF;
END
$$;

-- Migrate existing data
UPDATE "Actualite" SET
  "excerpt" = COALESCE("resume", SUBSTRING("contenu", 1, 300)),
  "topic_primary" = COALESCE("categorie", 'general'),
  "topics" = ARRAY[COALESCE("categorie", 'general')],
  "impact" = CASE
    WHEN "est_important" = true THEN 'important'
    WHEN "type_actu" = 'alerte' THEN 'alerte'
    ELSE 'info'
  END,
  "source_domain" = CASE
    WHEN "source_url" IS NOT NULL THEN regexp_replace("source_url", '^https?://(?:www\.)?([^/]+).*', '\1')
    ELSE NULL
  END,
  "reliability_score" = COALESCE("score_fiabilite", 50),
  "source_published_at" = "date_publication",
  "first_seen_at" = COALESCE("fetched_at", "date_publication", NOW())
WHERE "excerpt" IS NULL OR "topic_primary" IS NULL;
