"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminCancelBooking,
  adminChangeBookingStatus,
  adminMarkBookingPaid,
  adminMarkRefundPaid,
  adminSaveBookingNotes,
  type AdminActionResult,
} from "@/lib/actions/admin/bookings";
import { cn } from "@/lib/utils";

/** Runs an admin action with a toast and refreshes the page on success. */
function useAction() {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<AdminActionResult>, onDone?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(r.message ?? "Done");
      onDone?.();
      router.refresh();
    });
  return { pending, run };
}

const btn = "rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50";
const primary = cn(btn, "bg-forest-900 text-paper hover:bg-forest-800");
const secondary = cn(btn, "border border-forest-900/20 hover:bg-forest-100");
const danger = cn(btn, "bg-clay-600 text-paper hover:bg-clay-700");
const input = "w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm";

const STATUS_ACTION_LABEL: Record<string, string> = {
  CONFIRMED: "Confirm booking",
  IN_PROGRESS: "Mark trip started",
  COMPLETED: "Mark completed",
  DISPUTED: "Flag as disputed",
};

export function StatusButtons({ bookingId, allowed }: { bookingId: string; allowed: readonly string[] }) {
  const { pending, run } = useAction();
  const [notify, setNotify] = useState(true);
  if (allowed.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allowed.map((to) => (
          <button
            key={to}
            type="button"
            disabled={pending}
            className={to === "DISPUTED" ? secondary : primary}
            onClick={() => {
              if (!window.confirm(`${STATUS_ACTION_LABEL[to]}?`)) return;
              run(() =>
                adminChangeBookingStatus({
                  bookingId,
                  to: to as "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "DISPUTED",
                  notifyTraveler: notify,
                }),
              );
            }}
          >
            {STATUS_ACTION_LABEL[to] ?? to}
          </button>
        ))}
      </div>
      {allowed.includes("CONFIRMED") && (
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Email the traveler when confirming
        </label>
      )}
    </div>
  );
}

export function MarkPaidForm({ bookingId }: { bookingId: string }) {
  const { pending, run } = useAction();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"bkash" | "nagad" | "bank" | "cash" | "other">("bkash");
  const [reference, setReference] = useState("");
  if (!open)
    return (
      <button type="button" className={secondary} onClick={() => setOpen(true)}>
        Record payment received outside the site
      </button>
    );
  return (
    <div className="space-y-3 rounded-lg border border-forest-900/10 p-4">
      <p className="text-sm text-ink-soft">For bKash, Nagad, bank transfer or cash payments.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-ink-mute">
          Method
          <select className={cn(input, "mt-1")} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="bank">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-xs text-ink-mute">
          Transaction ID / reference
          <input className={cn(input, "mt-1")} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={200} />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          className={primary}
          onClick={() => run(() => adminMarkBookingPaid({ bookingId, method, reference }), () => setOpen(false))}
        >
          Mark as paid
        </button>
        <button type="button" className={secondary} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AdminCancelForm({
  bookingId,
  paid,
  paidAmount,
  suggestedRefund,
}: {
  bookingId: string;
  paid: boolean;
  paidAmount: number;
  suggestedRefund: number;
}) {
  const { pending, run } = useAction();
  const [open, setOpen] = useState(false);
  const [refund, setRefund] = useState(suggestedRefund.toFixed(2));
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  if (!open)
    return (
      <button type="button" className="text-sm text-clay-700 underline underline-offset-4" onClick={() => setOpen(true)}>
        Cancel this booking…
      </button>
    );
  return (
    <div className="space-y-3 rounded-lg border border-clay-600/30 bg-clay-500/5 p-4">
      <p className="text-sm font-medium">Cancel booking</p>
      {paid && (
        <label className="block text-xs text-ink-mute">
          Refund to owe (USD) — policy suggests ${suggestedRefund.toFixed(2)}, paid ${paidAmount.toFixed(2)}
          <input
            type="number"
            min={0}
            max={paidAmount}
            step="0.01"
            className={cn(input, "mt-1")}
            value={refund}
            onChange={(e) => setRefund(e.target.value)}
          />
        </label>
      )}
      <label className="block text-xs text-ink-mute">
        Reason (shown to the traveler)
        <textarea className={cn(input, "mt-1")} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </label>
      <label className="flex items-center gap-2 text-xs text-ink-soft">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        Email the traveler
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          className={danger}
          onClick={() =>
            run(
              () =>
                adminCancelBooking({
                  bookingId,
                  refundUSD: paid ? Number(refund) || 0 : 0,
                  reason,
                  notifyTraveler: notify,
                }),
              () => setOpen(false),
            )
          }
        >
          Cancel booking
        </button>
        <button type="button" className={secondary} onClick={() => setOpen(false)}>
          Keep it
        </button>
      </div>
    </div>
  );
}

export function RefundPaidForm({ bookingId, amount }: { bookingId: string; amount: string }) {
  const { pending, run } = useAction();
  const [method, setMethod] = useState<"sslcommerz" | "bkash" | "nagad" | "bank" | "cash" | "other">("sslcommerz");
  const [reference, setReference] = useState("");
  return (
    <div className="space-y-3 rounded-lg border border-clay-600/30 bg-clay-500/10 p-4">
      <p className="text-sm font-medium">Refund owed: {amount}</p>
      <p className="text-xs text-ink-soft">Send the refund first, then record it here. The traveler gets an email.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-ink-mute">
          Sent via
          <select className={cn(input, "mt-1")} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="sslcommerz">SSLCommerz refund</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="bank">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-xs text-ink-mute">
          Reference
          <input className={cn(input, "mt-1")} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={200} />
        </label>
      </div>
      <button
        type="button"
        disabled={pending}
        className={primary}
        onClick={() => {
          if (!window.confirm(`Record that ${amount} has been refunded?`)) return;
          run(() => adminMarkRefundPaid({ bookingId, method, reference }));
        }}
      >
        Mark refund as sent
      </button>
    </div>
  );
}

export function NotesForm({ bookingId, initial }: { bookingId: string; initial: string }) {
  const { pending, run } = useAction();
  const [notes, setNotes] = useState(initial);
  return (
    <div className="space-y-2">
      <textarea
        className={input}
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={5000}
        placeholder="Only the DeltaWay team sees these notes."
        aria-label="Team notes"
      />
      <button
        type="button"
        disabled={pending || notes === initial}
        className={secondary}
        onClick={() => run(() => adminSaveBookingNotes({ bookingId, notes }))}
      >
        Save notes
      </button>
    </div>
  );
}
