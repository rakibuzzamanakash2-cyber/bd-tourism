"use client";

import { useActionState } from "react";
import { joinHomestayWaitlistAction, type WaitlistState } from "@/lib/actions/contact";

export function HomestayWaitlistForm() {
  const [state, formAction, isPending] = useActionState<WaitlistState, FormData>(
    joinHomestayWaitlistAction,
    null,
  );

  if (state?.success) {
    return (
      <p role="status" className="mt-6 rounded-lg border border-forest-700/20 bg-forest-100 px-4 py-3 text-sm text-forest-900">
        You&rsquo;re on the list. We&rsquo;ll email you once, when the first homestays open.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-6">
      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="flex-1 rounded-full border border-forest-900/15 bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-mute focus:border-forest-700 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-forest-900 px-6 py-2.5 text-sm text-paper hover:bg-forest-800 disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Notify me"}
        </button>
      </div>
      {state?.error && <p className="mt-2 text-xs text-clay-600">{state.error}</p>}
    </form>
  );
}
