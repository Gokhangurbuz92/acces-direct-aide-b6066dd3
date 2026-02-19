-- P10-C: structure RDV publish settings (additive only)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'RdvBookingMode'
  ) THEN
    CREATE TYPE "RdvBookingMode" AS ENUM ('IN_PERSON', 'VIDEO', 'BOTH');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "StructureRdvSettings" (
  "id" TEXT NOT NULL,
  "structureId" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "bookingMode" "RdvBookingMode" NOT NULL DEFAULT 'IN_PERSON',
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StructureRdvSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StructureRdvSettings_structureId_key"
  ON "StructureRdvSettings"("structureId");

CREATE INDEX IF NOT EXISTS "StructureRdvSettings_isPublished_updatedAt_idx"
  ON "StructureRdvSettings"("isPublished", "updatedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StructureRdvSettings_structureId_fkey'
  ) THEN
    ALTER TABLE "StructureRdvSettings"
      ADD CONSTRAINT "StructureRdvSettings_structureId_fkey"
      FOREIGN KEY ("structureId")
      REFERENCES "Structure"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
