"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { createTripRequestAction } from "@/lib/actions/trip-request";

type Props = {
  title: string;
  context: { districtId?: string; placeId?: string; destinationId?: string };
  defaults?: { name?: string; email?: string };
  onDone: () => void;
  /** Shows a Back button when given */
  onBack?: () => void;
};

const inputClass =
  "w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm outline-none focus:border-forest-700 focus:ring-2 focus:ring-forest-700/15";

/** "Plan a custom trip here": used in the Book popup and on the /plan page. */
export function TripRequestForm({ title, context, defaults, onDone, onBack }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string | null) ?? "";
    start(async () => {
      const r = await createTripRequestAction({
        name: get("name"),
        email: get("email"),
        phone: get("phone"),
        country: get("country"),
        travelers: get("travelers"),
        startDate: get("startDate"),
        days: get("days"),
        message: get("message"),
        website: get("website"),
        ...context,
      });
      if (!r.ok) {
        setError({ field: r.field, message: r.error });
        return void toast.error(r.error);
      }
      onDone();
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const fieldError = (f: string) => error?.field === f && <p className="mt-1 text-xs text-clay-700">{error.message}</p>;

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-ink-mute">
          Your name
          <input name="name" required defaultValue={defaults?.name} autoComplete="name" className={`${inputClass} mt-1`} />
          {fieldError("name")}
        </label>
        <label className="text-xs text-ink-mute">
          Email
          <input name="email" type="email" required defaultValue={defaults?.email} autoComplete="email" className={`${inputClass} mt-1`} />
          {fieldError("email")}
        </label>
        <label className="text-xs text-ink-mute">
          WhatsApp or phone <span className="text-ink-mute/70">(optional)</span>
          <input name="phone" type="tel" autoComplete="tel" className={`${inputClass} mt-1`} />
        </label>
        <label className="text-xs text-ink-mute">
          Country <span className="text-ink-mute/70">(optional)</span>
          <input name="country" autoComplete="country-name" className={`${inputClass} mt-1`} />
        </label>
        <label className="text-xs text-ink-mute">
          Arriving around
          <input name="startDate" type="date" min={today} className={`${inputClass} mt-1`} />
          {fieldError("startDate")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-ink-mute">
            Days
            <input name="days" type="number" min={1} max={60} placeholder="3" className={`${inputClass} mt-1`} />
          </label>
          <label className="text-xs text-ink-mute">
            People
            <input name="travelers" type="number" min={1} max={30} defaultValue={2} required className={`${inputClass} mt-1`} />
            {fieldError("travelers")}
          </label>
        </div>
      </div>
      <label className="block text-xs text-ink-mute">
        Anything we should know?
        <textarea
          name="message"
          rows={3}
          required
          defaultValue={`I'd like to visit ${title}.`}
          className={`${inputClass} mt-1`}
        />
        {fieldError("message")}
      </label>
      <div className="flex items-center justify-between gap-3 pt-1">
        {onBack ? (
          <button type="button" onClick={onBack} className="text-sm underline underline-offset-4">
            Back
          </button>
        ) : (
          <span />
        )}
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-2.5 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-50">
          <Send className="size-4" aria-hidden /> {pending ? "Sending…" : "Send my request"}
        </button>
      </div>
      <p className="text-xs text-ink-mute">No payment now. You only pay once you&rsquo;re happy with the plan.</p>
    </form>
  );
}
