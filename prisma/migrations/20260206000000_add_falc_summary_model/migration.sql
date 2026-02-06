-- CreateTable
CREATE TABLE "FalcSummary" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "titre_falc" TEXT,
    "resume_falc" TEXT,
    "etapes_falc" TEXT,
    "points_cles" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source_retrieved_at" TIMESTAMP(3),

    CONSTRAINT "FalcSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FalcSummary_entity_type_idx" ON "FalcSummary"("entity_type");

-- CreateIndex
CREATE INDEX "FalcSummary_entity_id_idx" ON "FalcSummary"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "FalcSummary_entity_type_entity_id_key" ON "FalcSummary"("entity_type", "entity_id");
