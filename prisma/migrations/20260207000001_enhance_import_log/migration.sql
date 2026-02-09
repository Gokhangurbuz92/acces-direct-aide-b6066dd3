-- AlterTable: Add new fields to ImportLog for better traceability
ALTER TABLE "ImportLog" ADD COLUMN IF NOT EXISTS "run_id" TEXT;
ALTER TABLE "ImportLog" ADD COLUMN IF NOT EXISTS "items_updated" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ImportLog" ADD COLUMN IF NOT EXISTS "items_skipped" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ImportLog" ADD COLUMN IF NOT EXISTS "error_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "ImportLog_run_id_idx" ON "ImportLog"("run_id");
CREATE INDEX IF NOT EXISTS "ImportLog_source_name_createdAt_idx" ON "ImportLog"("source_name", "createdAt");
