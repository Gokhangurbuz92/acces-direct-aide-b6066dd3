-- Phase 1 — Architecture Data Universelle
-- Migration: Add SyncRun model, enrich Aide/Structure/Demarche for national coverage

-- =============================================
-- 1. FIX CRITIQUE: Modèle SyncRun (corrige le crash runtime de ingest-structures.js)
-- =============================================
CREATE TABLE IF NOT EXISTS "SyncRun" (
    "id" TEXT NOT NULL,
    "source_id" TEXT,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "error" TEXT,
    "stats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SyncRun_status_started_at_idx" ON "SyncRun"("status", "started_at");
CREATE INDEX IF NOT EXISTS "SyncRun_source_id_started_at_idx" ON "SyncRun"("source_id", "started_at");

-- =============================================
-- 2. Enrichissement Aide (cahier des charges)
-- =============================================
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "montant_max" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "echelon_territorial" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "code_insee_territoire" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "lien_demarche" TEXT;
ALTER TABLE "Aide" ADD COLUMN IF NOT EXISTS "source_donnee" TEXT;

CREATE INDEX IF NOT EXISTS "Aide_echelon_territorial_idx" ON "Aide"("echelon_territorial");
CREATE INDEX IF NOT EXISTS "Aide_code_insee_territoire_idx" ON "Aide"("code_insee_territoire");

-- =============================================
-- 3. Enrichissement Structure (Annuaire Universel)
-- =============================================
ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "type_finess" TEXT;
ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "numero_finess" TEXT;
ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "rna_id" TEXT;
ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "source_annuaire" TEXT;

-- Unique constraints (idempotent with IF NOT EXISTS via DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Structure_numero_finess_key'
    ) THEN
        ALTER TABLE "Structure" ADD CONSTRAINT "Structure_numero_finess_key" UNIQUE ("numero_finess");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Structure_rna_id_key'
    ) THEN
        ALTER TABLE "Structure" ADD CONSTRAINT "Structure_rna_id_key" UNIQUE ("rna_id");
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "Structure_numero_finess_idx" ON "Structure"("numero_finess");
CREATE INDEX IF NOT EXISTS "Structure_rna_id_idx" ON "Structure"("rna_id");
CREATE INDEX IF NOT EXISTS "Structure_source_annuaire_idx" ON "Structure"("source_annuaire");

-- =============================================
-- 4. Enrichissement Demarche (démarches universelles)
-- =============================================
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "public_cible" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "contenu_detaille" TEXT;
ALTER TABLE "Demarche" ADD COLUMN IF NOT EXISTS "lien_teleservice" TEXT;
