/*
  Warnings:

  - A unique constraint covering the columns `[raw_data_hash]` on the table `Actualite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[siret]` on the table `Structure` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[raw_data_hash]` on the table `Structure` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Actualite" ADD COLUMN     "auto_publish" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "categorie" TEXT DEFAULT 'general',
ADD COLUMN     "departements" TEXT[],
ADD COLUMN     "est_important" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "falc_status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "ingest_batch" TEXT,
ADD COLUMN     "quality_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "raw_data_hash" TEXT,
ADD COLUMN     "raw_payload_json" JSONB,
ADD COLUMN     "score_fiabilite" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "source_nom" TEXT,
ADD COLUMN     "source_url" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "type_actu" TEXT DEFAULT 'info',
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "Aide" ADD COLUMN     "audiences" TEXT[],
ADD COLUMN     "conditions_falc" TEXT,
ADD COLUMN     "departements" TEXT[],
ADD COLUMN     "montant_falc" TEXT,
ADD COLUMN     "situations_vie" TEXT[],
ADD COLUMN     "structures_links" TEXT[];

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "metadata" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "Demarche" ADD COLUMN     "audiences" TEXT[],
ADD COLUMN     "departements" TEXT[];

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "auto_publish" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "geoloc_status" TEXT,
ADD COLUMN     "import_batch" TEXT,
ADD COLUMN     "import_status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "last_sync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "quality_score" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "raw_data_hash" TEXT,
ADD COLUMN     "siret" TEXT,
ADD COLUMN     "source_id" TEXT,
ADD COLUMN     "source_url" TEXT;

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "items_total" INTEGER NOT NULL DEFAULT 0,
    "items_new" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "logs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityVersion" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "snapshot_json" JSONB NOT NULL,
    "reason" TEXT,
    "actor_email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispositif" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "titre" TEXT NOT NULL,
    "description_falc" TEXT,
    "public" TEXT[],
    "departement" TEXT,
    "montant" TEXT,
    "liens" JSONB,
    "status" TEXT NOT NULL DEFAULT 'actif',
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "published_at" TIMESTAMP(3),
    "summary_falc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispositif_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityVersion_entity_type_entity_id_idx" ON "EntityVersion"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "Dispositif_slug_key" ON "Dispositif"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Actualite_raw_data_hash_key" ON "Actualite"("raw_data_hash");

-- CreateIndex
CREATE INDEX "Actualite_raw_data_hash_idx" ON "Actualite"("raw_data_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Structure_siret_key" ON "Structure"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "Structure_raw_data_hash_key" ON "Structure"("raw_data_hash");

-- CreateIndex
CREATE INDEX "Structure_source_id_idx" ON "Structure"("source_id");

-- CreateIndex
CREATE INDEX "Structure_raw_data_hash_idx" ON "Structure"("raw_data_hash");

-- CreateIndex
CREATE INDEX "Structure_siret_idx" ON "Structure"("siret");
