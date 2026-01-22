-- AlterTable
ALTER TABLE "Actualite" ADD COLUMN     "statut" TEXT NOT NULL DEFAULT 'brouillon';

-- AlterTable
ALTER TABLE "Aide" ADD COLUMN     "statut" TEXT NOT NULL DEFAULT 'brouillon';

-- AlterTable
ALTER TABLE "Demarche" ADD COLUMN     "statut" TEXT NOT NULL DEFAULT 'brouillon';

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
