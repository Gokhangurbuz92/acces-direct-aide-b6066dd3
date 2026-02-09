-- AlterTable: Add territory filtering fields to Aide
ALTER TABLE "Aide" ADD COLUMN "region_codes" TEXT[] DEFAULT '{}';
ALTER TABLE "Aide" ADD COLUMN "department_codes" TEXT[] DEFAULT '{}';
ALTER TABLE "Aide" ADD COLUMN "insee_codes" TEXT[] DEFAULT '{}';

-- AlterTable: Add territory filtering fields to Demarche
ALTER TABLE "Demarche" ADD COLUMN "region_codes" TEXT[] DEFAULT '{}';
ALTER TABLE "Demarche" ADD COLUMN "department_codes" TEXT[] DEFAULT '{}';
ALTER TABLE "Demarche" ADD COLUMN "insee_codes" TEXT[] DEFAULT '{}';

-- AlterTable: Add territory filtering fields to Structure
ALTER TABLE "Structure" ADD COLUMN "region_codes" TEXT[] DEFAULT '{}';
ALTER TABLE "Structure" ADD COLUMN "department_codes" TEXT[] DEFAULT '{}';
ALTER TABLE "Structure" ADD COLUMN "insee_codes" TEXT[] DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Aide_territory_scope_idx" ON "Aide"("territory_scope");
CREATE INDEX IF NOT EXISTS "Demarche_territory_scope_idx" ON "Demarche"("territory_scope");
CREATE INDEX IF NOT EXISTS "Structure_territory_scope_idx" ON "Structure"("territory_scope");
