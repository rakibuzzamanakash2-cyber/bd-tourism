import { beforeEach, describe, expect, it, vi } from "vitest";

/** Counts the queries the function makes, so an N+1 can't creep back in. */
function fakeDb(blocked: string[], booked: string[]) {
  const calls: string[] = [];
  return {
    calls,
    db: {
      homestayBlockedDate: {
        findMany: async () => {
          calls.push("blocked");
          return blocked.map((homestayId) => ({ homestayId }));
        },
      },
      booking: {
        findMany: async () => {
          calls.push("booking");
          return booked.map((homestayId) => ({ homestayId }));
        },
      },
    },
  };
}

const load = async (blocked: string[], booked: string[]) => {
  const fake = fakeDb(blocked, booked);
  vi.doMock("@/lib/db", () => ({ db: fake.db }));
  const { homestaysWithConflicts } = await import("@/lib/homestays");
  return { homestaysWithConflicts, calls: fake.calls };
};

const from = new Date("2026-06-01T00:00:00Z");
const to = new Date("2026-06-04T00:00:00Z");

describe("finding which homestays are free", () => {
  beforeEach(() => vi.resetModules());

  it("asks the database twice, however many homestays there are", async () => {
    const ids = Array.from({ length: 100 }, (_, i) => `h${i}`);
    const { homestaysWithConflicts, calls } = await load([], []);
    await homestaysWithConflicts(ids, from, to);
    // The bug this replaces made two queries per homestay — 200 here.
    expect(calls).toHaveLength(2);
  });

  it("asks nothing at all when there are no homestays to check", async () => {
    const { homestaysWithConflicts, calls } = await load([], []);
    expect(await homestaysWithConflicts([], from, to)).toEqual(new Set());
    expect(calls).toHaveLength(0);
  });

  it("reports a homestay the host has blocked", async () => {
    const { homestaysWithConflicts } = await load(["h2"], []);
    expect(await homestaysWithConflicts(["h1", "h2"], from, to)).toEqual(new Set(["h2"]));
  });

  it("reports a homestay already booked", async () => {
    const { homestaysWithConflicts } = await load([], ["h1"]);
    expect(await homestaysWithConflicts(["h1", "h2"], from, to)).toEqual(new Set(["h1"]));
  });

  it("counts a homestay that is both only once", async () => {
    const { homestaysWithConflicts } = await load(["h1"], ["h1"]);
    expect(await homestaysWithConflicts(["h1"], from, to)).toEqual(new Set(["h1"]));
  });

  it("leaves a free homestay out of the set", async () => {
    const { homestaysWithConflicts } = await load(["h2"], ["h3"]);
    const out = await homestaysWithConflicts(["h1", "h2", "h3"], from, to);
    expect(out.has("h1")).toBe(false);
  });
});
