"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nationality: z.string().max(80).optional().nullable(),
  phoneNumber: z.string().max(40).optional().nullable(),
  passportNumber: z.string().max(40).optional().nullable(),
  emergencyContact: z.string().max(200).optional().nullable(),
  dietaryPrefs: z.string().max(500).optional().nullable(),
});

export type ProfileState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    nationality: (formData.get("nationality") as string) || null,
    phoneNumber: (formData.get("phoneNumber") as string) || null,
    passportNumber: (formData.get("passportNumber") as string) || null,
    emergencyContact: (formData.get("emergencyContact") as string) || null,
    dietaryPrefs: (formData.get("dietaryPrefs") as string) || null,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, ...profileData } = parsed.data;

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
        touristProfile: {
          upsert: {
            create: profileData,
            update: profileData,
          },
        },
      },
    });
  } catch {
    return { error: "Something went wrong while saving. Please try again." };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
