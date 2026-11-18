-- Marks a cost line as a real supplier price that someone has actually checked.
--
-- NULL means the number is still a placeholder. Public estimates are built
-- only from checked prices, so until a line is confirmed the district pages
-- and the planner leave the estimate out entirely rather than print a figure
-- nobody has verified. Existing rows start as NULL on purpose: every number
-- seeded so far was invented.
ALTER TABLE "CostRate" ADD COLUMN "verifiedAt" TIMESTAMP(3);
