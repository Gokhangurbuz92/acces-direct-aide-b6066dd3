-- Fix Aides: Add missing fields + Recreate search_vector for full-text search

-- 1. Add missing fields to Aide table
ALTER TABLE "Aide" 
  ADD COLUMN IF NOT EXISTS "organisme" TEXT,
  ADD COLUMN IF NOT EXISTS "territoire_niveau" TEXT,
  ADD COLUMN IF NOT EXISTS "territoire_label" TEXT,
  ADD COLUMN IF NOT EXISTS "montant" TEXT,
  ADD COLUMN IF NOT EXISTS "avantage" TEXT,
  ADD COLUMN IF NOT EXISTS "contacts" JSONB,
  ADD COLUMN IF NOT EXISTS "falc_steps" TEXT,
  ADD COLUMN IF NOT EXISTS "source_domain" TEXT;

-- 2. Migrate existing data (providerName -> organisme if not set)
UPDATE "Aide" SET "organisme" = "providerName" WHERE "organisme" IS NULL AND "providerName" IS NOT NULL;

-- 3. Add search_vector column for full-text search
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- 4. Create index on search_vector
CREATE INDEX IF NOT EXISTS "Aide_search_vector_idx" ON "Aide" USING GIN ("search_vector");

-- 5. Create function to update search_vector
CREATE OR REPLACE FUNCTION aide_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.titre, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.cest_quoi, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.pour_qui, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.organisme, ''))), 'C') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.providerName, ''))), 'C') ||
    setweight(to_tsvector('french', unaccent(array_to_string(NEW.mots_cles, ' '))), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS aide_search_vector_trigger ON "Aide";
CREATE TRIGGER aide_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Aide"
  FOR EACH ROW
  EXECUTE FUNCTION aide_search_vector_update();

-- 7. Populate search_vector for existing rows
UPDATE "Aide" SET "updatedAt" = "updatedAt";

-- 8. Add performance indexes
CREATE INDEX IF NOT EXISTS "Aide_theme_idx" ON "Aide"("theme") WHERE "theme" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Aide_organisme_idx" ON "Aide"("organisme") WHERE "organisme" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Aide_territoires_gin_idx" ON "Aide" USING GIN ("territoires");
CREATE INDEX IF NOT EXISTS "Aide_audiences_gin_idx" ON "Aide" USING GIN ("audiences");

-- 9. Recreate search_vector for Demarche
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
CREATE INDEX IF NOT EXISTS "Demarche_search_vector_idx" ON "Demarche" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION demarche_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.titre, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.description_courte, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.pour_qui, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(array_to_string(NEW.mots_cles, ' '))), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS demarche_search_vector_trigger ON "Demarche";
CREATE TRIGGER demarche_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Demarche"
  FOR EACH ROW
  EXECUTE FUNCTION demarche_search_vector_update();

UPDATE "Demarche" SET "updatedAt" = "updatedAt";

-- 10. Recreate search_vector for Structure
ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
CREATE INDEX IF NOT EXISTS "Structure_search_vector_idx" ON "Structure" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION structure_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.nom, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.description_courte, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.ville, ''))), 'C') ||
    setweight(to_tsvector('french', unaccent(array_to_string(NEW.services, ' '))), 'C') ||
    setweight(to_tsvector('french', unaccent(array_to_string(NEW.mots_cles, ' '))), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS structure_search_vector_trigger ON "Structure";
CREATE TRIGGER structure_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Structure"
  FOR EACH ROW
  EXECUTE FUNCTION structure_search_vector_update();

UPDATE "Structure" SET "updatedAt" = "updatedAt";
