-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "resume_falc" TEXT,
    "contenu_json" JSONB,
    "categorie" TEXT,
    "publics" TEXT[],
    "contexte" TEXT[],
    "mots_cles" TEXT[],
    "sources_urls" TEXT[],
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "published_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolboxItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "resume_falc" TEXT,
    "type" TEXT NOT NULL,
    "categorie" TEXT,
    "publics" TEXT[],
    "url_download" TEXT,
    "contenu_html" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "published_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolboxItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipRequest" (
    "id" TEXT NOT NULL,
    "structureName" TEXT NOT NULL,
    "city" TEXT,
    "type" TEXT,
    "website" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "ip_hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ToolboxItem_slug_key" ON "ToolboxItem"("slug");
