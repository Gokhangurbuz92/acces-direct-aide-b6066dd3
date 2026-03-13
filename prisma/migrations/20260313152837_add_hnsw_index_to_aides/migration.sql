-- Création de l'index HNSW pour optimiser la recherche sémantique (similarité cosinus).
-- Cela évite le Full Table Scan, divise le temps de réponse par 100 et empêche les crashs (OOM).
CREATE INDEX IF NOT EXISTS aide_embedding_hnsw_idx 
ON "Aide" 
USING hnsw (embedding vector_cosine_ops);
