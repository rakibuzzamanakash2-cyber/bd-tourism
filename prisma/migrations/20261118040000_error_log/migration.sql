-- Somewhere for failures to land. Without this, a 500 at 3am is only ever
-- a line in a hosting provider's log that nobody reads.
CREATE TABLE "ErrorLog" (
  "id"          TEXT NOT NULL,
  -- Same bug, same fingerprint: one row that counts up, not a thousand rows.
  "fingerprint" TEXT NOT NULL,
  "message"     TEXT NOT NULL,
  "stack"       TEXT,
  "where"       TEXT NOT NULL,
  "path"        TEXT,
  "digest"      TEXT,
  "userId"      TEXT,
  "count"       INTEGER NOT NULL DEFAULT 1,
  "firstSeen"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeen"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- When we last emailed about it, so a loop can't flood the inbox
  "notifiedAt"  TIMESTAMP(3),
  "resolvedAt"  TIMESTAMP(3),
  CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ErrorLog_fingerprint_key" ON "ErrorLog"("fingerprint");
CREATE INDEX "ErrorLog_resolvedAt_lastSeen_idx" ON "ErrorLog"("resolvedAt", "lastSeen" DESC);
