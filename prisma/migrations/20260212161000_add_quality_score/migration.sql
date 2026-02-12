-- Fix DB drift: ensure Aide.quality_score exists for Prisma model Aide

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Aide'
  ) THEN
    -- Legacy safety: if camelCase column exists, normalize to snake_case
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Aide' AND column_name = 'qualityScore'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Aide' AND column_name = 'quality_score'
    ) THEN
      ALTER TABLE "Aide" RENAME COLUMN "qualityScore" TO "quality_score";
    END IF;

    ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "quality_score" INTEGER DEFAULT 0;
    UPDATE "Aide" SET "quality_score" = 0 WHERE "quality_score" IS NULL;
    ALTER TABLE "Aide" ALTER COLUMN "quality_score" SET DEFAULT 0;
    ALTER TABLE "Aide" ALTER COLUMN "quality_score" SET NOT NULL;
  END IF;
END
$$;
