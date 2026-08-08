"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";

// ============================================================
// SCHEMAS
// ============================================================

const signupSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

// ============================================================
// SIGN UP
// ============================================================
export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "TOURIST",
      touristProfile: { create: {} },
    },
  });

  // Auto sign-in the newly created user
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          "Account created, but automatic sign-in failed. Please log in.",
      };
    }
    throw error; // Re-throw NEXT_REDIRECT
  }

  return null;
}

// ============================================================
// LOG IN
// ============================================================
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email or password." };
      }
      return { error: "Something went wrong. Please try again." };
    }
    throw error; // Re-throw NEXT_REDIRECT
  }

  return null;
}

// ============================================================
// GOOGLE SIGN IN
// ============================================================
export async function signInWithGoogleAction() {
  await signIn("google", { redirectTo: "/" });
}

// ============================================================
// SIGN OUT
// ============================================================
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
