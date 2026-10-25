import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardOverviewPage() {
  const user = await requireUser();
  const firstName = user.name?.split(/\s+/)[0] ?? "there";

  const bookingCount = await db.booking.count({
    where: { touristId: user.id },
  });

  const completedCount = await db.booking.count({
    where: { touristId: user.id, status: "COMPLETED" },
  });

  const savedCount = 0; // wire up when SavedDestination model exists

  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">Overview</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
        Welcome back,{" "}
        <em className="italic text-forest-700">{firstName}.</em>
      </h1>

      {/* Stats */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active bookings"
          value={bookingCount - completedCount}
          href="/dashboard/bookings"
        />
        <StatCard
          label="Trips taken"
          value={completedCount}
          href="/dashboard/bookings?status=completed"
        />
        <StatCard
          label="Saved places"
          value={savedCount}
          href="/dashboard/saved"
        />
      </div>

      {/* Next actions */}
      <div className="mt-16">
        <p className="eyebrow mb-4 text-forest-700">Ready when you are</p>
        <h2 className="font-display text-3xl sm:text-4xl">Start planning.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <ActionCard
            title="Browse destinations"
            body="Ten places, one country. Start with the featured spots — mangroves, tea gardens, historical ruins."
            href="/destinations"
            cta="See destinations"
          />
          <ActionCard
            title="Pick a set itinerary"
            body="One-day walks through week-long expeditions. Every tour includes a verified guide."
            href="/packages"
            cta="See tours"
          />
          <ActionCard
            title="Restricted areas"
            body="Visiting Sundarbans, Bandarban, Rangamati, or Khagrachari? We handle the permits."
            href="/permits"
            cta="How permits work"
          />
          <ActionCard
            title="Update your profile"
            body="Add nationality, phone, and emergency contact — required for permit applications."
            href="/dashboard/profile"
            cta="Edit profile"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-forest-900/10 bg-paper-warm p-6 transition-colors hover:border-forest-900/25"
    >
      <p className="eyebrow text-ink-mute">{label}</p>
      <p className="mt-2 font-display text-4xl text-forest-900">{value}</p>
    </Link>
  );
}

function ActionCard({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-forest-900/10 bg-paper p-6">
      <h3 className="font-display text-2xl leading-tight">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
        {body}
      </p>
      <Link
        href={href}
        className="mt-4 self-start text-sm text-forest-800 underline underline-offset-4 hover:text-forest-700"
      >
        {cta} →
      </Link>
    </div>
  );
}
