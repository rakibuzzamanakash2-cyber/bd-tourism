"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PaymentProcessing() {
  const router = useRouter();

  useEffect(() => {
    // Poll every 3 seconds for the booking status update
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-forest-100">
        <Loader2 className="size-8 animate-spin text-forest-700" />
      </div>
      <p className="eyebrow mt-8 text-forest-700">Processing payment</p>
      <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
        Almost there.
      </h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        We&rsquo;re confirming your payment with SSLCommerz. This usually takes
        a few seconds &mdash; the page will refresh automatically.
      </p>
    </div>
  );
}
