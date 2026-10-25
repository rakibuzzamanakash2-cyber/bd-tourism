-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('UNPAID', 'PAID');

-- AlterTable
ALTER TABLE "ApplicationInvite" ADD COLUMN     "emailedAt" TIMESTAMP(3),
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'bn',
ADD COLUMN     "openedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "requestedGuideId" TEXT;

-- CreateTable
CREATE TABLE "GuideProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bio" TEXT NOT NULL,
    "languages" TEXT[],
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "dayRateBDT" INTEGER NOT NULL,
    "licenceNumber" TEXT,
    "phone" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isListed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideBlockedDate" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "GuideBlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideAssignment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "feeBDT" INTEGER NOT NULL,
    "noteToGuide" TEXT,
    "declineReason" TEXT,
    "respondedAt" TIMESTAMP(3),
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "payoutReference" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GuideRegions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GuideRegions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuideProfile_userId_key" ON "GuideProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideProfile_slug_key" ON "GuideProfile"("slug");

-- CreateIndex
CREATE INDEX "GuideProfile_isActive_isListed_idx" ON "GuideProfile"("isActive", "isListed");

-- CreateIndex
CREATE UNIQUE INDEX "GuideBlockedDate_guideId_date_key" ON "GuideBlockedDate"("guideId", "date");

-- CreateIndex
CREATE INDEX "GuideAssignment_bookingId_idx" ON "GuideAssignment"("bookingId");

-- CreateIndex
CREATE INDEX "GuideAssignment_guideId_status_idx" ON "GuideAssignment"("guideId", "status");

-- CreateIndex
CREATE INDEX "_GuideRegions_B_index" ON "_GuideRegions"("B");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_requestedGuideId_fkey" FOREIGN KEY ("requestedGuideId") REFERENCES "GuideProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideBlockedDate" ADD CONSTRAINT "GuideBlockedDate_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideAssignment" ADD CONSTRAINT "GuideAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideAssignment" ADD CONSTRAINT "GuideAssignment_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideAssignment" ADD CONSTRAINT "GuideAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuideRegions" ADD CONSTRAINT "_GuideRegions_A_fkey" FOREIGN KEY ("A") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuideRegions" ADD CONSTRAINT "_GuideRegions_B_fkey" FOREIGN KEY ("B") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;
