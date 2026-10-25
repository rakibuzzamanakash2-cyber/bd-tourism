"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelBookingAction } from "@/lib/actions/cancel-booking";
import type { RefundQuote } from "@/lib/booking-utils";

type Props = {
  bookingId: string;
  bookingCode: string;
  totalUSD: number;
  quote: RefundQuote;
};

const money = (n: number) => `$${n.toFixed(2)}`;

export function CancelBookingButton({ bookingId, bookingCode, totalUSD, quote }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      const result = await cancelBookingAction({ bookingId, reason });
      if (!result.success) {
        toast.error("Couldn't cancel", { description: result.error });
        return;
      }
      setOpen(false);
      toast.success("Booking cancelled", {
        description:
          result.refundUSD > 0
            ? `A refund of ${money(result.refundUSD)} will be sent within 7–10 working days.`
            : "We've emailed you a confirmation.",
      });
      router.refresh();
    });
  }

  const summary =
    quote.tier === "unpaid"
      ? "You haven't paid for this booking yet, so nothing will be charged or refunded."
      : quote.tier === "full"
        ? `More than 14 days before your trip: you get a full refund of ${money(quote.refundUSD)}.`
        : quote.tier === "half"
          ? `Within 14 days of your trip: you get a 50% refund of ${money(quote.refundUSD)}.`
          : "Within 48 hours of your trip: no refund is due under the cancellation policy.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="mt-4 text-sm text-clay-700 underline underline-offset-4 hover:text-clay-600">
        Cancel this booking
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel booking {bookingCode}?</DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>

        {quote.tier !== "unpaid" && (
          <dl className="space-y-2 rounded-md border border-forest-900/10 bg-paper-warm p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-mute">You paid</dt>
              <dd>{money(totalUSD)}</dd>
            </div>
            {quote.nonRefundableUSD > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-mute">Permit fee (non-refundable)</dt>
                <dd>−{money(quote.nonRefundableUSD)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-forest-900/10 pt-2 font-medium">
              <dt>Refund</dt>
              <dd>{money(quote.refundUSD)}</dd>
            </div>
          </dl>
        )}

        <div>
          <Label htmlFor="cancel-reason" className="text-sm">
            Reason <span className="text-xs text-ink-mute">(optional, helps us improve)</span>
          </Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
            rows={3}
            className="mt-1.5"
          />
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-forest-900/20 px-5 py-2 text-sm hover:bg-forest-100"
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="rounded-full bg-clay-600 px-5 py-2 text-sm text-paper hover:bg-clay-700 disabled:opacity-60"
          >
            {pending ? "Cancelling…" : "Yes, cancel"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
