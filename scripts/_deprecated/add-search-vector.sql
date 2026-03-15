-- Migration: Ajouter les colonnes search_vector pour la recherche full-text
-- Date: 2026-02-07
-- Objectif: Corriger les erreurs 500 sur /api/demarches, /api/structures, /api/aides

-- 1. Ajouter la colonne search_vector à la table Aide
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- 2. Créer un index GIN pour la recherche full-text sur Aide
CREATE INDEX IF NOT EXISTS "Aide_search_vector_idx" ON "Aide" USING GIN ("search_vector");

-- 3. Créer un trigger pour mettre à jour automatiquement search_vector sur Aide
CREATE OR REPLACE FUNCTION update_aide_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.titre, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.cest_quoi, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.pour_qui, ''))), 'C') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.ce_que_ca_aide, ''))), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS aide_search_vector_update ON "Aide";
CREATE TRIGGER aide_search_vector_update
  BEFORE INSERT OR UPDATE ON "Aide"
  FOR EACH ROW EXECUTE FUNCTION update_aide_search_vector();

-- 4. Mettre à jour les enregistrements existants pour Aide
UPDATE "Aide" SET "search_vector" = 
  setweight(to_tsvector('french', unaccent(coalesce(titre, ''))), 'A') ||
  setweight(to_tsvector('french', unaccent(coalesce(cest_quoi, ''))), 'B') ||
  setweight(to_tsvector('french', unaccent(coalesce(pour_qui, ''))), 'C') ||
  setweight(to_tsvector('french', unaccent(coalesce(ce_que_ca_aide, ''))), 'D')
WHERE "search_vector" IS NULL;

-- 5. Ajouter la colonne search_vector à la table Demarche
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- 6. Créer un index GIN pour la recherche full-text sur Demarche
CREATE INDEX IF NOT EXISTS "Demarche_search_vector_idx" ON "Demarche" USING GIN ("search_vector");

-- 7. Créer un trigger pour mettre à jour automatiquement search_vector sur Demarche
CREATE OR REPLACE FUNCTION update_demarche_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.titre, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.description_courte, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.pour_qui, ''))), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS demarche_search_vector_update ON "Demarche";
CREATE TRIGGER demarche_search_vector_update
  BEFORE INSERT OR UPDATE ON "Demarche"
  FOR EACH ROW EXECUTE FUNCTION update_demarche_search_vector();

-- 8. Mettre à jour les enregistrements existants pour Demarche
UPDATE "Demarche" SET "search_vector" = 
  setweight(to_tsvector('french', unaccent(coalesce(titre, ''))), 'A') ||
  setweight(to_tsvector('french', unaccent(coalesce(description_courte, ''))), 'B') ||
  setweight(to_tsvector('french', unaccent(coalesce(pour_qui, ''))), 'C')
WHERE "search_vector" IS NULL;

-- 9. Ajouter la colonne search_vector à la table Structure
ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- 10. Créer un index GIN pour la recherche full-text sur Structure
CREATE INDEX IF NOT EXISTS "Structure_search_vector_idx" ON "Structure" USING GIN ("search_vector");

-- 11. Créer un trigger pour mettre à jour automatiquement search_vector sur Structure
CREATE OR REPLACE FUNCTION update_structure_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.nom, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.description_courte, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.ville, ''))), 'C') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.type_structure, ''))), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS structure_search_vector_update ON "Structure";
CREATE TRIGGER structure_search_vector_update
  BEFORE INSERT OR UPDATE ON "Structure"
  FOR EACH ROW EXECUTE FUNCTION update_structure_search_vector();

-- 12. Mettre à jour les enregistrements existants pour Structure
UPDATE "Structure" SET "search_vector" = 
  setweight(to_tsvector('french', unaccent(coalesce(nom, ''))), 'A') ||
  setweight(to_tsvector('french', unaccent(coalesce(description_courte, ''))), 'B') ||
  setweight(to_tsvector('french', unaccent(coalesce(ville, ''))), 'C') ||
  setweight(to_tsvector('french', unaccent(coalesce(type_structure, ''))), 'D')
WHERE "search_vector" IS NULL;

-- Vérification finale
SELECT 
  'Aide' as table_name,
  COUNT(*) as total_rows,
  COUNT(search_vector) as rows_with_search_vector
FROM "Aide"
UNION ALL
SELECT 
  'Demarche' as table_name,
  COUNT(*) as total_rows,
  COUNT(search_vector) as rows_with_search_vector
FROM "Demarche"
UNION ALL
SELECT 
  'Structure' as table_name,
  COUNT(*) as total_rows,
  COUNT(search_vector) as rows_with_search_vector
FROM "Structure";
