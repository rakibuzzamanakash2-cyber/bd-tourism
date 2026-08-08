import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Restricted areas & permits",
  description:
    "The Sundarbans, Bandarban, Rangamati, and Khagrachari require permits for foreign visitors. We handle the process for you.",
};

const restrictedAreas = [
  {
    name: "Sundarbans",
    department: "Forest Department",
    why: "The world's largest mangrove forest and a UNESCO site. Every visit requires a permit and an authorised guide — the terrain is genuinely dangerous: tigers, crocodiles, and tidal channels that can strand a boat.",
  },
  {
    name: "Bandarban",
    department: "District Commissioner's office",
    why: "The highest peaks in Bangladesh and the largest indigenous communities. Access is restricted to protect both — permits let the local administration know who's in the hills.",
  },
  {
    name: "Rangamati & Sajek",
    department: "District Commissioner's office",
    why: "The lake district of Bangladesh — including Sajek Valley, one of the most photographed places in the country. Same restrictions as Bandarban, same process.",
  },
  {
    name: "Khagrachari",
    department: "District Commissioner's office",
    why: "Remote, culturally rich, and home to smaller Marma and Tripura communities. Less-visited than the other CHT districts, and permits are usually processed faster.",
  },
];

const fees = [
  {
    label: "Government permit fee",
    amount: "BDT 3,000",
    detail:
      "Per person, paid to the DC office or Forest Department. Set by them, not us.",
  },
  {
    label: "Certified guide",
    amount: "BDT 1,500 / day",
    detail: "Required by regulation. You're paying the guide directly, not us.",
  },
  {
    label: "Our processing fee",
    amount: "$10 first person, $7.99 each additional",
    detail:
      "For preparing, submitting, and tracking your application until the permit is in your hand.",
  },
];

const faqs = [
  {
    q: "How far in advance should I book?",
    a: "Aim for 3 weeks minimum. Permits usually come back in 5–7 working days, but we've seen occasional delays around Bangladeshi public holidays. Booking earlier is always safer.",
  },
  {
    q: "Can I visit these places without a permit?",
    a: "No. The rules are enforced at checkpoints, and being caught without a permit typically means being turned back at the district border. The Sundarbans additionally requires an authorised guide by law.",
  },
  {
    q: "What happens if my permit application is denied?",
    a: "Applications are almost never denied for foreign tourists on standard itineraries. If yours is, we refund our processing fee and rework the trip with you around unrestricted regions.",
  },
  {
    q: "Do children need permits?",
    a: "Yes — anyone whose passport isn't Bangladeshi needs one, regardless of age. The permit fee is sometimes waived or reduced for minors, and we'll flag that at booking.",
  },
];

export default function PermitsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[min(68vh,620px)] w-full overflow-hidden bg-forest-950">
        <Image
          src="https://images.unsplash.com/photo-1602800458591-eddda28a498b?w=2400&q=85"
          alt=""
          fill
          priority
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/40 via-forest-950/55 to-forest-950/85" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-300">Restricted areas</p>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.95] text-paper sm:text-7xl md:text-[5.5rem]">
            Permits,{" "}
            <em className="italic text-forest-200">handled.</em>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/85">
            Four of Bangladesh&rsquo;s most beautiful regions require official
            permits for foreign visitors. We hold the paperwork, so you get
            the trip.
          </p>
        </div>
      </section>

      {/* Restricted areas list */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          <div className="lg:col-span-1">
            <p className="eyebrow mb-4 text-forest-700">Which areas</p>
            <h2 className="font-display text-4xl sm:text-5xl">
              Four regions, one process.
            </h2>
          </div>
          <div className="space-y-10 lg:col-span-2">
            {restrictedAreas.map((area) => (
              <div
                key={area.name}
                className="border-l-2 border-forest-700/40 pl-6"
              >
                <h3 className="font-display text-3xl leading-tight">
                  {area.name}
                </h3>
                <p className="eyebrow mt-2 text-ink-mute">
                  {area.department}
                </p>
                <p className="mt-4 leading-relaxed text-ink-soft">
                  {area.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIY vs Us comparison */}
      <section className="bg-forest-950 text-paper">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <p className="eyebrow mb-4 text-forest-300">How it works</p>
          <h2 className="max-w-3xl font-display text-4xl sm:text-5xl md:text-6xl">
            Two ways to get a permit.
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            <div>
              <p className="eyebrow mb-6 text-forest-300/70">
                Doing it yourself
              </p>
              <ul className="space-y-4 text-forest-100/80">
                <li className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-clay-500" />
                  <span>
                    Find the right District Commissioner or Forest Department
                    office.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-clay-500" />
                  <span>
                    Submit a written application in Bangla or English, often in
                    person.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-clay-500" />
                  <span>
                    Provide passport copy, visa copy, planned itinerary, and
                    details of an approved local guide.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-clay-500" />
                  <span>Wait 5&ndash;14 days. Follow up if needed.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-clay-500" />
                  <span>
                    Pay the permit fee and collect the paper permit in person.
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-forest-700/40 bg-forest-900 p-8">
              <p className="eyebrow mb-6 text-forest-300">With us</p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-forest-300" />
                  <span>You book a tour in a restricted region.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-forest-300" />
                  <span>
                    You upload a passport photo. We handle the application
                    from Dhaka.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-forest-300" />
                  <span>
                    Your permit and guide are ready when you land.
                  </span>
                </li>
              </ul>
              <p className="mt-8 border-t border-forest-700/40 pt-4 text-sm leading-relaxed text-forest-300">
                Typical turnaround: 5&ndash;7 working days. We start the moment
                your trip is booked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fees */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <p className="eyebrow mb-4 text-forest-700">Fees, itemised</p>
        <h2 className="max-w-3xl font-display text-4xl sm:text-5xl">
          Nothing you didn&rsquo;t already know about.
        </h2>
        <div className="mt-12 max-w-3xl rounded-lg border border-forest-900/10 bg-paper-warm p-6 sm:p-10">
          <dl className="divide-y divide-forest-900/10">
            {fees.map((f) => (
              <div key={f.label} className="grid gap-2 py-6 sm:grid-cols-3">
                <dt className="font-medium">{f.label}</dt>
                <dd className="sm:col-span-2">
                  <span className="font-display text-2xl text-forest-900">
                    {f.amount}
                  </span>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {f.detail}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Frequently asked</p>
          <h2 className="mb-12 font-display text-4xl sm:text-5xl">
            Questions.
          </h2>
          <div className="space-y-2">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group border-b border-forest-900/10 py-6"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-6 list-none">
                  <h3 className="font-display text-2xl">{f.q}</h3>
                  <span className="mt-2 text-2xl text-forest-700 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest-950 text-paper">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl sm:text-5xl">
            Ready to visit somewhere restricted?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-paper/85">
            Browse tours that go to the Sundarbans, Bandarban, Rangamati, and
            Khagrachari &mdash; permits included.
          </p>
          <Link
            href="/packages"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-10 rounded-full bg-paper px-8 text-forest-950 hover:bg-paper-warm",
            )}
          >
            Browse tours
          </Link>
        </div>
      </section>
    </>
  );
}
