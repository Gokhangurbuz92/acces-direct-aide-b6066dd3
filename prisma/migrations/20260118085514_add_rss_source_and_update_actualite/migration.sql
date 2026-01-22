/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Actualite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[canonical_url]` on the table `Actualite` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Actualite" ADD COLUMN     "canonical_url" TEXT,
ADD COLUMN     "category" TEXT DEFAULT 'actualite',
ADD COLUMN     "dedupe_hash" TEXT,
ADD COLUMN     "fetched_at" TIMESTAMP(3),
ADD COLUMN     "guid" TEXT,
ADD COLUMN     "key_points_falc" TEXT[],
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "source_id" TEXT,
ADD COLUMN     "source_name" TEXT,
ADD COLUMN     "summary_falc" TEXT,
ADD COLUMN     "territoire" TEXT DEFAULT 'FRANCE';

-- CreateTable
CREATE TABLE "RssSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feed_url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "trust_level" TEXT NOT NULL DEFAULT 'OFFICIAL',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "etag" TEXT,
    "last_modified" TEXT,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RssSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RssSource_feed_url_key" ON "RssSource"("feed_url");

-- CreateIndex
CREATE UNIQUE INDEX "Actualite_slug_key" ON "Actualite"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Actualite_canonical_url_key" ON "Actualite"("canonical_url");

-- CreateIndex
CREATE INDEX "Actualite_dedupe_hash_idx" ON "Actualite"("dedupe_hash");

-- CreateIndex
CREATE INDEX "Actualite_source_id_idx" ON "Actualite"("source_id");
