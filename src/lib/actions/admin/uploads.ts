"use server";

import { z } from "zod";
import { UPLOAD_FOLDERS, signUpload, type UploadSignature } from "@/lib/cloudinary";
import { getAdminOrNull } from "@/lib/session";

export async function getUploadSignature(
  folder: string,
): Promise<{ ok: true; signature: UploadSignature } | { ok: false; error: string }> {
  if (!(await getAdminOrNull())) return { ok: false, error: "Not allowed." };
  const parsed = z.enum(UPLOAD_FOLDERS).safeParse(folder);
  if (!parsed.success) return { ok: false, error: "Invalid folder." };
  const signature = signUpload(parsed.data);
  if (!signature) return { ok: false, error: "Photo uploads aren't set up yet. Paste a photo link instead." };
  return { ok: true, signature };
}
