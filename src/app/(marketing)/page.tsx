import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";

import { buttonVariants } from "@/components/ui/button";
import { cn, countWord } from "@/lib/utils";

import { DestinationCard } from "@/components/destinations/destination-card";
import { PackageCard } from "@/components/packages/package-card";
import { getSavedState } from "@/lib/saved";

// ============================================================
// HERO
// ============================================================
function Hero() {
  return (
    <section className="relative h-[min(92vh,820px)] w-full overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1602800458591-eddda28a498b?w=2400&q=85"
        alt="Sundarbans mangrove waterway at first light"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-950/30 via-forest-950/45 to-forest-950/85" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="max-w-4xl">
          <p className="mb-6 font-bengali text-lg text-paper/85">
            বাংলাদেশ
          </p>

          <h1 className="font-display text-5xl leading-[0.95] text-paper sm:text-7xl md:text-[5.5rem]">
            The delta country,
            <br />
            <em className="italic text-forest-200">guided.</em>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper/85">
            Royal Bengal tigers, tea garden mornings, and 120 kilometers of
            empty beach — with the permits, verified guides, and village
            homestays already arranged.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/destinations"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full bg-paper px-6 text-forest-950 hover:bg-paper-warm"
              )}
            >
              Browse destinations
            </Link>

            <Link
              href="/permits"
              className={cn(
                buttonVariants({ size: "lg", variant: "ghost" }),
                "rounded-full border border-paper/40 px-6 text-paper hover:bg-paper/10 hover:text-paper"
              )}
            >
              How permits work
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// QUICK FACTS
// ============================================================
function Facts() {
  const facts = [
    { n: "64", label: "districts" },
    { n: "700+", label: "rivers" },
    { n: "6", label: "seasons, not four" },
    { n: "120", label: "km of open beach" },
  ];

  return (
    <section className="border-b border-forest-900/10 bg-paper-warm py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="text-center md:text-left">
              <span className="font-display text-3xl text-forest-900">
                {f.n}
              </span>
              <span className="ml-2 text-sm text-ink-mute">
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FEATURED DESTINATIONS
// ============================================================
async function FeaturedDestinations() {
  const [destinations, savedState] = await Promise.all([
    db.destination.findMany({
      where: { isFeatured: true, isPublished: true },
      include: { region: true },
      take: 6,
      orderBy: { createdAt: "asc" },
    }),
    getSavedState(),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow mb-3 text-forest-700">A short list</p>
          <h2 className="max-w-2xl font-display text-4xl sm:text-5xl md:text-6xl">
            {countWord(destinations.length)}{" "}
            {destinations.length === 1 ? "place" : "places"} to start with.
          </h2>
        </div>
        <Link
          href="/destinations"
          className="shrink-0 text-sm underline underline-offset-4 hover:text-forest-800"
        >
          See all destinations →
        </Link>
      </div>

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {destinations.map((d, i) => (
          <DestinationCard
            key={d.id}
            destination={d}
            priority={i < 3}
            saved={savedState.destinationIds.has(d.id)}
            signedIn={savedState.signedIn}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================
// WHY US
// ============================================================
function WhyUs() {
  const items = [
    {
      kind: "Bureaucracy, solved",
      title: "Permits, handled.",
      body: "Sundarbans, Bandarban, Rangamati, and Khagrachari require official permits and authorized guides. We handle the paperwork so you don't lose two days of your trip to a DC office.",
    },
    {
      kind: "Verified locally",
      title: "Guides you can vouch for.",
      body: "Every guide passes an identity check, a track-record review, and a language verification. You see their reviews and languages spoken before you book.",
    },
    {
      kind: "Homes, not hotels",
      title: "Live like a local, briefly.",
      body: "Stay a night or a week with a Bangladeshi host family—verified homes, real meals, and someone who can teach you how to eat properly with your right hand.",
    },
  ];

  return (
    <section className="bg-forest-950 text-paper">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <p className="eyebrow mb-4 text-forest-300">
          Three things we do differently
        </p>

        <h2 className="max-w-3xl font-display text-4xl sm:text-5xl md:text-6xl">
          The parts of a Bangladesh trip that usually stall people.
        </h2>

        <div className="mt-20 grid gap-14 md:grid-cols-3 md:gap-10">
          {items.map((item) => (
            <div key={item.title}>
              <p className="eyebrow text-forest-300">
                {item.kind}
              </p>

              <h3 className="mt-3 font-display text-3xl leading-tight">
                {item.title}
              </h3>

              <p className="mt-4 leading-relaxed text-forest-100/85">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FEATURED PACKAGES
// ============================================================
async function FeaturedPackages() {
  const [packages, savedState] = await Promise.all([
    db.tourPackage.findMany({
      where: { isPublished: true },
      take: 3,
      orderBy: { durationDays: "asc" },
    }),
    getSavedState(),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow mb-3 text-forest-700">Set itineraries</p>
          <h2 className="max-w-2xl font-display text-4xl sm:text-5xl md:text-6xl">
            One day, three days,
            <br />
            <em className="italic text-forest-700">or a real expedition.</em>
          </h2>
        </div>
        <Link
          href="/packages"
          className="shrink-0 text-sm underline underline-offset-4 hover:text-forest-800"
        >
          See all tours →
        </Link>
      </div>

      <div className="grid gap-10 md:grid-cols-3">
        {packages.map((p, i) => (
          <PackageCard
            key={p.id}
            package={p}
            priority={i < 3}
            saved={savedState.packageIds.has(p.id)}
            signedIn={savedState.signedIn}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================
// HOMEPAGE
// ============================================================
export default function HomePage() {
  return (
    <>
      <Hero />
      <Facts />
      <FeaturedDestinations />
      <WhyUs />
      <FeaturedPackages />
    </>
  );
}