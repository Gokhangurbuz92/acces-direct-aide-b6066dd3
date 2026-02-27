-- CreateTable SharedDiagnostic (Partage de Dossier)
CREATE TABLE IF NOT EXISTS "SharedDiagnostic" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "situation" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SharedDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SharedDiagnostic_createdAt_idx" ON "SharedDiagnostic"("createdAt");
CREATE INDEX IF NOT EXISTS "SharedDiagnostic_expiresAt_idx" ON "SharedDiagnostic"("expiresAt");
