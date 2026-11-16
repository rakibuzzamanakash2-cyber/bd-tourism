-- The practical layer on a district: what a visitor needs to actually plan.
-- Every column is optional; a blank one simply isn't shown on the page.
ALTER TABLE "District"
  ADD COLUMN "gettingThere" TEXT,
  ADD COLUMN "travelTime"   TEXT,
  ADD COLUMN "bestMonths"   TEXT,
  ADD COLUMN "whereToStay"  TEXT,
  ADD COLUMN "moneyNotes"   TEXT,
  ADD COLUMN "connectivity" TEXT,
  ADD COLUMN "safetyNotes"  TEXT,
  ADD COLUMN "permitNote"   TEXT;

-- A starting value for the one field that has a sensible country-wide answer.
-- The cool, dry season suits most of the country; haor districts are the
-- exception and should be corrected by hand in the admin.
UPDATE "District" SET "bestMonths" = 'November to February' WHERE "bestMonths" IS NULL;

-- And a neutral note wherever a permit is already flagged.
UPDATE "District"
   SET "permitNote" = 'Foreign visitors need government permission to enter parts of this district. We apply for it as part of your trip, so tell us your dates as early as you can.'
 WHERE "permitRequired" = true AND "permitNote" IS NULL;
