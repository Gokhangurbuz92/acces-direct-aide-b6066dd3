-- Fix DB drift: ensure Demarche.quality_score exists

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Demarche'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Demarche' AND column_name = 'qualityScore'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Demarche' AND column_name = 'quality_score'
    ) THEN
      ALTER TABLE "Demarche" RENAME COLUMN "qualityScore" TO "quality_score";
    END IF;

    ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "quality_score" INTEGER DEFAULT 0;
    UPDATE "Demarche" SET "quality_score" = 0 WHERE "quality_score" IS NULL;
    ALTER TABLE "Demarche" ALTER COLUMN "quality_score" SET DEFAULT 0;
    ALTER TABLE "Demarche" ALTER COLUMN "quality_score" SET NOT NULL;
  END IF;
END
$$;
