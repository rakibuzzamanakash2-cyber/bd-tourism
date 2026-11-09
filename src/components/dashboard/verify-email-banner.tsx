"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { resendVerificationAction } from "@/lib/actions/verify";

/** "Please confirm your email" (with resend), or a thank-you after clicking the link. */
export function VerifyEmailBanner({ needed, email }: { needed: boolean; email: string }) {
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const flag = params.get("email");

  if (flag === "verified" && !needed) {
    return <p role="status" className="mb-8 rounded-md border border-forest-700/20 bg-forest-100 px-4 py-3 text-sm text-forest-900">Thanks, your email is confirmed.</p>;
  }
  if (!needed) return null;
  return (
    <div role="status" className="mb-8 flex flex-col gap-3 rounded-md border border-clay-600/30 bg-clay-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-clay-700">
        <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {flag === "link-expired" ? "That link has expired or was already used. " : ""}
          Please confirm your email ({email}) before booking. Check your inbox for our link.
          {msg && <span className="block text-ink-soft">{msg}</span>}
        </span>
      </p>
      <button
        type="button"
        disabled={pending}
        className="shrink-0 rounded-full border border-clay-600/40 px-4 py-1.5 text-clay-700 hover:bg-clay-500/10 disabled:opacity-50"
        onClick={() => start(async () => setMsg((await resendVerificationAction()).message))}
      >
        {pending ? "Sending…" : "Send a new link"}
      </button>
    </div>
  );
}
