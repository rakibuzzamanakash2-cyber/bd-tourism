import { afterEach, describe, expect, it, vi } from "vitest";
import { listOr } from "@/lib/safe-list";

afterEach(() => vi.restoreAllMocks());

describe("a query that must not bring the build down", () => {
  it("returns the rows when it works", async () => {
    expect(await listOr("things", async () => [1, 2, 3])).toEqual([1, 2, 3]);
  });

  // This is the case that failed a deployment: a table added in a migration
  // that hadn't reached the environment being built.
  it("returns nothing when the table doesn't exist", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await listOr("articles", async () => {
      throw new Error('The table `public.Article` does not exist in the current database.');
    });
    expect(out).toEqual([]);
  });

  it("returns nothing when the database is unreachable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await listOr("districts", async () => { throw new Error("ECONNREFUSED"); })).toEqual([]);
  });

  it("says what it skipped, so a silent empty sitemap is noticed", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await listOr("articles", async () => { throw new Error("boom\nstack line"); });
    expect(warn).toHaveBeenCalledWith("[articles] skipped:", "boom");
  });

  it("copes with something thrown that isn't an Error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await listOr("x", async () => { throw "just a string"; })).toEqual([]);
  });
});
