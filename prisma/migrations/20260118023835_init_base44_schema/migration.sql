/*
  Warnings:

  - You are about to drop the `HealthCheck` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "HealthCheck";

-- CreateTable
CREATE TABLE "Aide" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "titre" TEXT NOT NULL,
    "categorie" TEXT,
    "est_urgent" BOOLEAN NOT NULL DEFAULT false,
    "sources" JSONB,
    "territoires" TEXT[],
    "date_verification" TIMESTAMP(3),
    "delai_indicatif" TEXT,
    "cest_quoi" TEXT,
    "pour_qui" TEXT,
    "ce_que_ca_aide" TEXT,
    "documents_necessaires" TEXT[],
    "etapes" JSONB,
    "ou_demander" TEXT,
    "lien_demande" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Structure" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type_structure" TEXT,
    "accessibilite_pmr" BOOLEAN NOT NULL DEFAULT false,
    "description_courte" TEXT,
    "adresse" TEXT,
    "code_postal" TEXT,
    "ville" TEXT,
    "departement" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "site_web" TEXT,
    "horaires" TEXT,
    "services" TEXT[],
    "publics_accueillis" TEXT[],
    "date_verification" TIMESTAMP(3),
    "categories_aidees" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'actif',

    CONSTRAINT "Structure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demarche" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "categorie" TEXT,
    "description_courte" TEXT,
    "delai" TEXT,
    "cout" TEXT,
    "date_verification" TIMESTAMP(3),
    "pour_qui" TEXT,
    "documents_necessaires" TEXT[],
    "etapes" JSONB,
    "ou_faire" TEXT,
    "lien_officiel" TEXT,
    "sources" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Demarche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actualite" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "date_publication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "image_url" TEXT,
    "lien_url" TEXT,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actualite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateLog" (
    "id" SERIAL NOT NULL,
    "ran_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "duration_ms" INTEGER,
    "items_fetched_count" INTEGER NOT NULL DEFAULT 0,
    "items_created_count" INTEGER NOT NULL DEFAULT 0,
    "items_updated_count" INTEGER NOT NULL DEFAULT 0,
    "items_skipped_count" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT[],
    "source_name" TEXT,
    "is_dry_run" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UpdateLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'actif',
    "trust_level" TEXT,
    "last_sync" TIMESTAMP(3),

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Aide_slug_key" ON "Aide"("slug");
