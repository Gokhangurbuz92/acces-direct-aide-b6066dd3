/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Aide` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Demarche` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Structure` table. All the data in the column will be lost.

*/
-- DropIndex (idempotent)
DROP INDEX IF EXISTS "Aide_search_vector_idx";

-- DropIndex (idempotent)
DROP INDEX IF EXISTS "Demarche_search_vector_idx";

-- DropIndex (idempotent)
DROP INDEX IF EXISTS "Structure_search_vector_idx";

-- AlterTable (idempotent)
ALTER TABLE "Aide" DROP COLUMN IF EXISTS "search_vector";

-- AlterTable (idempotent)
ALTER TABLE "Demarche" DROP COLUMN IF EXISTS "search_vector";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP(3);

-- AlterTable (idempotent)
ALTER TABLE "Structure" DROP COLUMN IF EXISTS "search_vector";

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Appointment_structureId_status_start_at_idx" ON "Appointment"("structureId", "status", "start_at");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Dispositif_statut_published_at_idx" ON "Dispositif"("statut", "published_at");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Guide_statut_published_at_idx" ON "Guide"("statut", "published_at");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Structure_statut_nom_idx" ON "Structure"("statut", "nom");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "ToolboxItem_statut_published_at_idx" ON "ToolboxItem"("statut", "published_at");
