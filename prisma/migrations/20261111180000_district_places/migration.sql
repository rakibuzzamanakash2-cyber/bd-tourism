-- CreateTable
CREATE TABLE "DistrictPlace" (
    "id" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tip" TEXT,
    "photo" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistrictPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DistrictPlace_districtId_slug_key" ON "DistrictPlace"("districtId", "slug");
CREATE INDEX "DistrictPlace_districtId_isPublished_idx" ON "DistrictPlace"("districtId", "isPublished");

-- AddForeignKey
ALTER TABLE "DistrictPlace" ADD CONSTRAINT "DistrictPlace_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
