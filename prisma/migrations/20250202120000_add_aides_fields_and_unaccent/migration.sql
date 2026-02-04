-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- AlterTable
ALTER TABLE "Aide" ADD COLUMN     "apply_url" TEXT,
ADD COLUMN     "fetched_at" TIMESTAMP(3),
ADD COLUMN     "providerType" TEXT,
ADD COLUMN     "source_last_modified" TIMESTAMP(3),
ADD COLUMN     "sub_theme" TEXT,
ADD COLUMN     "theme" TEXT;
