-- Homestay prices are now set by DeltaWay from the home's facilities
-- (see src/lib/homestay-shared.ts), so hosts no longer set their own.
ALTER TABLE "Homestay" DROP COLUMN "pricePerNightBDT";
