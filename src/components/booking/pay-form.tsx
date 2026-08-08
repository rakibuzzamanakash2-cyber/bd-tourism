"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { initiatePaymentAction } from "@/lib/actions/payment";

type Props = {
  bookingId: string;
  amount: number;
};

export function PayForm({ bookingId, amount }: Props) {
  const [pending, setPending] = useState(false);

  async function handlePay() {
    setPending(true);
    const result = await initiatePaymentAction(bookingId);

    if (result.success) {
      // Redirect to SSLCommerz hosted checkout
      window.location.href = result.gatewayUrl;
    } else {
      toast.error(result.error);
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={pending}
      className={cn(
        buttonVariants({ size: "lg" }),
        "w-full rounded-full bg-forest-900 text-paper hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <CreditCard className="mr-2 size-4" />
      {pending ? "Redirecting to gateway…" : `Pay $${amount.toFixed(2)}`}
    </button>
  );
}
