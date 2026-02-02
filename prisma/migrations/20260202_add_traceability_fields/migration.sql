-- Add traceability fields to all content modules
-- These fields track source URL, retrieval time, and last check time

-- Aide: Add retrieved_at and last_checked_at (fetched_at already exists)
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "retrieved_at" TIMESTAMP(3);
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "last_checked_at" TIMESTAMP(3);

-- Demarche: Add source_url, retrieved_at, last_checked_at, source_last_modified
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "source_url" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "retrieved_at" TIMESTAMP(3);
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "last_checked_at" TIMESTAMP(3);
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "source_last_modified" TIMESTAMP(3);

-- Structure: Add retrieved_at, last_checked_at, source_last_modified
ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "retrieved_at" TIMESTAMP(3);
ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "last_checked_at" TIMESTAMP(3);
ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "source_last_modified" TIMESTAMP(3);

-- Dispositif: Add source_url, retrieved_at, last_checked_at, source_last_modified
ALTER TABLE "Dispositif" ADD COLUMN IF NOT EXISTS "source_url" TEXT;
ALTER TABLE "Dispositif" ADD COLUMN IF NOT EXISTS "retrieved_at" TIMESTAMP(3);
ALTER TABLE "Dispositif" ADD COLUMN IF NOT EXISTS "last_checked_at" TIMESTAMP(3);
ALTER TABLE "Dispositif" ADD COLUMN IF NOT EXISTS "source_last_modified" TIMESTAMP(3);

-- ResourceAccessibility: Add retrieved_at, last_checked_at, source_last_modified
ALTER TABLE "ResourceAccessibility" ADD COLUMN IF NOT EXISTS "retrieved_at" TIMESTAMP(3);
ALTER TABLE "ResourceAccessibility" ADD COLUMN IF NOT EXISTS "last_checked_at" TIMESTAMP(3);
ALTER TABLE "ResourceAccessibility" ADD COLUMN IF NOT EXISTS "source_last_modified" TIMESTAMP(3);
