-- AlterTable
ALTER TABLE "Actualite" 
ADD COLUMN IF NOT EXISTS "resume" TEXT,
ADD COLUMN IF NOT EXISTS "est_important" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "departements" TEXT[],
ADD COLUMN IF NOT EXISTS "tags" TEXT[],
ADD COLUMN IF NOT EXISTS "quality_score" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "raw_data_hash" TEXT,
ADD COLUMN IF NOT EXISTS "raw_payload_json" JSONB,
ADD COLUMN IF NOT EXISTS "score_fiabilite" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "source_nom" TEXT,
ADD COLUMN IF NOT EXISTS "source_url" TEXT,
ADD COLUMN IF NOT EXISTS "type_actu" TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS "ingest_batch" TEXT,
ADD COLUMN IF NOT EXISTS "falc_status" TEXT DEFAULT 'pending';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Actualite_raw_data_hash_key" ON "Actualite"("raw_data_hash");
CREATE INDEX IF NOT EXISTS "Actualite_raw_data_hash_idx" ON "Actualite"("raw_data_hash");
CREATE INDEX IF NOT EXISTS "Actualite_statut_date_publication_idx" ON "Actualite"("statut", "date_publication");
