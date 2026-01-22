-- AlterTable
ALTER TABLE "Demarche" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "_DemarcheToSituation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DemarcheToSituation_AB_unique" ON "_DemarcheToSituation"("A", "B");

-- CreateIndex
CREATE INDEX "_DemarcheToSituation_B_index" ON "_DemarcheToSituation"("B");

-- AddForeignKey
ALTER TABLE "Demarche" ADD CONSTRAINT "Demarche_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AidCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DemarcheToSituation" ADD CONSTRAINT "_DemarcheToSituation_A_fkey" FOREIGN KEY ("A") REFERENCES "Demarche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DemarcheToSituation" ADD CONSTRAINT "_DemarcheToSituation_B_fkey" FOREIGN KEY ("B") REFERENCES "LifeSituation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
