/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Aide` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Demarche` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Structure` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Aide_search_vector_idx";

-- DropIndex
DROP INDEX "Demarche_search_vector_idx";

-- DropIndex
DROP INDEX "Structure_search_vector_idx";

-- AlterTable
ALTER TABLE "Aide" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "Demarche" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "read_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Structure" DROP COLUMN "search_vector";

-- CreateIndex
CREATE INDEX "Appointment_structureId_status_start_at_idx" ON "Appointment"("structureId", "status", "start_at");

-- CreateIndex
CREATE INDEX "Dispositif_statut_published_at_idx" ON "Dispositif"("statut", "published_at");

-- CreateIndex
CREATE INDEX "Guide_statut_published_at_idx" ON "Guide"("statut", "published_at");

-- CreateIndex
CREATE INDEX "Structure_statut_nom_idx" ON "Structure"("statut", "nom");

-- CreateIndex
CREATE INDEX "ToolboxItem_statut_published_at_idx" ON "ToolboxItem"("statut", "published_at");
