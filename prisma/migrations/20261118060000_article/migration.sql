-- Articles: the questions travellers type into Google before they book.
-- The body is structured rather than free HTML, so nothing we render can
-- carry script, and every article looks like the rest of the site.
CREATE TABLE "Article" (
  "id"          TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "excerpt"     TEXT NOT NULL,
  "photo"       TEXT,
  -- [{ heading, paragraphs: [], bullets: [] }]
  "body"        JSONB NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "districtId"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_isPublished_publishedAt_idx" ON "Article"("isPublished", "publishedAt" DESC);
ALTER TABLE "Article" ADD CONSTRAINT "Article_districtId_fkey"
  FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
