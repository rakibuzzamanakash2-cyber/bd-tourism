import Link from "next/link";
import { ratingsBy } from "@/lib/reviews";
import type { Prisma } from "@prisma/client";
import { HomestayCard } from "@/components/homestays/homestay-card";
import { HomestaysComingSoon } from "@/components/homestays/coming-soon";
import { FACILITY_OPTIONS } from "@/lib/applications";
import { db } from "@/lib/db";
import { nightsBetween, MAX_STAY_NIGHTS } from "@/lib/homestay-shared";
import { homestayTakenNights, publicHomestayWhere } from "@/lib/homestays";
import { applyText } from "@/lib/i18n/apply";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Homestays",
  description: "Stay with a verified Bangladeshi family: home-cooked meals, a real welcome, and a local's view of the country. Every home is visited by our team.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const FACILITY = applyText.en.facility;
const ymd = /^\d{4}-\d{2}-\d{2}$/;

export default async function HomestaysPage({ searchParams }: Props) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const region = one("region");
  const facility = (FACILITY_OPTIONS as readonly string[]).includes(one("facility") ?? "") ? one("facility") : undefined;
  const guests = Math.min(Math.max(Number(one("guests")) || 0, 0), 30);
  const checkIn = ymd.test(one("checkIn") ?? "") ? one("checkIn") : undefined;
  const checkOut = ymd.test(one("checkOut") ?? "") ? one("checkOut") : undefined;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const datesValid = nights >= 1 && nights <= MAX_STAY_NIGHTS;

  const total = await db.homestay.count({ where: publicHomestayWhere });
  if (total === 0) return <HomestaysComingSoon />;

  const where: Prisma.HomestayWhereInput = {
    ...publicHomestayWhere,
    ...(region && { region: { slug: region } }),
    ...(facility && { facilities: { has: facility } }),
    ...(guests > 0 && { maxGuests: { gte: guests } }),
  };
  const [found, regions] = await Promise.all([
    db.homestay.findMany({ where, include: { region: { select: { name: true } } }, orderBy: { createdAt: "asc" }, take: 60 }),
    db.region.findMany({ where: { homestays: { some: publicHomestayWhere } }, orderBy: { name: "asc" } }),
  ]);
  // With dates: only homes free for every night
  const homestays = datesValid
    ? (
        await Promise.all(
          found.map(async (h) => {
            const t = await homestayTakenNights(h.id, new Date(`${checkIn}T00:00:00Z`), new Date(`${checkOut}T00:00:00Z`));
            return t.blocked.length || t.booked.length ? null : h;
          }),
        )
      ).filter((h): h is (typeof found)[number] => h !== null)
    : found;

  const ratings = await ratingsBy("homestayId", homestays.map((h) => h.id));
  const keep = (overrides: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const all = { region, facility, guests: guests ? String(guests) : undefined, checkIn, checkOut, ...overrides };
    for (const [k, v] of Object.entries(all)) if (v) q.set(k, v);
    return q.size ? `/homestays?${q}` : "/homestays";
  };
  const cardQuery = datesValid ? `?checkIn=${checkIn}&checkOut=${checkOut}${guests ? `&guests=${guests}` : ""}` : "";

  return (
    <>
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Live like a local</p>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">Stay with a family.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Home-cooked meals, a seat at the family table and someone to show you the village. Every home has been visited in
            person by our team, and every host has had their ID checked.
          </p>
          <form action="/homestays" className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-4">
            {region && <input type="hidden" name="region" value={region} />}
            {facility && <input type="hidden" name="facility" value={facility} />}
            <label className="text-xs text-ink-mute">Check-in<input type="date" name="checkIn" defaultValue={checkIn} className="mt-1 w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm text-ink" /></label>
            <label className="text-xs text-ink-mute">Check-out<input type="date" name="checkOut" defaultValue={checkOut} className="mt-1 w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm text-ink" /></label>
            <label className="text-xs text-ink-mute">Guests<input type="number" name="guests" min={1} max={30} defaultValue={guests || ""} placeholder="2" className="mt-1 w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm text-ink" /></label>
            <button type="submit" className="self-end rounded-full bg-forest-900 px-6 py-2.5 text-sm font-medium text-paper hover:bg-forest-800">Search</button>
          </form>
          {checkIn && checkOut && !datesValid && <p className="mt-3 text-sm text-clay-700">Check-out must be after check-in, and stays are up to {MAX_STAY_NIGHTS} nights.</p>}
        </div>
      </section>

      <section className="sticky top-16 z-30 border-b border-forest-900/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {regions.length > 1 && (
            <Row label="Region">
              <Pill href={keep({ region: undefined })} active={!region}>Anywhere</Pill>
              {regions.map((r) => <Pill key={r.id} href={keep({ region: r.slug })} active={region === r.slug}>{r.name}</Pill>)}
            </Row>
          )}
          <Row label="Has">
            <Pill href={keep({ facility: undefined })} active={!facility}>Anything</Pill>
            {["attached_bathroom", "western_toilet", "hot_water", "wifi", "air_conditioning", "english_speaker"].map((f) => (
              <Pill key={f} href={keep({ facility: f })} active={facility === f}>{FACILITY[f]}</Pill>
            ))}
          </Row>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {datesValid && <p className="mb-8 text-sm text-ink-soft">{homestays.length} {homestays.length === 1 ? "home" : "homes"} free for {nights} {nights === 1 ? "night" : "nights"} from {checkIn}.</p>}
        {homestays.length === 0 ? (
          <div className="rounded-lg border border-forest-900/10 bg-paper-warm px-8 py-20 text-center">
            <p className="font-display text-4xl">No homes match that.</p>
            <p className="mt-4 text-ink-soft"><Link href="/homestays" className="underline underline-offset-4">Clear the filters</Link> or try other dates.</p>
          </div>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {homestays.map((h) => <HomestayCard key={h.id} h={h} query={cardQuery} rating={ratings.get(h.id)} />)}
          </div>
        )}
      </section>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-forest-900/5 py-3 last:border-b-0">
      <span className="eyebrow shrink-0 text-ink-mute">{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors", active ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 bg-paper text-ink-soft hover:border-forest-900/40 hover:text-ink")}>
      {children}
    </Link>
  );
}
