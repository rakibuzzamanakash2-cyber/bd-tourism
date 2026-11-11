-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'QUOTE_REQUESTED' BEFORE 'PAYMENT_PENDING';

-- CreateEnum
CREATE TYPE "VisaStatus" AS ENUM ('NOT_REQUIRED', 'HAVE_VISA', 'ON_ARRIVAL', 'APPLYING');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "customTitle" TEXT,
ADD COLUMN "districtId" TEXT,
ADD COLUMN "placeId" TEXT,
ADD COLUMN "destinationId" TEXT,
ADD COLUMN "quotedAt" TIMESTAMP(3),
ADD COLUMN "emergencyName" TEXT,
ADD COLUMN "emergencyPhone" TEXT;

-- AlterTable
ALTER TABLE "BookingTraveler" ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "passportExpiry" TIMESTAMP(3),
ADD COLUMN "visaStatus" "VisaStatus",
ADD COLUMN "visaNumberEnc" TEXT,
ADD COLUMN "visaExpiry" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "DistrictPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
