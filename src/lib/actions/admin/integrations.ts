"use server";

import { testCloudinaryConnection, type ConnectionTest } from "@/lib/cloudinary";
import { getAdminOrNull } from "@/lib/session";

export async function testCloudinaryAction(): Promise<ConnectionTest> {
  if (!(await getAdminOrNull())) return { ok: false, error: "Not allowed." };
  return testCloudinaryConnection();
}
