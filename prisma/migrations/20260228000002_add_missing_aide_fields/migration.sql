-- AlterTable
ALTER TABLE "Aide"
ADD COLUMN IF NOT EXISTS "content_hash" TEXT,
ADD COLUMN IF NOT EXISTS "source_url_exact" TEXT,
ADD COLUMN IF NOT EXISTS "territory_scope" TEXT,
ADD COLUMN IF NOT EXISTS "summary_falc" TEXT;

-- AlterTable
ALTER TABLE "Structure"
ADD COLUMN IF NOT EXISTS "content_hash" TEXT,
ADD COLUMN IF NOT EXISTS "source_url_exact" TEXT,
ADD COLUMN IF NOT EXISTS "territory_scope" TEXT;

-- AlterTable
-- Only altering Dispositif if it exists. Since we are unsure, we skip it to prevent crashes.
-- If Dispositif table is missing, this would fail.
-- User task is focused on Aides.
