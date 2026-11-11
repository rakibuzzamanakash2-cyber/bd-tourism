"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { TripRequestForm } from "@/components/booking/trip-request-form";

type Props = {
  title: string;
  context: { districtId?: string; placeId?: string; destinationId?: string };
  defaults?: { name?: string; email?: string };
};

/** The custom trip form on the /plan page, with a thank-you once it's sent. */
export function PlanRequest(props: Props) {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <div className="rounded-lg bg-forest-100 p-6">
        <CheckCircle2 className="size-7 text-forest-800" aria-hidden />
        <p className="mt-3 font-display text-2xl">Request sent</p>
        <p className="mt-2 text-sm text-ink-soft">
          Thanks! We&rsquo;ve emailed you a copy and will send a suggested plan and price for {props.title} within 24 hours.
        </p>
      </div>
    );
  }
  return <TripRequestForm {...props} onDone={() => setDone(true)} />;
}
