import { describe, expect, it, vi, beforeAll } from "vitest";

// isOurTravelerUpload compares against the configured Cloudinary cloud, so
// pin one before the module reads it.
process.env.CLOUDINARY_URL = "cloudinary://123456789012345:testsecrettestsecret12@dwtest";

let isOurTravelerUpload: (url: string, publicId: string) => boolean;
beforeAll(async () => {
  vi.doMock("@/lib/db", () => ({ db: {} }));
  ({ isOurTravelerUpload } = await import("@/lib/traveler-photos"));
});

const good = "https://res.cloudinary.com/dwtest/image/upload/v1731500000/deltaway/travelers/abc123XYZ.jpg";
const id = "deltaway/travelers/abc123XYZ";

describe("photos a traveller claims to have uploaded", () => {
  it("accepts one of ours", () => {
    expect(isOurTravelerUpload(good, id)).toBe(true);
  });

  it("accepts one with no version segment", () => {
    expect(isOurTravelerUpload("https://res.cloudinary.com/dwtest/image/upload/deltaway/travelers/a-b_12345.webp", "deltaway/travelers/a-b_12345")).toBe(true);
  });

  // Each of these is someone trying to get a URL onto our pages for free.
  it("rejects another Cloudinary account", () => {
    expect(isOurTravelerUpload(good.replace("dwtest", "someoneelse"), id)).toBe(false);
  });

  it("rejects another host entirely", () => {
    expect(isOurTravelerUpload("https://evil.example/dwtest/image/upload/deltaway/travelers/abc123XYZ.jpg", id)).toBe(false);
  });

  it("rejects plain http", () => {
    expect(isOurTravelerUpload(good.replace("https://", "http://"), id)).toBe(false);
  });

  it("rejects a file from one of our other folders", () => {
    expect(isOurTravelerUpload(good.replace("/travelers/", "/tours/"), "deltaway/tours/abc123XYZ")).toBe(false);
  });

  it("rejects a URL whose id doesn't match the one submitted", () => {
    expect(isOurTravelerUpload(good.replace("abc123XYZ", "zzz999AAA"), id)).toBe(false);
  });

  it("rejects path traversal in the id", () => {
    expect(isOurTravelerUpload("https://res.cloudinary.com/dwtest/image/upload/v1/deltaway/travelers/../ids/x.jpg", "deltaway/travelers/../ids/x")).toBe(false);
  });

  it("rejects a query string, which could carry a transformation", () => {
    expect(isOurTravelerUpload(`${good}?x=1`, id)).toBe(false);
  });

  it("rejects file types that can carry script, such as svg", () => {
    expect(isOurTravelerUpload(good.replace(".jpg", ".svg"), id)).toBe(false);
  });

  it("rejects anything appended after the file name", () => {
    expect(isOurTravelerUpload(`${good}/extra.jpg`, id)).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isOurTravelerUpload("", "")).toBe(false);
  });
});
