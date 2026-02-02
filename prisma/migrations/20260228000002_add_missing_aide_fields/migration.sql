-- AlterTable
ALTER TABLE "Aide"
ADD COLUMN "content_hash" TEXT,
ADD COLUMN "source_url_exact" TEXT,
ADD COLUMN "territory_scope" TEXT,
ADD COLUMN "summary_falc" TEXT;

-- AlterTable
ALTER TABLE "Structure"
ADD COLUMN "content_hash" TEXT,
ADD COLUMN "source_url_exact" TEXT,
ADD COLUMN "territory_scope" TEXT;

-- AlterTable
-- Only altering Dispositif if it exists. Since we are unsure, we skip it to prevent crashes.
-- If Dispositif table is missing, this would fail.
-- User task is focused on Aides.
