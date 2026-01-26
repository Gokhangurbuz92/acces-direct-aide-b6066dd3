-- Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create a consolidated IMMUTABLE function to wrap all FTS logic
-- We mark it IMMUTABLE so Postgres allows it in GENERATED columns
CREATE OR REPLACE FUNCTION fn_calculate_search_vector(titre text, summary text, keywords text[])
RETURNS tsvector AS $$
BEGIN
    RETURN (
        setweight(to_tsvector('french', public.unaccent(coalesce(titre, ''))), 'A') ||
        setweight(to_tsvector('french', public.unaccent(coalesce(summary, ''))), 'C') ||
        setweight(to_tsvector('french', public.unaccent(array_to_string(keywords, ' '))), 'B')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- AlterTable Aide
ALTER TABLE "Aide" ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
  fn_calculate_search_vector(titre, summary_falc, mots_cles)
) STORED;

-- CreateIndex Aide
CREATE INDEX "Aide_search_vector_idx" ON "Aide" USING GIN ("search_vector");

-- AlterTable Demarche
ALTER TABLE "Demarche" ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
  fn_calculate_search_vector(titre, summary_falc, mots_cles)
) STORED;

-- CreateIndex Demarche
CREATE INDEX "Demarche_search_vector_idx" ON "Demarche" USING GIN ("search_vector");

-- AlterTable Structure
ALTER TABLE "Structure" ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
  fn_calculate_search_vector(nom, description_courte, mots_cles)
) STORED;

-- CreateIndex Structure
CREATE INDEX "Structure_search_vector_idx" ON "Structure" USING GIN ("search_vector");
