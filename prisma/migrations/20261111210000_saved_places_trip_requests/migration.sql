-- CreateEnum
CREATE TYPE "TripRequestStatus" AS ENUM ('NEW', 'REPLIED', 'BOOKED', 'CLOSED');

-- AlterTable
ALTER TABLE "DistrictPlace" ADD COLUMN "about" TEXT,
ADD COLUMN "bestTime" TEXT,
ADD COLUMN "gettingThere" TEXT,
ADD COLUMN "goodToKnow" TEXT,
ADD COLUMN "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "SavedDistrict" (
    "userId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedDistrict_pkey" PRIMARY KEY ("userId","districtId")
);

-- CreateTable
CREATE TABLE "SavedPlace" (
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPlace_pkey" PRIMARY KEY ("userId","placeId")
);

-- CreateTable
CREATE TABLE "SavedHomestay" (
    "userId" TEXT NOT NULL,
    "homestayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedHomestay_pkey" PRIMARY KEY ("userId","homestayId")
);

-- CreateTable
CREATE TABLE "TripRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "travelers" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "days" INTEGER,
    "message" TEXT NOT NULL,
    "status" "TripRequestStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "districtId" TEXT,
    "placeId" TEXT,
    "destinationId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripRequest_status_createdAt_idx" ON "TripRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "SavedDistrict" ADD CONSTRAINT "SavedDistrict_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedDistrict" ADD CONSTRAINT "SavedDistrict_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "DistrictPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedHomestay" ADD CONSTRAINT "SavedHomestay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedHomestay" ADD CONSTRAINT "SavedHomestay_homestayId_fkey" FOREIGN KEY ("homestayId") REFERENCES "Homestay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "DistrictPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
