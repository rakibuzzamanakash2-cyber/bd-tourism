"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shown when something on a page fails (e.g. the database is briefly
// unreachable). The visitor never sees technical details; the error is logged.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[85vh] items-center bg-paper">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-bengali text-lg text-forest-700">কিছু একটা ভুল হয়েছে</p>
          <p className="eyebrow mt-4 text-forest-700">Something went wrong</p>
          <h1 className="mt-6 font-display text-5xl leading-[0.98] sm:text-6xl">
            A small detour.
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-ink-soft">
            This page didn&rsquo;t load properly. It&rsquo;s usually temporary, so
            please try again. If it keeps happening, let us know.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full bg-forest-900 px-6 text-paper hover:bg-forest-800",
              )}
            >
              Try again
            </button>
            <Link
              href="/"
              className={cn(
                buttonVariants({ size: "lg", variant: "ghost" }),
                "rounded-full border border-forest-900/20 px-6 hover:bg-forest-100",
              )}
            >
              Back to home
            </Link>
          </div>
          {error.digest && (
            <p className="mt-8 text-xs text-ink-mute">Error reference: {error.digest}</p>
          )}
        </div>
      </div>
    </main>
  );
}
