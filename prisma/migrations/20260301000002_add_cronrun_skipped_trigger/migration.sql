-- P6-F: record skipped cron runs and trigger origin
ALTER TABLE "CronRun"
ADD COLUMN "trigger" TEXT,
ADD COLUMN "skipReason" TEXT;

CREATE INDEX "CronRun_trigger_startedAt_idx" ON "CronRun"("trigger", "startedAt");
