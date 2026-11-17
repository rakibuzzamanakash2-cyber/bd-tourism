-- What a trip costs us, in parts, so the numbers live in one editable place
-- instead of being scattered through the code.
CREATE TYPE "CostKind" AS ENUM ('LODGING', 'MEALS', 'GUIDE', 'TRANSPORT', 'PERMIT');
CREATE TYPE "CostUnit" AS ENUM ('PER_PERSON_PER_NIGHT', 'PER_PERSON_PER_DAY', 'PER_GROUP_PER_DAY', 'PER_PERSON');

CREATE TABLE "CostRate" (
  "id"        TEXT NOT NULL,
  "kind"      "CostKind" NOT NULL,
  "key"       TEXT NOT NULL,
  "label"     TEXT NOT NULL,
  "amountBdt" INTEGER NOT NULL,
  "unit"      "CostUnit" NOT NULL,
  "note"      TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CostRate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CostRate_kind_key_key" ON "CostRate"("kind", "key");
CREATE INDEX "CostRate_kind_sortOrder_idx" ON "CostRate"("kind", "sortOrder");

-- Small key/value store for numbers a person should be able to change
-- without a deploy.
CREATE TABLE "Setting" (
  "key"       TEXT NOT NULL,
  "value"     TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- Some districts simply cost more to run a trip in: fuel, boats, flights.
ALTER TABLE "District" ADD COLUMN "costMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- PLACEHOLDER AMOUNTS. Every one of these is a guess meant to be replaced
-- from Admin > Costs once real supplier prices are known.
INSERT INTO "CostRate" ("id","kind","key","label","amountBdt","unit","note","sortOrder") VALUES
  (gen_random_uuid()::text,'LODGING','budget','Simple room',1200,'PER_PERSON_PER_NIGHT','Guesthouse or basic hotel',1),
  (gen_random_uuid()::text,'LODGING','comfortable','Comfortable hotel',3000,'PER_PERSON_PER_NIGHT',NULL,2),
  (gen_random_uuid()::text,'LODGING','fine','The best in town',7500,'PER_PERSON_PER_NIGHT',NULL,3),
  (gen_random_uuid()::text,'MEALS','simple','Local meals',600,'PER_PERSON_PER_DAY','Three meals, local places',1),
  (gen_random_uuid()::text,'MEALS','mixed','Mixed meals',1200,'PER_PERSON_PER_DAY','Some restaurant meals',2),
  (gen_random_uuid()::text,'GUIDE','standard','Local guide',3500,'PER_GROUP_PER_DAY','One guide for the group',1),
  (gen_random_uuid()::text,'TRANSPORT','public','Buses and trains',800,'PER_PERSON_PER_DAY',NULL,1),
  (gen_random_uuid()::text,'TRANSPORT','car','Car and driver',5000,'PER_GROUP_PER_DAY',NULL,2),
  (gen_random_uuid()::text,'TRANSPORT','boat','Boat',6000,'PER_GROUP_PER_DAY','Varies a lot by size and route',3),
  (gen_random_uuid()::text,'PERMIT','standard','Permit handling',1000,'PER_PERSON','Government fee plus our paperwork',1);

INSERT INTO "Setting" ("key","value") VALUES
  ('serviceFeePercent','15'),
  ('estimateGroupSize','2');
