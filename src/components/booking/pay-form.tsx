"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { initiatePaymentAction } from "@/lib/actions/payment";

type Props = {
  bookingId: string;
  usd: number;
  bdt: number;
};

const OPTIONS = [
  { value: "USD", title: "Pay in US dollars", hint: "Best for cards issued outside Bangladesh (Visa, Mastercard, Amex)." },
  { value: "BDT", title: "Pay in taka", hint: "bKash, Nagad, Rocket, local bank cards and internet banking." },
] as const;

export function PayForm({ bookingId, usd, bdt }: Props) {
  const [pending, setPending] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "BDT">("USD");
  const amountLabel = currency === "USD" ? `$${usd.toFixed(2)}` : `৳${bdt.toLocaleString("en-US")}`;

  async function handlePay() {
    setPending(true);
    const result = await initiatePaymentAction(bookingId, currency);
    if (result.success) {
      // Off to the SSLCommerz hosted checkout
      window.location.href = result.gatewayUrl;
    } else {
      toast.error(result.error);
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-3 text-sm font-medium">How would you like to pay?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className={cn(
                "cursor-pointer rounded-lg border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-700",
                currency === o.value ? "border-forest-900 bg-forest-100" : "border-forest-900/15 hover:border-forest-900/40",
              )}
            >
              <input type="radio" name="currency" value={o.value} checked={currency === o.value} onChange={() => setCurrency(o.value)} className="sr-only" />
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{o.title}</span>
                <span className="font-display text-xl">{o.value === "USD" ? `$${usd.toFixed(2)}` : `৳${bdt.toLocaleString("en-US")}`}</span>
              </span>
              <span className="mt-1 block text-xs text-ink-soft">{o.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        onClick={handlePay}
        disabled={pending}
        className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full bg-forest-900 text-paper hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50")}
      >
        <CreditCard className="mr-2 size-4" />
        {pending ? "Redirecting to the secure payment page…" : `Pay ${amountLabel}`}
      </button>
    </div>
  );
}
