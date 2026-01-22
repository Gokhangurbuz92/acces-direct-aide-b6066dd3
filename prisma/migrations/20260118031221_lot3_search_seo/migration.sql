/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Demarche` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Structure` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Aide" ADD COLUMN     "mots_cles" TEXT[],
ADD COLUMN     "summary_falc" TEXT;

-- AlterTable
ALTER TABLE "Demarche" ADD COLUMN     "mots_cles" TEXT[],
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "summary_falc" TEXT;

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "mots_cles" TEXT[],
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "summary_falc" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Demarche_slug_key" ON "Demarche"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Structure_slug_key" ON "Structure"("slug");
