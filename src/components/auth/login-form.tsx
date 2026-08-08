"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loginAction, type AuthState } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    loginAction,
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
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password" className="text-sm">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-ink-mute underline underline-offset-4 hover:text-forest-800"
          >
            Forgot?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Your password"
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
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
