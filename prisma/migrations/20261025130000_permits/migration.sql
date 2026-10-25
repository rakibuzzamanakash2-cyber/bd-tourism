-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('NOT_STARTED', 'DOCUMENTS_NEEDED', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Permit" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "status" "PermitStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "referenceNumber" TEXT,
    "noteToTraveler" TEXT,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Permit_status_idx" ON "Permit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Permit_bookingId_regionId_key" ON "Permit"("bookingId", "regionId");

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
