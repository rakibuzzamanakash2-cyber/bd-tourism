import "server-only";
import { createHash } from "node:crypto";
import { cloudinary } from "@/lib/env";

export const UPLOAD_FOLDERS = ["destinations", "tours", "gallery"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
};

/**
 * Signs a direct browser → Cloudinary upload. The browser sends the file
 * with these fields; Cloudinary rejects it unless the signature matches, so
 * nobody can upload to our account without asking our server first.
 *
 * Signature = sha1 of the signed params, sorted and joined as k=v&k=v,
 * followed by the API secret (Cloudinary "authenticated requests" spec).
 */
export function signUpload(folder: UploadFolder, now = Date.now()): UploadSignature | null {
  if (!cloudinary.configured) return null;
  const params: Record<string, string | number> = {
    allowed_formats: "jpg,jpeg,png,webp",
    folder: `deltaway/${folder}`,
    timestamp: Math.floor(now / 1000),
  };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + cloudinary.apiSecret).digest("hex");
  return {
    cloudName: cloudinary.cloudName,
    apiKey: cloudinary.apiKey,
    timestamp: params.timestamp as number,
    folder: params.folder as string,
    allowedFormats: params.allowed_formats as string,
    signature,
  };
}

export type ConnectionTest = { ok: true; detail: string } | { ok: false; error: string };

/**
 * Checks the keys against Cloudinary's Admin API (the "usage" endpoint, which
 * needs the key and secret but changes nothing) and explains any failure.
 */
export async function testCloudinaryConnection(): Promise<ConnectionTest> {
  if (!cloudinary.configured) {
    return { ok: false, error: cloudinary.problem ?? "Cloudinary isn't set up yet. Add CLOUDINARY_URL to your .env and restart." };
  }
  const auth = Buffer.from(`${cloudinary.apiKey}:${cloudinary.apiSecret}`).toString("base64");
  let res: Response;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinary.cloudName)}/usage`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, error: "Couldn't reach Cloudinary. Check this computer's internet connection and try again." };
  }
  const body = (await res.json().catch(() => null)) as { plan?: string; credits?: { used_percent?: number }; error?: { message?: string } } | null;
  if (res.ok) {
    const used = body?.credits?.used_percent;
    return {
      ok: true,
      detail: `Connected to "${cloudinary.cloudName}"${body?.plan ? ` (${body.plan} plan` : ""}${typeof used === "number" ? `, ${used.toFixed(1)}% of monthly credits used)` : body?.plan ? ")" : ""}.`,
    };
  }
  const message = body?.error?.message ?? "";
  if (res.status === 401) {
    return { ok: false, error: /key/i.test(message) ? "Cloudinary doesn't recognise the API key. Copy it again from the dashboard." : "The API secret is wrong. Copy it again (click the eye icon to reveal it)." };
  }
  if (res.status === 404 || /cloud_name/i.test(message)) {
    return { ok: false, error: `No Cloudinary account is called "${cloudinary.cloudName}". Check the cloud name on your dashboard.` };
  }
  return { ok: false, error: `Cloudinary answered with an error (${res.status})${message ? `: ${message}` : ""}.` };
}
