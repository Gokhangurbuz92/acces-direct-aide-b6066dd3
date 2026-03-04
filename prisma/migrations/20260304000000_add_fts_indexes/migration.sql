-- FTS GIN Indexes for Boussole Sociale RAG (Phase 3)
-- PostgreSQL Full-Text Search with French stemming
-- Enables O(log n) keyword search instead of O(n) sequential scans

-- Aide: titre + cest_quoi (main content fields for orientation)
CREATE INDEX IF NOT EXISTS aide_fts_idx ON "Aide" USING GIN (
  to_tsvector('french', coalesce("titre",'') || ' ' || coalesce("cest_quoi",''))
);

-- Structure: nom + ville (for territorial orientation)
CREATE INDEX IF NOT EXISTS structure_fts_idx ON "Structure" USING GIN (
  to_tsvector('french', coalesce("nom",'') || ' ' || coalesce("ville",''))
);

-- Demarche: titre + description_courte (administrative procedures)
CREATE INDEX IF NOT EXISTS demarche_fts_idx ON "Demarche" USING GIN (
  to_tsvector('french', coalesce("titre",'') || ' ' || coalesce("description_courte",''))
);

-- ConversationLog: metadata field for analytics enrichment
ALTER TABLE "ConversationLog" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
