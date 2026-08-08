"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signupAction, type AuthState } from "@/lib/actions/auth";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signupAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-md border border-clay-600/30 bg-clay-500/10 px-4 py-3 text-sm text-clay-700">
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="name" className="text-sm">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Your name"
          className="mt-1.5"
        />
        {state?.fieldErrors?.name && (
          <p className="mt-1.5 text-xs text-clay-600">
            {state.fieldErrors.name}
          </p>
        )}
      </div>

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
        {state?.fieldErrors?.email && (
          <p className="mt-1.5 text-xs text-clay-600">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password" className="text-sm">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          className="mt-1.5"
        />
        {state?.fieldErrors?.password && (
          <p className="mt-1.5 text-xs text-clay-600">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full rounded-full bg-forest-900 text-paper hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {isPending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
