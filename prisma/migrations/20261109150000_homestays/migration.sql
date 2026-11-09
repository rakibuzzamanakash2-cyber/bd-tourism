-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "homestayId" TEXT,
ADD COLUMN     "hostPaidAt" TIMESTAMP(3),
ADD COLUMN     "hostPayoutBDT" INTEGER,
ADD COLUMN     "hostPayoutReference" TEXT,
ADD COLUMN     "hostPayoutStatus" "PayoutStatus",
ADD COLUMN     "hostReminderSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Homestay" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "houseRules" TEXT,
    "rooms" INTEGER NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "facilities" TEXT[],
    "languages" TEXT[],
    "pricePerNightBDT" INTEGER NOT NULL,
    "photos" TEXT[],
    "address" TEXT,
    "phone" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'bn',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isListed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homestay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomestayBlockedDate" (
    "id" TEXT NOT NULL,
    "homestayId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "HomestayBlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_homestayId_startDate_idx" ON "Booking"("homestayId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Homestay_hostId_key" ON "Homestay"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "Homestay_slug_key" ON "Homestay"("slug");

-- CreateIndex
CREATE INDEX "Homestay_isActive_isListed_regionId_idx" ON "Homestay"("isActive", "isListed", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "HomestayBlockedDate_homestayId_date_key" ON "HomestayBlockedDate"("homestayId", "date");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_homestayId_fkey" FOREIGN KEY ("homestayId") REFERENCES "Homestay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homestay" ADD CONSTRAINT "Homestay_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homestay" ADD CONSTRAINT "Homestay_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomestayBlockedDate" ADD CONSTRAINT "HomestayBlockedDate_homestayId_fkey" FOREIGN KEY ("homestayId") REFERENCES "Homestay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
