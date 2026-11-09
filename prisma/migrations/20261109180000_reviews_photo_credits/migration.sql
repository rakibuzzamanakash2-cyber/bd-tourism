-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "reviewRequestSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "guideComment" TEXT,
ADD COLUMN     "guideId" TEXT,
ADD COLUMN     "guideRating" INTEGER,
ADD COLUMN     "hiddenReason" TEXT,
ADD COLUMN     "homestayId" TEXT,
ADD COLUMN     "packageId" TEXT,
ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "reply" TEXT,
ADD COLUMN     "replyBy" TEXT,
ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ImageCredit" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "author" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "licenseUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_packageId_status_idx" ON "Review"("packageId", "status");

-- CreateIndex
CREATE INDEX "Review_homestayId_status_idx" ON "Review"("homestayId", "status");

-- CreateIndex
CREATE INDEX "Review_guideId_status_idx" ON "Review"("guideId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ImageCredit_url_key" ON "ImageCredit"("url");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TourPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_homestayId_fkey" FOREIGN KEY ("homestayId") REFERENCES "Homestay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
