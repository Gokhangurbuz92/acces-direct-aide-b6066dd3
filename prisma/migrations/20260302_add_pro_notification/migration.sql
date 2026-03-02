-- CreateTable
CREATE TABLE IF NOT EXISTS "ProNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ProNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProNotification_userId_readAt_idx" ON "ProNotification"("userId", "readAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProNotification_structureId_createdAt_idx" ON "ProNotification"("structureId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProNotification" ADD CONSTRAINT "ProNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ProUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
