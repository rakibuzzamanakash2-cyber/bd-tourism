import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

// AES-256-GCM for small secrets like passport numbers.
// Stored as  enc:v1:<keyId>:<iv>:<tag>:<ciphertext>  (base64url parts).
// keyId "k1" = DATA_ENCRYPTION_KEY; "k0" = a key derived from AUTH_SECRET,
// used only until DATA_ENCRYPTION_KEY is set. Both stay readable.

const PREFIX = "enc:v1:";

function parseKey(raw: string | undefined): Buffer | null {
  if (!raw) return null;
  const v = raw.trim();
  const buf = /^[0-9a-f]{64}$/i.test(v) ? Buffer.from(v, "hex") : Buffer.from(v, "base64");
  return buf.length === 32 ? buf : null;
}

const explicitKey = parseKey(env.DATA_ENCRYPTION_KEY);
const derivedKey = Buffer.from(hkdfSync("sha256", env.AUTH_SECRET, "deltaway-data-v1", "passport-numbers", 32));

export function encryptionStatus(): { explicit: boolean; problem: string | null } {
  if (env.DATA_ENCRYPTION_KEY && !explicitKey) {
    return { explicit: false, problem: "DATA_ENCRYPTION_KEY must be 32 random bytes, written as base64 or 64 hex characters. Until it's fixed, a key derived from AUTH_SECRET is used." };
  }
  return { explicit: Boolean(explicitKey), problem: null };
}

const b64 = (b: Buffer) => b.toString("base64url");

export const isEncrypted = (v: string | null | undefined) => Boolean(v?.startsWith(PREFIX));

export function encrypt(plain: string): string {
  const [kid, key] = explicitKey ? ["k1", explicitKey] : ["k0", derivedKey];
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${PREFIX}${kid}:${b64(iv)}:${b64(cipher.getAuthTag())}:${b64(ct)}`;
}

/** Decrypts our format; plain (not yet encrypted) text is returned as it is. Null if it can't be read. */
export function decrypt(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!isEncrypted(value)) return value;
  const [kid, iv, tag, ct] = value.slice(PREFIX.length).split(":");
  const key = kid === "k1" ? explicitKey : kid === "k0" ? derivedKey : null;
  if (!key || !iv || !tag || !ct) return null;
  try {
    const d = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** "AB1234567" → "4567" */
export const last4 = (v: string) => v.replace(/\s+/g, "").slice(-4);
