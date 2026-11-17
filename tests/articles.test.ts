import { describe, expect, it } from "vitest";
import { readBody, readingMinutes } from "@/lib/articles";

const section = (over = {}) => ({ heading: "A heading", paragraphs: ["One."], bullets: [], ...over });

describe("reading an article body out of the database", () => {
  it("accepts a well-formed body", () => {
    expect(readBody([section()])).toHaveLength(1);
  });

  it("returns nothing for junk rather than throwing", () => {
    for (const v of [null, undefined, 42, "text", {}]) expect(readBody(v)).toEqual([]);
  });

  it("keeps the good sections and drops the broken ones", () => {
    const out = readBody([section(), { heading: 5 }, section({ heading: "Two" })]);
    expect(out.map((s) => s.heading)).toEqual(["A heading", "Two"]);
  });

  it("drops a section with an empty paragraph rather than rendering a gap", () => {
    expect(readBody([{ heading: "H", paragraphs: [""], bullets: [] }])).toEqual([]);
  });
});

describe("reading time", () => {
  it("is at least a minute", () => {
    expect(readingMinutes([section()])).toBe(1);
  });

  it("grows with the length", () => {
    const long = [section({ paragraphs: [Array.from({ length: 600 }, () => "word").join(" ")] })];
    expect(readingMinutes(long)).toBe(3);
  });

  it("copes with an empty body", () => {
    expect(readingMinutes([])).toBe(1);
  });
});

import { bodyToText, parseBodyText } from "@/lib/articles";

describe("writing an article as plain text", () => {
  const text = `## First heading
A paragraph.
Another paragraph.
- a bullet
- another bullet

## Second heading
Just prose.`;

  it("splits it into sections", () => {
    const out = parseBodyText(text);
    expect(out).toHaveLength(2);
    expect(out[0].heading).toBe("First heading");
    expect(out[0].paragraphs).toEqual(["A paragraph.", "Another paragraph."]);
    expect(out[0].bullets).toEqual(["a bullet", "another bullet"]);
    expect(out[1].paragraphs).toEqual(["Just prose."]);
  });

  it("survives a round trip through the editor", () => {
    expect(parseBodyText(bodyToText(parseBodyText(text)))).toEqual(parseBodyText(text));
  });

  it("keeps text written before any heading", () => {
    const out = parseBodyText("An opening line with no heading.");
    expect(out[0].heading).toBe("");
    expect(out[0].paragraphs).toEqual(["An opening line with no heading."]);
  });

  it("accepts the usual bullet characters", () => {
    expect(parseBodyText("- one\n* two\n• three")[0].bullets).toEqual(["one", "two", "three"]);
  });

  it("treats markup as plain text rather than rendering it", () => {
    const out = parseBodyText("<script>alert(1)</script>");
    expect(out[0].paragraphs[0]).toBe("<script>alert(1)</script>");
  });

  it("returns nothing for an empty draft", () => {
    expect(parseBodyText("")).toEqual([]);
    expect(parseBodyText("   \n  \n")).toEqual([]);
  });
});
