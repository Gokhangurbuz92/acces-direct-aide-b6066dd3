-- Enable unaccent extension if not exists
CREATE EXTENSION IF NOT EXISTS unaccent;

-- AlterTable Aide
ALTER TABLE "Aide" ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('french', unaccent(coalesce(titre,''))), 'A') ||
  setweight(to_tsvector('french', unaccent(coalesce(summary_falc,''))), 'C') ||
  setweight(to_tsvector('french', unaccent(array_to_string(mots_cles, ' '))), 'B')
) STORED;

-- CreateIndex Aide
CREATE INDEX "Aide_search_vector_idx" ON "Aide" USING GIN ("search_vector");

-- AlterTable Demarche
ALTER TABLE "Demarche" ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('french', unaccent(coalesce(titre,''))), 'A') ||
  setweight(to_tsvector('french', unaccent(coalesce(summary_falc,''))), 'C') ||
  setweight(to_tsvector('french', unaccent(array_to_string(mots_cles, ' '))), 'B')
) STORED;

-- CreateIndex Demarche
CREATE INDEX "Demarche_search_vector_idx" ON "Demarche" USING GIN ("search_vector");

-- AlterTable Structure
ALTER TABLE "Structure" ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('french', unaccent(coalesce(nom,''))), 'A') ||
  setweight(to_tsvector('french', unaccent(coalesce(description_courte,''))), 'C') ||
  setweight(to_tsvector('french', unaccent(array_to_string(mots_cles, ' '))), 'B')
) STORED;

-- CreateIndex Structure
CREATE INDEX "Structure_search_vector_idx" ON "Structure" USING GIN ("search_vector");
