import "server-only";
import { createHash } from "node:crypto";
import { env, features } from "@/lib/env";

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
  if (!features.uploads) return null;
  const params: Record<string, string | number> = {
    allowed_formats: "jpg,jpeg,png,webp",
    folder: `deltaway/${folder}`,
    timestamp: Math.floor(now / 1000),
  };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + env.CLOUDINARY_API_SECRET).digest("hex");
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    timestamp: params.timestamp as number,
    folder: params.folder as string,
    allowedFormats: params.allowed_formats as string,
    signature,
  };
}
