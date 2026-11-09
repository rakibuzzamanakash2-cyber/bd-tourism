"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inputClass } from "@/components/admin/form";
import { adminCreateHomestay, adminEmailHomestayWaitlist, adminMarkHostPaid } from "@/lib/actions/admin/homestays";
import { bdt } from "@/lib/guide-shared";
import { cn } from "@/lib/utils";

const btn = "rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50";

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error ?? "Something went wrong");
      if (r.message) toast.success(r.message);
      after?.();
      router.refresh();
    });
  return { pending, run };
}

export function MarkHostPaidForm({ bookingId, amountBDT }: { bookingId: string; amountBDT: number }) {
  const { pending, run } = useRun();
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  if (!open) {
    return (
      <button type="button" className={cn(btn, "border border-forest-900/20 hover:bg-forest-100")} onClick={() => setOpen(true)}>
        Mark {bdt(amountBDT)} paid to host…
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <input className={inputClass} placeholder="bKash / bank reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={200} aria-label="Host payout reference" />
      <div className="flex gap-2">
        <button type="button" disabled={pending} className={cn(btn, "bg-forest-900 text-paper hover:bg-forest-800")} onClick={() => run(() => adminMarkHostPaid({ bookingId, reference }), () => setOpen(false))}>
          Confirm host payment sent
        </button>
        <button type="button" className={cn(btn, "border border-forest-900/20")} onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

export function EmailWaitlistButton({ count }: { count: number }) {
  const { pending, run } = useRun();
  return (
    <button
      type="button"
      disabled={pending || count === 0}
      className={cn(btn, "bg-forest-900 text-paper hover:bg-forest-800")}
      onClick={() => window.confirm(`Email ${count} people that homestays are open? Each person only ever gets this once.`) && run(() => adminEmailHomestayWaitlist())}
    >
      {pending ? "Sending…" : `Email the waitlist (${count})`}
    </button>
  );
}

export function CreateHomestayButton({ userId }: { userId: string }) {
  const { pending, run } = useRun();
  return (
    <button type="button" disabled={pending} className={cn(btn, "border border-forest-900/20 hover:bg-forest-100")} onClick={() => run(() => adminCreateHomestay(userId))}>
      Create listing
    </button>
  );
}
