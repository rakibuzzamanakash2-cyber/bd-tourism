-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BookingTraveler" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "nationality" TEXT,
    "passportEnc" TEXT,
    "passportLast4" TEXT,
    "passportPurgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingTraveler_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingTraveler_bookingId_idx" ON "BookingTraveler"("bookingId");

-- AddForeignKey
ALTER TABLE "BookingTraveler" ADD CONSTRAINT "BookingTraveler_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Email verification starts now: everyone who already has an account counts
-- as verified, so nobody is locked out of booking.
UPDATE "User" SET "emailVerified" = "createdAt" WHERE "emailVerified" IS NULL;
