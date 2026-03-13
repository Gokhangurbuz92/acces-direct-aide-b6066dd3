/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Aide` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Demarche` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `SourceDocument` table. All the data in the column will be lost.
  - You are about to drop the column `http_status` on the `SourceDocument` table. All the data in the column will be lost.
  - You are about to drop the column `license` on the `SourceDocument` table. All the data in the column will be lost.
  - You are about to drop the column `raw_excerpt` on the `SourceDocument` table. All the data in the column will be lost.
  - You are about to drop the column `source_id` on the `SourceDocument` table. All the data in the column will be lost.
  - You are about to drop the column `source_url_exact` on the `SourceDocument` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `SourceDocument` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `SyncRun` table. All the data in the column will be lost.
  - You are about to drop the `DataSource` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[externalId]` on the table `Aide` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `SyncRun` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SourceDocument" DROP CONSTRAINT "SourceDocument_source_id_fkey";

-- DropForeignKey
ALTER TABLE "SyncRun" DROP CONSTRAINT "SyncRun_source_id_fkey";

-- DropIndex
DROP INDEX "Aide_category_code_idx";

-- DropIndex
DROP INDEX "Aide_embedding_hnsw_idx";

-- DropIndex
DROP INDEX "Aide_search_vector_idx";

-- DropIndex
DROP INDEX "Aide_territory_scope_idx";

-- DropIndex
DROP INDEX "Aide_ts_content_idx";

-- DropIndex
DROP INDEX "aide_embedding_hnsw_idx";

-- DropIndex
DROP INDEX "Appointment_structureId_status_start_at_idx";

-- DropIndex
DROP INDEX "Demarche_search_vector_idx";

-- DropIndex
DROP INDEX "Demarche_territory_scope_idx";

-- DropIndex
DROP INDEX "SourceDocument_content_hash_idx";

-- DropIndex
DROP INDEX "SourceDocument_fetched_at_idx";

-- DropIndex
DROP INDEX "SourceDocument_source_id_idx";

-- DropIndex
DROP INDEX "SourceDocument_source_url_exact_key";

-- DropIndex
DROP INDEX "SourceDocument_source_url_idx";

-- DropIndex
DROP INDEX "Structure_search_vector_idx";

-- DropIndex
DROP INDEX "Structure_territory_scope_idx";

-- DropIndex
DROP INDEX "SyncRun_source_id_idx";

-- DropIndex
DROP INDEX "SyncRun_started_at_idx";

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfaIv" TEXT,
ADD COLUMN     "mfaSecret" TEXT;

-- AlterTable
ALTER TABLE "Aide" DROP COLUMN "search_vector",
ADD COLUMN     "externalId" TEXT,
ALTER COLUMN "region_codes" DROP DEFAULT,
ALTER COLUMN "department_codes" DROP DEFAULT,
ALTER COLUMN "insee_codes" DROP DEFAULT,
ALTER COLUMN "ts_content" DROP EXPRESSION;

-- AlterTable
ALTER TABLE "CitizenUser" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ConversationLog" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Demarche" DROP COLUMN "search_vector",
ADD COLUMN     "content_hash" TEXT,
ADD COLUMN     "source_url_exact" TEXT,
ALTER COLUMN "region_codes" DROP DEFAULT,
ALTER COLUMN "department_codes" DROP DEFAULT,
ALTER COLUMN "insee_codes" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Dispositif" ADD COLUMN     "content_hash" TEXT,
ADD COLUMN     "source_url_exact" TEXT,
ADD COLUMN     "territory_scope" TEXT;

-- AlterTable
ALTER TABLE "ProAppointment" ADD COLUMN     "visioEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visioRoomId" TEXT,
ADD COLUMN     "visioStartedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProUser" ADD COLUMN     "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfa_secret" TEXT;

-- AlterTable
ALTER TABLE "SourceDocument" DROP COLUMN "created_at",
DROP COLUMN "http_status",
DROP COLUMN "license",
DROP COLUMN "raw_excerpt",
DROP COLUMN "source_id",
DROP COLUMN "source_url_exact",
DROP COLUMN "updated_at",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "raw_content" TEXT;

-- AlterTable
ALTER TABLE "Structure" DROP COLUMN "search_vector",
ALTER COLUMN "region_codes" DROP DEFAULT,
ALTER COLUMN "department_codes" DROP DEFAULT,
ALTER COLUMN "insee_codes" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SyncRun" DROP COLUMN "created_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- DropTable
DROP TABLE "DataSource";

-- CreateTable
CREATE TABLE "SourceSnapshot" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_excerpt" TEXT,
    "content_hash" TEXT,
    "http_status" INTEGER,
    "final_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAccessibility" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "source_url" TEXT,
    "territory_scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "retrieved_at" TIMESTAMP(3),
    "last_checked_at" TIMESTAMP(3),
    "source_last_modified" TIMESTAMP(3),

    CONSTRAINT "ResourceAccessibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProOutlookToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProOutlookToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProAuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "structureId" TEXT NOT NULL,

    CONSTRAINT "ProAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "contentEncrypted" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "ProMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "citizenId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceSnapshot_entity_type_entity_id_idx" ON "SourceSnapshot"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "SourceSnapshot_fetched_at_idx" ON "SourceSnapshot"("fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceAccessibility_slug_key" ON "ResourceAccessibility"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProOutlookToken_userId_key" ON "ProOutlookToken"("userId");

-- CreateIndex
CREATE INDEX "ProAuditLog_structureId_idx" ON "ProAuditLog"("structureId");

-- CreateIndex
CREATE INDEX "ProAuditLog_proUserId_createdAt_idx" ON "ProAuditLog"("proUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ProMessage_conversationId_idx" ON "ProMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ProMessage_senderId_createdAt_idx" ON "ProMessage"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "UserConsent_citizenId_structureId_idx" ON "UserConsent"("citizenId", "structureId");

-- CreateIndex
CREATE INDEX "UserConsent_expiresAt_idx" ON "UserConsent"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Aide_externalId_key" ON "Aide"("externalId");

-- CreateIndex
CREATE INDEX "Aide_category_code_status_code_idx" ON "Aide"("category_code", "status_code");

-- CreateIndex
CREATE INDEX "Appointment_structureId_status_start_at_end_at_idx" ON "Appointment"("structureId", "status", "start_at", "end_at");

-- AddForeignKey
ALTER TABLE "ProOutlookToken" ADD CONSTRAINT "ProOutlookToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ProUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProAuditLog" ADD CONSTRAINT "ProAuditLog_proUserId_fkey" FOREIGN KEY ("proUserId") REFERENCES "ProUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
