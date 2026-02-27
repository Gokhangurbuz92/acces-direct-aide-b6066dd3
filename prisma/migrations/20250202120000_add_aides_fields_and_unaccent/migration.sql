-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- AlterTable (Idempotent: skip if Aide table doesn't exist yet)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Aide') THEN
        ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "apply_url" TEXT;
        ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "fetched_at" TIMESTAMP(3);
        ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "providerType" TEXT;
        ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "source_last_modified" TIMESTAMP(3);
        ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "sub_theme" TEXT;
        ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "theme" TEXT;
    END IF;
END $$;
