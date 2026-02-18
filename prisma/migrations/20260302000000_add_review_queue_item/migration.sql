-- P8-C: Data Quality Review Queue
CREATE TABLE IF NOT EXISTS "ReviewQueueItem" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "entitySlug" TEXT,
  "title" TEXT,
  "reason" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReviewQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReviewQueueItem_status_createdAt_idx"
  ON "ReviewQueueItem"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "ReviewQueueItem_entityType_status_idx"
  ON "ReviewQueueItem"("entityType", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "ReviewQueueItem_entityType_entityId_reason_status_key"
  ON "ReviewQueueItem"("entityType", "entityId", "reason", "status");
