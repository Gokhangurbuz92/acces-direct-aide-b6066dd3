-- CreateTable: DataSource (renamed from Source to avoid confusion)
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_url" TEXT,
    "region_scope" TEXT NOT NULL DEFAULT 'national',
    "license" TEXT,
    "trust_level" TEXT DEFAULT 'OFFICIAL',
    "last_sync_at" TIMESTAMP(3),
    "last_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SourceDocument
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "source_url_exact" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_hash" TEXT,
    "raw_excerpt" TEXT,
    "http_status" INTEGER,
    "license" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SyncRun
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "source_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "error" TEXT,
    "stats" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_source_url_exact_key" ON "SourceDocument"("source_url_exact");

-- CreateIndex
CREATE INDEX "SourceDocument_source_id_idx" ON "SourceDocument"("source_id");

-- CreateIndex
CREATE INDEX "SourceDocument_fetched_at_idx" ON "SourceDocument"("fetched_at");

-- CreateIndex
CREATE INDEX "SyncRun_source_id_idx" ON "SyncRun"("source_id");

-- CreateIndex
CREATE INDEX "SyncRun_started_at_idx" ON "SyncRun"("started_at");

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing data: Link Aide/Demarche/Structure to SourceDocument
-- Add source_document_id column to existing tables
ALTER TABLE "Aide" ADD COLUMN "source_document_id" TEXT;
ALTER TABLE "Demarche" ADD COLUMN "source_document_id" TEXT;
ALTER TABLE "Structure" ADD COLUMN "source_document_id" TEXT;
ALTER TABLE "Dispositif" ADD COLUMN "source_document_id" TEXT;

-- CreateIndex
CREATE INDEX "Aide_source_document_id_idx" ON "Aide"("source_document_id");
CREATE INDEX "Demarche_source_document_id_idx" ON "Demarche"("source_document_id");
CREATE INDEX "Structure_source_document_id_idx" ON "Structure"("source_document_id");
CREATE INDEX "Dispositif_source_document_id_idx" ON "Dispositif"("source_document_id");

-- AddForeignKey (optional, can be null for legacy data)
ALTER TABLE "Aide" ADD CONSTRAINT "Aide_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Demarche" ADD CONSTRAINT "Demarche_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dispositif" ADD CONSTRAINT "Dispositif_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
