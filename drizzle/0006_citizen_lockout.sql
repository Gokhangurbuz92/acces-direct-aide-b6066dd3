ALTER TABLE "CitizenUser" ADD COLUMN "failedLoginAttempts" integer NOT NULL DEFAULT 0;
ALTER TABLE "CitizenUser" ADD COLUMN "lockoutUntil" timestamp(3);
