-- P10-D: Public booking fields on ProAppointment (additive only)

ALTER TABLE "ProAppointment"
  ADD COLUMN IF NOT EXISTS "citizenUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "citizenEmailSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelledBy" TEXT;

CREATE INDEX IF NOT EXISTS "ProAppointment_citizenUserId_startAt_idx"
  ON "ProAppointment"("citizenUserId", "startAt");

CREATE UNIQUE INDEX IF NOT EXISTS "ProAppointment_citizenUserId_idempotencyKey_key"
  ON "ProAppointment"("citizenUserId", "idempotencyKey");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProAppointment_citizenUserId_fkey'
  ) THEN
    ALTER TABLE "ProAppointment"
      ADD CONSTRAINT "ProAppointment_citizenUserId_fkey"
      FOREIGN KEY ("citizenUserId")
      REFERENCES "CitizenUser"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
