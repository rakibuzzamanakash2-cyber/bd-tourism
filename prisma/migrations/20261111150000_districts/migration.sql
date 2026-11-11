-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "knownFor" TEXT NOT NULL,
    "highlights" TEXT[],
    "photo" TEXT,
    "permitRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Destination" ADD COLUMN "districtId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "District_slug_key" ON "District"("slug");
CREATE UNIQUE INDEX "District_name_key" ON "District"("name");
CREATE INDEX "District_division_idx" ON "District"("division");
CREATE INDEX "Destination_districtId_idx" ON "Destination"("districtId");

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
