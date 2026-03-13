-- P8-D: traceability hardening for Actualite -> SourceDocument
-- Safe / idempotent migration (non destructive)

ALTER TABLE "Actualite"
  ADD COLUMN IF NOT EXISTS "source_document_id" TEXT;

CREATE INDEX IF NOT EXISTS "Actualite_source_document_id_idx"
  ON "Actualite"("source_document_id");

ALTER TABLE "SourceDocument" ADD COLUMN IF NOT EXISTS "source_url" TEXT;

CREATE INDEX IF NOT EXISTS "SourceDocument_source_url_idx"
  ON "SourceDocument"("source_url");

CREATE INDEX IF NOT EXISTS "SourceDocument_content_hash_idx"
  ON "SourceDocument"("content_hash");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Actualite_source_document_id_fkey'
  ) THEN
    ALTER TABLE "Actualite"
      ADD CONSTRAINT "Actualite_source_document_id_fkey"
      FOREIGN KEY ("source_document_id")
      REFERENCES "SourceDocument"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
