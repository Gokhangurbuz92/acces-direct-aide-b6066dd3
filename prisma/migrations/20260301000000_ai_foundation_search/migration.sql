-- PR#1 Data Foundation for AI Search
-- Adds strict aid fields, situations bridge, ingest jobs, pgvector readiness, and FTS support.

-- 1) Extensions (guarded by availability)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'unaccent') THEN
    CREATE EXTENSION IF NOT EXISTS unaccent;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_trgm') THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
    CREATE EXTENSION IF NOT EXISTS vector;
  END IF;
END $$;

-- 2) Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AidCategoryCode') THEN
    CREATE TYPE "AidCategoryCode" AS ENUM (
      'LOGEMENT',
      'SANTE',
      'HANDICAP',
      'EMPLOI',
      'FAMILLE',
      'ETUDES',
      'MOBILITE',
      'ENERGIE',
      'ALIMENTATION',
      'JUSTICE',
      'NUMERIQUE',
      'AUTRE'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AidStatus') THEN
    CREATE TYPE "AidStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IngestJobStatus') THEN
    CREATE TYPE "IngestJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR');
  END IF;
END $$;

-- 3) Core AI fields on Aide
ALTER TABLE "Aide"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "content" TEXT,
  ADD COLUMN IF NOT EXISTS "category_code" "AidCategoryCode" NOT NULL DEFAULT 'AUTRE',
  ADD COLUMN IF NOT EXISTS "status_code" "AidStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "eligibility" JSONB,
  ADD COLUMN IF NOT EXISTS "financials" JSONB,
  ADD COLUMN IF NOT EXISTS "citations" JSONB,
  ADD COLUMN IF NOT EXISTS "qa_score" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "qa_report" JSONB,
  ADD COLUMN IF NOT EXISTS "source_org" TEXT,
  ADD COLUMN IF NOT EXISTS "source_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "last_checked" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "geo_scope" TEXT;

-- 4) Situation + explicit join table
CREATE TABLE IF NOT EXISTS "Situation" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Situation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Situation_code_key" ON "Situation"("code");

CREATE TABLE IF NOT EXISTS "AidSituation" (
  "id" TEXT NOT NULL,
  "aidId" TEXT NOT NULL,
  "situationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AidSituation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AidSituation_aidId_situationId_key"
  ON "AidSituation"("aidId", "situationId");
CREATE INDEX IF NOT EXISTS "AidSituation_situationId_idx" ON "AidSituation"("situationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AidSituation_aidId_fkey'
  ) THEN
    ALTER TABLE "AidSituation"
      ADD CONSTRAINT "AidSituation_aidId_fkey"
      FOREIGN KEY ("aidId")
      REFERENCES "Aide"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AidSituation_situationId_fkey'
  ) THEN
    ALTER TABLE "AidSituation"
      ADD CONSTRAINT "AidSituation_situationId_fkey"
      FOREIGN KEY ("situationId")
      REFERENCES "Situation"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

-- 5) Ingest job orchestration table
CREATE TABLE IF NOT EXISTS "IngestJob" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" "IngestJobStatus" NOT NULL DEFAULT 'PENDING',
  "payload" JSONB,
  "result" JSONB,
  "error_message" TEXT,
  "started_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IngestJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IngestJob_status_createdAt_idx" ON "IngestJob"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "IngestJob_source_createdAt_idx" ON "IngestJob"("source", "createdAt");

-- 6) FTS generated column and indexes over (title, description, content)
CREATE OR REPLACE FUNCTION fn_ai_aide_ts_content(title_text text, description_text text, content_text text)
RETURNS tsvector AS $$
BEGIN
  RETURN (
    setweight(to_tsvector('french', public.unaccent(coalesce(title_text, ''))), 'A') ||
    setweight(to_tsvector('french', public.unaccent(coalesce(description_text, ''))), 'B') ||
    setweight(to_tsvector('french', public.unaccent(coalesce(content_text, ''))), 'C')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE "Aide"
  ADD COLUMN IF NOT EXISTS "ts_content" tsvector
  GENERATED ALWAYS AS (fn_ai_aide_ts_content("title", "description", "content")) STORED;

CREATE INDEX IF NOT EXISTS "Aide_ts_content_idx" ON "Aide" USING GIN ("ts_content");
CREATE INDEX IF NOT EXISTS "Aide_category_code_idx" ON "Aide"("category_code");
CREATE INDEX IF NOT EXISTS "Aide_status_code_idx" ON "Aide"("status_code");
CREATE INDEX IF NOT EXISTS "Aide_source_hash_idx" ON "Aide"("source_hash");
CREATE INDEX IF NOT EXISTS "Aide_geo_scope_idx" ON "Aide"("geo_scope");

-- 7) Vector column + ANN index (HNSW first, IVFFLAT fallback)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'Aide' AND column_name = 'embedding'
    ) THEN
      ALTER TABLE "Aide" ADD COLUMN "embedding" vector(768);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_name = 'Aide' AND column_name = 'embedding'
     ) THEN
    IF EXISTS (SELECT 1 FROM pg_am WHERE amname = 'hnsw') THEN
      CREATE INDEX IF NOT EXISTS "Aide_embedding_hnsw_idx"
        ON "Aide"
        USING hnsw ("embedding" vector_cosine_ops);
    ELSIF EXISTS (SELECT 1 FROM pg_am WHERE amname = 'ivfflat') THEN
      CREATE INDEX IF NOT EXISTS "Aide_embedding_ivfflat_idx"
        ON "Aide"
        USING ivfflat ("embedding" vector_cosine_ops)
        WITH (lists = 100);
    END IF;
  END IF;
END $$;
