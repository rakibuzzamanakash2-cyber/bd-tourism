import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "About",
  description:
    "Bangladesh gets a fraction of the tourists its landscape would suggest. We're the platform trying to change that.",
};

const principles = [
  {
    title: "Bureaucracy, off your plate.",
    body: "We hold ongoing relationships with the DC offices in Bandarban, Rangamati, and Khagrachari, and with the Forest Department for Sundarbans. Permits are our problem, not yours — we submit the applications, we track them, we tell you the outcome.",
  },
  {
    title: "Guides you'd recommend to a friend.",
    body: "Every guide on the platform is identity-verified, has demonstrated their local knowledge, and has been rated by tourists they've hosted. You see the reviews, the languages they speak, and the regions they know before you book.",
  },
  {
    title: "Stay with people, not just in places.",
    body: "Our Live Like a Local homestays put you in the home of a Bangladeshi family — verified, briefed, insured. You eat what they cook, sleep where they sleep, and learn what it actually feels like to be from here.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">About</p>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">
            A country of 165 million,
            <br />
            and about{" "}
            <em className="italic text-forest-700">
              400,000 foreign visitors a year.
            </em>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Bangladesh gets a fraction of the tourists its landscape and
            hospitality would suggest. Not because people don&rsquo;t want to
            come &mdash; because the logistics stop them.
          </p>
        </div>
      </section>

      {/* Narrative */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="max-w-3xl">
          <p className="eyebrow mb-4 text-forest-700">The problem</p>
          <h2 className="font-display text-4xl sm:text-5xl">
            The reasons people don&rsquo;t visit Bangladesh are almost never
            about Bangladesh.
          </h2>
          <div className="mt-10 space-y-6 text-lg leading-relaxed text-ink-soft">
            <p>
              They&rsquo;re about paperwork. The Sundarbans need a Forest
              Department permit. The Chittagong Hill Tracts &mdash; Bandarban,
              Rangamati, Khagrachari &mdash; need permission from the District
              Commissioner. Getting either as a foreigner from outside the
              country is roughly two weeks of emails to unresponsive offices,
              if you can even find the right one.
            </p>
            <p>
              They&rsquo;re about trust. The Google search for &ldquo;Bangladesh
              tour guide&rdquo; returns 200 results and no way to tell which of
              them will actually show up when you land at Shahjalal Airport at
              midnight.
            </p>
            <p>
              And they&rsquo;re about connection. Most tourism keeps you at
              arm&rsquo;s length from the country you flew across the world to
              see. Hotels are the same everywhere. Bus tours give you 40 minutes
              at each stop and a script. The best of Bangladesh &mdash; the tea
              being poured in someone&rsquo;s kitchen, the neighbourhood mosque
              at fajr, the way a rickshaw driver hums when you cross the bridge
              &mdash; isn&rsquo;t on the itinerary.
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-forest-950 text-paper">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <p className="eyebrow mb-4 text-forest-300">What we do</p>
          <h2 className="max-w-3xl font-display text-4xl sm:text-5xl md:text-6xl">
            Three problems, three solutions.
          </h2>
          <div className="mt-16 space-y-14">
            {principles.map((p) => (
              <div key={p.title} className="max-w-3xl">
                <h3 className="font-display text-3xl leading-tight sm:text-4xl">
                  {p.title}
                </h3>
                <p className="mt-4 leading-relaxed text-forest-100/85">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team + CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-4 text-forest-700">The team</p>
            <h2 className="font-display text-4xl sm:text-5xl">
              Small, Bangladeshi, obsessed with the details.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              We&rsquo;re a team based in Dhaka, working with vetted guides
              and host families across the country. Team page coming soon.
            </p>
          </div>
          <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-8 sm:p-10">
            <p className="eyebrow mb-4 text-forest-700">Get started</p>
            <h3 className="font-display text-3xl leading-tight">
              Ready to plan a trip?
            </h3>
            <p className="mt-4 text-ink-soft leading-relaxed">
              Browse destinations, pick a tour, or write to us with a rough
              idea &mdash; we&rsquo;ll take it from there.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/destinations"
                className={cn(
                  buttonVariants(),
                  "rounded-full bg-forest-900 text-paper hover:bg-forest-800",
                )}
              >
                See destinations
              </Link>
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "rounded-full border border-forest-900/20 hover:bg-forest-100",
                )}
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
