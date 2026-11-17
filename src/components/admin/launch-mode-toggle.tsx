"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setLaunchModeAction } from "@/lib/actions/admin/launch";
import type { LaunchMode } from "@/lib/launch-mode";

/**
 * Switching this on is the moment the site starts charging cards, so it
 * asks once before doing it. Switching back off is harmless and immediate.
 */
export function LaunchModeToggle({ mode }: { mode: LaunchMode }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const set = (next: LaunchMode) =>
    start(async () => {
      const r = await setLaunchModeAction(next);
      setConfirming(false);
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.message ?? "Saved");
      router.refresh();
    });

  if (mode === "payments") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => set("requests")}
          className="rounded-full border border-forest-900/20 px-4 py-1.5 text-sm hover:bg-forest-100 disabled:opacity-50"
        >
          Stop taking card payments
        </button>
        <span className="text-xs text-ink-mute">Trips go back to being requests you quote by hand.</span>
      </div>
    );
  }

  return confirming ? (
    <div className="mt-3 rounded-md border border-clay-700/30 bg-clay-700/5 p-4">
      <p className="text-sm">
        This starts charging real cards the moment it is on. Only do it once your live SSLCommerz store works and
        you have tested a payment end to end.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => set("payments")}
          className="rounded-full bg-forest-900 px-4 py-1.5 text-sm text-paper hover:bg-forest-800 disabled:opacity-50"
        >
          Yes, turn payments on
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-sm underline underline-offset-4">
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(true)}
        className="rounded-full border border-forest-900/20 px-4 py-1.5 text-sm hover:bg-forest-100 disabled:opacity-50"
      >
        Turn on card payments
      </button>
      <span className="text-xs text-ink-mute">Needs the live SSLCommerz store, which needs your trade licence.</span>
    </div>
  );
}
