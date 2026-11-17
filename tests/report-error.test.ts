import { describe, expect, it, vi, beforeAll } from "vitest";

let fingerprintOf: (message: string, where: string, path: string | null) => string;
beforeAll(async () => {
  vi.doMock("@/lib/db", () => ({ db: {} }));
  vi.doMock("@/lib/email", () => ({ notifyTeam: async () => {} }));
  ({ fingerprintOf } = await import("@/lib/report-error"));
});

describe("grouping errors into one row per bug", () => {
  it("groups the same failure carrying different booking codes", () => {
    const a = fingerprintOf("Booking a3f91c2e8b7d not found", "action", "/book");
    const b = fingerprintOf("Booking 7c2e81f93aa0 not found", "action", "/book");
    expect(a).toBe(b);
  });

  it("groups the same failure with different numbers", () => {
    expect(fingerprintOf("Timed out after 3000ms", "route", "/api/x"))
      .toBe(fingerprintOf("Timed out after 9500ms", "route", "/api/x"));
  });

  it("groups the same failure quoting different values", () => {
    expect(fingerprintOf(`Unknown district "sylhet"`, "page", "/districts"))
      .toBe(fingerprintOf(`Unknown district "bandarban"`, "page", "/districts"));
  });

  // The opposite failure matters just as much: two real bugs must not merge.
  it("keeps genuinely different messages apart", () => {
    expect(fingerprintOf("Database is unreachable", "route", "/api/x"))
      .not.toBe(fingerprintOf("Payment validation failed", "route", "/api/x"));
  });

  it("keeps the same message apart when it happens somewhere else", () => {
    expect(fingerprintOf("Not found", "page", "/a")).not.toBe(fingerprintOf("Not found", "page", "/b"));
    expect(fingerprintOf("Not found", "page", "/a")).not.toBe(fingerprintOf("Not found", "route", "/a"));
  });

  it("is stable across calls and short enough to index", () => {
    const f = fingerprintOf("Something broke", "cron", null);
    expect(f).toBe(fingerprintOf("Something broke", "cron", null));
    expect(f).toHaveLength(32);
  });

  it("copes with a huge message without blowing up the key", () => {
    expect(fingerprintOf("x".repeat(50_000), "page", "/a")).toHaveLength(32);
  });
});
