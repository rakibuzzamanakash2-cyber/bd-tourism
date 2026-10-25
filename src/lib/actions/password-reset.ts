"use server";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

// Reset links stay valid for one hour.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
// Stored in VerificationToken.identifier so reset tokens never collide with
// NextAuth's own email-verification tokens.
const identifierFor = (email: string) => `password-reset:${email}`;

// We only ever store a hash of the token. If the database leaks, the links
// in people's inboxes still can't be rebuilt from it.
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export type PasswordResetState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

function fieldErrorsFrom(issues: z.ZodIssue[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0]?.toString();
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

// ============================================================
// STEP 1 — REQUEST A RESET LINK
// ============================================================
const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
});

export async function requestPasswordResetAction(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = requestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const { email } = parsed.data;

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  // Same answer whether or not the account exists, so this form can't be
  // used to find out who has an account.
  if (!user) return { success: true };

  const token = randomBytes(32).toString("hex");
  const identifier = identifierFor(email);

  await db.$transaction([
    // Only the newest link works
    db.verificationToken.deleteMany({ where: { identifier } }),
    db.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const sent = await sendPasswordResetEmail({
    to: email,
    name: user.name?.split(/\s+/)[0] ?? "there",
    resetUrl,
  });

  // Without an email service (e.g. on your own PC), print the link to the
  // terminal so the flow can still be tested. Never in production.
  if (!sent.success && process.env.NODE_ENV !== "production") {
    console.log(`[password-reset] Email not sent. Reset link for ${email}:\n${resetUrl}`);
  }

  return { success: true };
}

// ============================================================
// STEP 2 — SET A NEW PASSWORD
// ============================================================
const resetSchema = z
  .object({
    token: z.string().min(1, "This reset link is invalid."),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFrom(parsed.error.issues);
    if (fieldErrors.token) return { error: fieldErrors.token };
    return { fieldErrors };
  }

  const record = await db.verificationToken.findUnique({
    where: { token: hashToken(parsed.data.token) },
  });

  const expiredMessage =
    "This reset link has expired or was already used. Please request a new one.";

  if (!record || !record.identifier.startsWith("password-reset:")) {
    return { error: expiredMessage };
  }
  if (record.expires < new Date()) {
    await db.verificationToken.deleteMany({ where: { identifier: record.identifier } });
    return { error: expiredMessage };
  }

  const email = record.identifier.slice("password-reset:".length);
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await db.$transaction([
      db.user.update({ where: { email }, data: { passwordHash } }),
      // One-time use: the link dies once the password is changed
      db.verificationToken.deleteMany({ where: { identifier: record.identifier } }),
    ]);
  } catch {
    return { error: expiredMessage };
  }

  redirect("/login?reset=1");
}
