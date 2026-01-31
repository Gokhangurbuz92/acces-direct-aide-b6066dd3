-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "type_organization" TEXT,
    "site_web_officiel" TEXT,
    "territoire_couverture" TEXT DEFAULT 'departmental',
    "categories" TEXT[],
    "tags" TEXT[],
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "published_at" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "ville" TEXT,
    "code_postal" TEXT,
    "departement" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "horaires" TEXT,
    "services" TEXT[],
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "source_url" TEXT,
    "retrieved_at" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "published_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN "organizationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_statut_published_at_idx" ON "Organization"("statut", "published_at");

-- CreateIndex
CREATE INDEX "Organization_type_organization_idx" ON "Organization"("type_organization");

-- CreateIndex
CREATE INDEX "Organization_territoire_couverture_idx" ON "Organization"("territoire_couverture");

-- CreateIndex
CREATE INDEX "Organization_statut_nom_idx" ON "Organization"("statut", "nom");

-- CreateIndex
CREATE INDEX "Establishment_organizationId_idx" ON "Establishment"("organizationId");

-- CreateIndex
CREATE INDEX "Establishment_ville_idx" ON "Establishment"("ville");

-- CreateIndex
CREATE INDEX "Establishment_departement_idx" ON "Establishment"("departement");

-- CreateIndex
CREATE INDEX "Establishment_statut_idx" ON "Establishment"("statut");

-- CreateIndex
CREATE INDEX "Establishment_organizationId_statut_idx" ON "Establishment"("organizationId", "statut");

-- CreateIndex
CREATE INDEX "Structure_organizationId_idx" ON "Structure"("organizationId");

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
