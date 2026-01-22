/*
  Warnings:

  - You are about to drop the column `sources` on the `Aide` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Aide" DROP COLUMN "sources",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "providerName" TEXT,
ADD COLUMN     "providerType" TEXT,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "source_name" TEXT,
ADD COLUMN     "source_url" TEXT;

-- CreateTable
CREATE TABLE "AidCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "AidCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifeSituation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "LifeSituation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AidSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT,
    "baseUrl" TEXT,
    "license" TEXT,
    "refreshPolicy" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "lastStatus" TEXT,

    CONSTRAINT "AidSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AideToLifeSituation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AidCategory_slug_key" ON "AidCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LifeSituation_slug_key" ON "LifeSituation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_AideToLifeSituation_AB_unique" ON "_AideToLifeSituation"("A", "B");

-- CreateIndex
CREATE INDEX "_AideToLifeSituation_B_index" ON "_AideToLifeSituation"("B");

-- AddForeignKey
ALTER TABLE "Aide" ADD CONSTRAINT "Aide_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AidCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aide" ADD CONSTRAINT "Aide_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "AidSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AideToLifeSituation" ADD CONSTRAINT "_AideToLifeSituation_A_fkey" FOREIGN KEY ("A") REFERENCES "Aide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AideToLifeSituation" ADD CONSTRAINT "_AideToLifeSituation_B_fkey" FOREIGN KEY ("B") REFERENCES "LifeSituation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
