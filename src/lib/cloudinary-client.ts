// Browser-side upload to Cloudinary using a signature from our server.
// Shared by the admin photo fields and the applicant upload fields.
import type { UploadSignature } from "@/lib/cloudinary";

export type UploadResult = { secureUrl: string; publicId: string; format: string; bytes: number };

/** Turns Cloudinary's error into what to do about it. */
export function explainUploadError(status: number, message = "", forAdmin = true): string {
  const check = forAdmin ? " Open Admin → Settings and press Test connection." : " Please try again later.";
  if (/signature/i.test(message)) return "Cloudinary rejected the upload: the API secret looks wrong." + check;
  if (/api_key/i.test(message)) return "Cloudinary doesn't recognise the API key." + check;
  if (/cloud_name|cloud name/i.test(message) || status === 404) return "Cloudinary doesn't recognise the cloud name." + check;
  if (/format/i.test(message)) return "That file type isn't allowed here.";
  if (/file size|too large/i.test(message)) return "That file is too big. Please use a smaller one.";
  return message ? `Upload failed: ${message}` : `Upload failed (error ${status}). Please try again.`;
}

export async function uploadToCloudinary(file: File, s: UploadSignature, forAdmin = true): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", s.apiKey);
  body.append("timestamp", String(s.timestamp));
  body.append("folder", s.folder);
  body.append("allowed_formats", s.allowedFormats);
  if (s.type) body.append("type", s.type);
  body.append("signature", s.signature);
  let res: Response;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: "POST", body });
  } catch {
    throw new Error("Couldn't reach Cloudinary. Check your internet connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.secure_url) throw new Error(explainUploadError(res.status, data?.error?.message, forAdmin));
  return { secureUrl: data.secure_url, publicId: data.public_id, format: data.format, bytes: data.bytes };
}
