-- P9-C: Doctolib social core (additive only)
-- Safe/idempotent migration: create new pro RDV tables + indexes + FKs

CREATE TABLE IF NOT EXISTS "ProRdvService" (
  "id" TEXT NOT NULL,
  "structureId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
  "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProRdvService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProAvailabilityRule" (
  "id" TEXT NOT NULL,
  "structureId" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProAvailabilityRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProAppointment" (
  "id" TEXT NOT NULL,
  "structureId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'booked',
  "beneficiaryName" TEXT NOT NULL,
  "beneficiaryPhone" TEXT,
  "notes" TEXT,
  "createdByProUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProAppointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProTimeOff" (
  "id" TEXT NOT NULL,
  "structureId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProTimeOff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProRdvService_structureId_isActive_idx"
  ON "ProRdvService"("structureId", "isActive");

CREATE INDEX IF NOT EXISTS "ProRdvService_structureId_updatedAt_idx"
  ON "ProRdvService"("structureId", "updatedAt");

CREATE INDEX IF NOT EXISTS "ProAvailabilityRule_structureId_weekday_idx"
  ON "ProAvailabilityRule"("structureId", "weekday");

CREATE INDEX IF NOT EXISTS "ProAppointment_structureId_startAt_idx"
  ON "ProAppointment"("structureId", "startAt");

CREATE INDEX IF NOT EXISTS "ProAppointment_structureId_status_startAt_idx"
  ON "ProAppointment"("structureId", "status", "startAt");

CREATE INDEX IF NOT EXISTS "ProAppointment_serviceId_startAt_idx"
  ON "ProAppointment"("serviceId", "startAt");

CREATE INDEX IF NOT EXISTS "ProTimeOff_structureId_startAt_idx"
  ON "ProTimeOff"("structureId", "startAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProRdvService_structureId_fkey'
  ) THEN
    ALTER TABLE "ProRdvService"
      ADD CONSTRAINT "ProRdvService_structureId_fkey"
      FOREIGN KEY ("structureId")
      REFERENCES "Structure"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProAvailabilityRule_structureId_fkey'
  ) THEN
    ALTER TABLE "ProAvailabilityRule"
      ADD CONSTRAINT "ProAvailabilityRule_structureId_fkey"
      FOREIGN KEY ("structureId")
      REFERENCES "Structure"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProAppointment_structureId_fkey'
  ) THEN
    ALTER TABLE "ProAppointment"
      ADD CONSTRAINT "ProAppointment_structureId_fkey"
      FOREIGN KEY ("structureId")
      REFERENCES "Structure"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProAppointment_serviceId_fkey'
  ) THEN
    ALTER TABLE "ProAppointment"
      ADD CONSTRAINT "ProAppointment_serviceId_fkey"
      FOREIGN KEY ("serviceId")
      REFERENCES "ProRdvService"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProAppointment_createdByProUserId_fkey'
  ) THEN
    ALTER TABLE "ProAppointment"
      ADD CONSTRAINT "ProAppointment_createdByProUserId_fkey"
      FOREIGN KEY ("createdByProUserId")
      REFERENCES "ProUser"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProTimeOff_structureId_fkey'
  ) THEN
    ALTER TABLE "ProTimeOff"
      ADD CONSTRAINT "ProTimeOff_structureId_fkey"
      FOREIGN KEY ("structureId")
      REFERENCES "Structure"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
