"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { RATE_LIMITS, clientIp, rateLimit, tooManyMessage } from "@/lib/rate-limit";
import { safeCallbackUrl } from "@/lib/utils";

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
  /**
   * What the user typed (never the password), sent back so the form can
   * refill it — React 19 clears a form after every server action.
   */
  values?: { name?: string; email?: string };
} | null;

function typedValues(formData: FormData) {
  const name = formData.get("name");
  const email = formData.get("email");
  return {
    name: typeof name === "string" ? name : undefined,
    email: typeof email === "string" ? email : undefined,
  };
}

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
    return { fieldErrors, values: typedValues(formData) };
  }

  const { name, email, password } = parsed.data;

  const limited = await rateLimit(`signup:ip:${await clientIp()}`, RATE_LIMITS.signupIp);
  if (!limited.ok) {
    return { error: tooManyMessage(limited.retryAfterSeconds), values: typedValues(formData) };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      error: "An account with this email already exists.",
      values: typedValues(formData),
    };
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
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          "Account created, but automatic sign-in failed. Please log in.",
        values: typedValues(formData),
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
    return { fieldErrors, values: typedValues(formData) };
  }

  // Slow down password guessing: per email address and per IP address
  const email = parsed.data.email.toLowerCase();
  for (const check of [
    rateLimit(`login:email:${email}`, RATE_LIMITS.loginEmail),
    rateLimit(`login:ip:${await clientIp()}`, RATE_LIMITS.loginIp),
  ]) {
    const result = await check;
    if (!result.ok) {
      return { error: tooManyMessage(result.retryAfterSeconds), values: typedValues(formData) };
    }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          error: "Invalid email or password.",
          values: typedValues(formData),
        };
      }
      return {
        error: "Something went wrong. Please try again.",
        values: typedValues(formData),
      };
    }
    throw error; // Re-throw NEXT_REDIRECT
  }

  return null;
}

// ============================================================
// GOOGLE SIGN IN
// ============================================================
export async function signInWithGoogleAction(formData: FormData) {
  await signIn("google", { redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
}

// ============================================================
// SIGN OUT
// ============================================================
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
