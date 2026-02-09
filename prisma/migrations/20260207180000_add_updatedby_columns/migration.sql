-- Ajout des colonnes updatedBy manquantes (prod drift fix)

ALTER TABLE "Demarche"  ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "Actualite" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- (Optionnel) si tu veux aussi sécuriser Aide au cas où :
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
