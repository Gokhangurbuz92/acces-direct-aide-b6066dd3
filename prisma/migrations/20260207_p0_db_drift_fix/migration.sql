-- P0 DB Drift Fix: Ensure all required columns exist
-- This migration is IDEMPOTENT and safe to run multiple times
-- It adds missing columns that may cause 500 errors in production

-- Enable unaccent extension if not already enabled (for search)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Add updatedBy column to Aide if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Aide' AND column_name = 'updatedBy'
    ) THEN
        ALTER TABLE "Aide" ADD COLUMN "updatedBy" TEXT;
    END IF;
END $$;

-- Add updatedBy column to Demarche if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Demarche' AND column_name = 'updatedBy'
    ) THEN
        ALTER TABLE "Demarche" ADD COLUMN "updatedBy" TEXT;
    END IF;
END $$;

-- Add updatedBy column to Structure if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Structure' AND column_name = 'updatedBy'
    ) THEN
        ALTER TABLE "Structure" ADD COLUMN "updatedBy" TEXT;
    END IF;
END $$;

-- Add updatedBy column to Actualite if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Actualite' AND column_name = 'updatedBy'
    ) THEN
        ALTER TABLE "Actualite" ADD COLUMN "updatedBy" TEXT;
    END IF;
END $$;

-- Ensure published_at exists on Aide (for sorting)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Aide' AND column_name = 'published_at'
    ) THEN
        ALTER TABLE "Aide" ADD COLUMN "published_at" TIMESTAMP(3);
    END IF;
END $$;

-- Ensure published_at exists on Demarche (for sorting)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Demarche' AND column_name = 'published_at'
    ) THEN
        ALTER TABLE "Demarche" ADD COLUMN "published_at" TIMESTAMP(3);
    END IF;
END $$;

-- Ensure published_at exists on Structure (for sorting)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Structure' AND column_name = 'published_at'
    ) THEN
        ALTER TABLE "Structure" ADD COLUMN "published_at" TIMESTAMP(3);
    END IF;
END $$;

-- Add statut column to Structure if it doesn't exist (some old schemas may have 'status' instead)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Structure' AND column_name = 'statut'
    ) THEN
        -- Check if 'status' exists and rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Structure' AND column_name = 'status'
        ) THEN
            ALTER TABLE "Structure" RENAME COLUMN "status" TO "statut";
        ELSE
            ALTER TABLE "Structure" ADD COLUMN "statut" TEXT DEFAULT 'brouillon';
        END IF;
    END IF;
END $$;

-- Migration complete
-- No data loss, no breaking changes
