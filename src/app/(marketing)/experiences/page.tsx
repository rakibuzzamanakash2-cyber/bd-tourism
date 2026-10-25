import Link from "next/link";
import { HomestayWaitlistForm } from "@/components/experiences/waitlist-form";

export const metadata = {
  title: "Homestays",
  description:
    "Live Like a Local — homestays with verified Bangladeshi families. Coming soon.",
};

export default function ExperiencesPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Live like a local</p>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">
            Homestays are{" "}
            <em className="italic text-forest-700">coming soon.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            We&rsquo;re onboarding host families across the country right now.
            If you&rsquo;d like to be told when the first are ready to book,
            leave your email.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-4 text-forest-700">The idea</p>
            <div className="space-y-6 text-lg leading-relaxed text-ink-soft">
              <p>
                Every homestay on the platform will be a verified Bangladeshi
                home &mdash; a family who has volunteered to host visitors,
                been checked, and been briefed on what to offer.
              </p>
              <p>
                You&rsquo;ll stay in their spare room, eat what they cook, hear
                what they listen to at night. Some hosts are in Dhaka, some are
                in Cox&rsquo;s Bazar, some are in tea garden villages in
                Sylhet.
              </p>
              <p>
                Bookings will range from a single night to a full week. Prices
                are set fairly &mdash; enough to make hosting worthwhile, low
                enough to make cultural travel accessible.
              </p>
            </div>
          </div>

          <div className="lg:pt-14">
            <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-8 sm:p-10">
              <h3 className="font-display text-2xl leading-tight">
                Tell us when it&rsquo;s live.
              </h3>
              <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                We&rsquo;ll email you once &mdash; when the first homestays are
                open for booking. No newsletters.
              </p>
              <HomestayWaitlistForm />
            </div>

            <div className="mt-12">
              <p className="eyebrow mb-3 text-forest-700">Want to host?</p>
              <p className="leading-relaxed text-ink-soft">
                If you&rsquo;re a Bangladeshi family interested in hosting
                foreign tourists, we&rsquo;d love to hear from you. Get in
                touch via{" "}
                <Link
                  href="/contact"
                  className="underline underline-offset-4 hover:text-forest-800"
                >
                  the contact page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
