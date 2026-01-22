-- CreateIndex
CREATE INDEX "Aide_statut_published_at_idx" ON "Aide"("statut", "published_at");

-- CreateIndex
CREATE INDEX "Aide_categoryId_statut_idx" ON "Aide"("categoryId", "statut");

-- CreateIndex
CREATE INDEX "Aide_statut_idx" ON "Aide"("statut");

-- CreateIndex
CREATE INDEX "Demarche_statut_published_at_idx" ON "Demarche"("statut", "published_at");

-- CreateIndex
CREATE INDEX "Demarche_categoryId_statut_idx" ON "Demarche"("categoryId", "statut");

-- CreateIndex
CREATE INDEX "Demarche_statut_idx" ON "Demarche"("statut");

-- CreateIndex
CREATE INDEX "Structure_statut_ville_idx" ON "Structure"("statut", "ville");

-- CreateIndex
CREATE INDEX "Structure_departement_idx" ON "Structure"("departement");

-- CreateIndex
CREATE INDEX "Structure_type_structure_idx" ON "Structure"("type_structure");
