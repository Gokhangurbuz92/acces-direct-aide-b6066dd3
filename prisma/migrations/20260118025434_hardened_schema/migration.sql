-- AlterTable
ALTER TABLE "Actualite" ADD COLUMN     "commentaire_statut" TEXT,
ADD COLUMN     "published_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "lockoutUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Aide" ADD COLUMN     "commentaire_statut" TEXT,
ADD COLUMN     "published_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Demarche" ADD COLUMN     "commentaire_statut" TEXT,
ADD COLUMN     "published_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "commentaire_statut" TEXT,
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "statut" TEXT NOT NULL DEFAULT 'brouillon';

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT,
    "target" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
