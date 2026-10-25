"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  requestPasswordResetAction,
  resetPasswordAction,
  type PasswordResetState,
} from "@/lib/actions/password-reset";

const submitClass = cn(
  buttonVariants({ size: "lg" }),
  "w-full rounded-full bg-forest-900 text-paper hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50",
);

function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-clay-600/30 bg-clay-500/10 px-4 py-3 text-sm text-clay-700"
    >
      {message}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-clay-600">{message}</p>;
}

// ============================================================
// "Forgot password?" — ask for the email
// ============================================================
export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<PasswordResetState, FormData>(
    requestPasswordResetAction,
    null,
  );

  if (state?.success) {
    return (
      <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-6">
        <p className="font-medium text-ink">Check your inbox.</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          If an account exists for that email, we&rsquo;ve sent a link to reset
          your password. It expires in 1 hour. Don&rsquo;t forget to check your
          spam folder.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-forest-800 underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <ErrorBox message={state?.error} />
      <div>
        <Label htmlFor="email" className="text-sm">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="mt-1.5"
        />
        <FieldError message={state?.fieldErrors?.email} />
      </div>
      <button type="submit" disabled={isPending} className={submitClass}>
        {isPending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

// ============================================================
// Reset link landing — choose a new password
// ============================================================
export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState<PasswordResetState, FormData>(
    resetPasswordAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="space-y-2">
          <ErrorBox message={state.error} />
          <Link
            href="/forgot-password"
            className="inline-block text-sm font-medium text-forest-800 underline underline-offset-4"
          >
            Request a new link
          </Link>
        </div>
      )}
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password" className="text-sm">
          New password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="mt-1.5"
        />
        <FieldError message={state?.fieldErrors?.password} />
      </div>
      <div>
        <Label htmlFor="confirmPassword" className="text-sm">
          Confirm new password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Type it again"
          className="mt-1.5"
        />
        <FieldError message={state?.fieldErrors?.confirmPassword} />
      </div>
      <button type="submit" disabled={isPending} className={submitClass}>
        {isPending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
