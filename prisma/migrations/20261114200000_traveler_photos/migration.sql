-- CreateEnum
CREATE TYPE "TravelerPhotoStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TravelerPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "placeId" TEXT,
    "placeName" TEXT,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "creditName" TEXT NOT NULL,
    "status" "TravelerPhotoStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelerPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TravelerPhoto_url_key" ON "TravelerPhoto"("url");
CREATE INDEX "TravelerPhoto_status_createdAt_idx" ON "TravelerPhoto"("status", "createdAt");
CREATE INDEX "TravelerPhoto_districtId_status_idx" ON "TravelerPhoto"("districtId", "status");
CREATE INDEX "TravelerPhoto_placeId_status_idx" ON "TravelerPhoto"("placeId", "status");
CREATE INDEX "TravelerPhoto_userId_idx" ON "TravelerPhoto"("userId");

-- AddForeignKey
ALTER TABLE "TravelerPhoto" ADD CONSTRAINT "TravelerPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelerPhoto" ADD CONSTRAINT "TravelerPhoto_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelerPhoto" ADD CONSTRAINT "TravelerPhoto_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "DistrictPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
