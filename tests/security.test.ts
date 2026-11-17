import { describe, expect, it } from "vitest";
import { decrypt, encrypt, isEncrypted, last4 } from "@/lib/crypto";
import { isAllowedImageUrl } from "@/lib/image-hosts";

describe("passport and visa numbers at rest", () => {
  it("come back out exactly as they went in", () => {
    for (const v of ["C01X00T47", "1234567890123", "Ünïcødé-123", "a".repeat(200)]) {
      expect(decrypt(encrypt(v))).toBe(v);
    }
  });

  it("are not stored as plain text", () => {
    const stored = encrypt("C01X00T47");
    expect(stored).not.toContain("C01X00T47");
    expect(isEncrypted(stored)).toBe(true);
  });

  it("encrypt differently every time, so equal numbers aren't obvious", () => {
    expect(encrypt("C01X00T47")).not.toBe(encrypt("C01X00T47"));
  });

  it("refuse to decrypt tampered data rather than returning something wrong", () => {
    const stored = encrypt("C01X00T47");
    const tampered = stored.slice(0, -4) + (stored.slice(-4) === "AAAA" ? "BBBB" : "AAAA");
    expect(decrypt(tampered)).toBeNull();
  });

  it("handle missing values without throwing", () => {
    expect(decrypt(null)).toBeNull();
    expect(decrypt(undefined)).toBeNull();
    expect(decrypt("")).toBeNull();
  });

  it("show only the last four characters when masked", () => {
    expect(last4("C01X00T47")).toBe("0T47");
    expect(last4("12 34 56 7890")).toBe("7890");
  });
});

describe("image URLs we are willing to load", () => {
  it("accepts our own hosts", () => {
    expect(isAllowedImageUrl("https://res.cloudinary.com/demo/image/upload/v1/a.jpg")).toBe(true);
    expect(isAllowedImageUrl("https://upload.wikimedia.org/wikipedia/commons/a.jpg")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isAllowedImageUrl("https://evil.example/a.jpg")).toBe(false);
  });

  it("rejects javascript: and data: payloads", () => {
    expect(isAllowedImageUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedImageUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(false);
  });

  it("rejects plain http, so images can't be swapped in transit", () => {
    expect(isAllowedImageUrl("http://res.cloudinary.com/demo/image/upload/a.jpg")).toBe(false);
  });

  // A host check done with "contains" or "endsWith" lets these through.
  it("is not fooled by a lookalike host", () => {
    expect(isAllowedImageUrl("https://res.cloudinary.com.evil.example/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://evil.example/res.cloudinary.com/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://notres.cloudinary.com/a.jpg")).toBe(false);
  });

  it("is not fooled by credentials in the URL", () => {
    expect(isAllowedImageUrl("https://res.cloudinary.com@evil.example/a.jpg")).toBe(false);
  });

  it("rejects empty and malformed input", () => {
    for (const v of ["", "   ", "not a url", "//res.cloudinary.com/a.jpg"]) {
      expect(isAllowedImageUrl(v)).toBe(false);
    }
  });
});
