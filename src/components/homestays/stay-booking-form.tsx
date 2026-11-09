"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inputClass } from "@/components/admin/form";
import { createStayBookingAction } from "@/lib/actions/stay-booking";
import { bdt } from "@/lib/guide-shared";
import { calculateServiceFee } from "@/lib/booking-utils";
import { MAX_STAY_NIGHTS, nightsBetween, stayQuote } from "@/lib/homestay-shared";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  hostRate: number;
  maxGuests: number;
  restrictedRegion: string | null;
  /** Nights (check-in dates) already closed or booked */
  takenNights: string[];
  minCheckIn: string;
  maxCheckIn: string;
  signedIn: boolean;
  defaults: { name: string; email: string; phone: string; nationality: string; checkIn?: string; checkOut?: string; guests?: number };
};

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export function StayBookingForm(p: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [checkIn, setCheckIn] = useState(p.defaults.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(p.defaults.checkOut ?? "");
  const [guests, setGuests] = useState(String(Math.min(p.defaults.guests ?? 2, p.maxGuests)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const taken = useMemo(() => new Set(p.takenNights), [p.takenNights]);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const clash = useMemo(() => {
    if (nights < 1) return null;
    for (let i = 0; i < Math.min(nights, MAX_STAY_NIGHTS + 1); i++) {
      const day = addDays(checkIn, i);
      if (taken.has(day)) return day;
    }
    return null;
  }, [checkIn, nights, taken]);
  const base = nights > 0 && nights <= MAX_STAY_NIGHTS ? stayQuote(p.hostRate, nights) : null;
  const permitFee = p.restrictedRegion ? calculateServiceFee(Number(guests)) : 0;
  const quote = base ? { ...base, totalUSD: Math.round((base.totalUSD + permitFee) * 100) / 100 } : null;

  // The next few open stretches, to help people pick dates
  const nextFree = useMemo(() => {
    const out: string[] = [];
    let day = p.minCheckIn;
    for (let i = 0; i < 120 && out.length < 3; i++, day = addDays(day, 1)) {
      if (!taken.has(day) && !taken.has(addDays(day, 1)) && (out.length === 0 || nightsBetween(out[out.length - 1], day) > 6)) out.push(day);
    }
    return out;
  }, [p.minCheckIn, taken]);

  const backHere = `/homestays/${p.slug}${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}` : ""}`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await createStayBookingAction({
        slug: p.slug,
        checkIn,
        checkOut,
        guests: Number(guests),
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        passportNumber: String(fd.get("passportNumber") ?? ""),
        nationality: String(fd.get("nationality") ?? ""),
        notes: String(fd.get("notes") ?? ""),
        agreedToTerms: fd.get("terms") === "on",
      } as Parameters<typeof createStayBookingAction>[0]);
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        return void toast.error(r.error);
      }
      router.push(`/dashboard/bookings/${r.bookingId}/pay`);
    });
  }

  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-clay-700">{errors[k]}</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-ink-mute">
          Check-in
          <input type="date" required min={p.minCheckIn} max={p.maxCheckIn} className={`${inputClass} mt-1`} value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (!checkOut || checkOut <= e.target.value) setCheckOut(addDays(e.target.value, 2));
            }} />
          {err("checkIn")}
        </label>
        <label className="text-xs text-ink-mute">
          Check-out
          <input type="date" required min={checkIn ? addDays(checkIn, 1) : addDays(p.minCheckIn, 1)} max={checkIn ? addDays(checkIn, MAX_STAY_NIGHTS) : undefined} className={`${inputClass} mt-1`} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          {err("checkOut")}
        </label>
      </div>
      <label className="block text-xs text-ink-mute">
        Guests
        <select className={`${inputClass} mt-1`} value={guests} onChange={(e) => setGuests(e.target.value)}>
          {Array.from({ length: p.maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
          ))}
        </select>
        {err("guests")}
      </label>

      {clash ? (
        <p role="alert" className="rounded-md bg-clay-500/10 px-3 py-2 text-sm text-clay-700">
          The night of {clash} isn&rsquo;t available. Try other dates.
        </p>
      ) : quote ? (
        <div className="space-y-1 rounded-md bg-paper-warm px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span>{bdt(quote.nightlyBDT)} × {nights} {nights === 1 ? "night" : "nights"}</span>
            <span>{bdt(quote.totalBDT)}</span>
          </div>
          {permitFee > 0 && (
            <div className="flex justify-between text-ink-soft">
              <span>Permit processing</span>
              <span>${permitFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>${quote.totalUSD.toFixed(2)}{!permitFee && <span className="font-normal text-ink-mute"> ({bdt(quote.totalBDT)})</span>}</span>
          </div>
          <p className="text-xs text-ink-mute">Home-cooked meals and the family&rsquo;s welcome included. Paid securely after you book.</p>
        </div>
      ) : nextFree.length > 0 && !checkIn ? (
        <p className="text-xs text-ink-mute">
          Next open dates:{" "}
          {nextFree.map((d, i) => (
            <button key={d} type="button" className="underline underline-offset-4" onClick={() => { setCheckIn(d); setCheckOut(addDays(d, 2)); }}>
              {d}{i < nextFree.length - 1 ? ", " : ""}
            </button>
          ))}
        </p>
      ) : null}

      {!p.signedIn ? (
        <Link href={`/login?callbackUrl=${encodeURIComponent(backHere)}`} className="block rounded-full bg-forest-900 px-6 py-3 text-center text-sm font-medium text-paper hover:bg-forest-800">
          Sign in to book
        </Link>
      ) : (
        <>
          <fieldset className="space-y-3 border-t border-forest-900/10 pt-4">
            <legend className="sr-only">Your details</legend>
            <label className="block text-xs text-ink-mute">
              Lead guest&rsquo;s name
              <input name="name" required className={`${inputClass} mt-1`} defaultValue={p.defaults.name} autoComplete="name" />
              {err("name")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-ink-mute">
                Email
                <input name="email" type="email" required className={`${inputClass} mt-1`} defaultValue={p.defaults.email} autoComplete="email" />
                {err("email")}
              </label>
              <label className="text-xs text-ink-mute">
                Phone / WhatsApp
                <input name="phone" type="tel" required className={`${inputClass} mt-1`} defaultValue={p.defaults.phone} autoComplete="tel" />
                {err("phone")}
              </label>
            </div>
            {p.restrictedRegion && (
              <div className="space-y-3 rounded-md border border-clay-600/30 p-3">
                <p className="text-xs text-clay-700">{p.restrictedRegion} needs a government permit. We apply for it for you with these details.</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-ink-mute">
                    Passport number
                    <input name="passportNumber" required className={`${inputClass} mt-1`} />
                    {err("passportNumber")}
                  </label>
                  <label className="text-xs text-ink-mute">
                    Nationality
                    <input name="nationality" required className={`${inputClass} mt-1`} defaultValue={p.defaults.nationality} />
                    {err("nationality")}
                  </label>
                </div>
              </div>
            )}
            <label className="block text-xs text-ink-mute">
              Anything the family should know? (optional)
              <textarea name="notes" rows={3} maxLength={2000} className={`${inputClass} mt-1`} placeholder="Arrival time, food you don't eat, travelling with children…" />
            </label>
            <label className="flex items-start gap-2 text-xs text-ink-soft">
              <input type="checkbox" name="terms" className="mt-0.5" required />
              <span>
                I agree to the <Link href="/terms" className="underline underline-offset-4" target="_blank">terms</Link> and the cancellation policy (full refund more than 14 days before check-in, 50% up to 48 hours before).
              </span>
            </label>
            {err("agreedToTerms")}
          </fieldset>
          <button type="submit" disabled={pending || !quote || Boolean(clash)} className={cn("w-full rounded-full bg-forest-900 px-6 py-3 text-sm font-medium text-paper hover:bg-forest-800 disabled:opacity-50")}>
            {pending ? "Booking…" : quote ? `Book and pay $${quote.totalUSD.toFixed(2)}` : "Choose your dates"}
          </button>
        </>
      )}
    </form>
  );
}
