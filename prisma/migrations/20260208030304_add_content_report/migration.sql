-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('AIDE', 'DEMARCHE', 'STRUCTURE', 'ACTUALITE');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('LIEN_MORT', 'HORAIRES_FAUX', 'INFO_FAUSSE', 'INFO_OBSOLETE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'FIXED', 'REJECTED');

-- CreateTable
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "message" TEXT,
    "pageUrl" TEXT,
    "reporterEmail" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentReport_contentType_contentId_idx" ON "ContentReport"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt");
