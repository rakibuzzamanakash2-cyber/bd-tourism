"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { revealPassportAction, revealVisaAction } from "@/lib/actions/admin/privacy";

/** Masked passport with a "Show" button (the view is logged). Hides again after a minute. */
export function RevealPassport({ travelerId, masked, what = "passport" }: { travelerId: string; masked: string; what?: "passport" | "visa" }) {
  const [shown, setShown] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-mono">{shown ?? masked}</span>
      {!shown && (
        <button
          type="button"
          disabled={pending}
          className="text-xs underline underline-offset-4"
          onClick={() =>
            start(async () => {
              const r = await (what === "visa" ? revealVisaAction(travelerId) : revealPassportAction(travelerId));
              if (!r.ok) return void toast.error(r.error);
              setShown(r.passport);
              setTimeout(() => setShown(null), 60_000);
            })
          }
        >
          {pending ? "…" : "Show"}
        </button>
      )}
    </span>
  );
}
