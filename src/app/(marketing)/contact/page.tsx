import { auth } from "@/auth";
import { ContactForm } from "@/components/contact/contact-form";
import { site, whatsappLink } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: "Questions about permits, custom trips, or specific destinations — we usually reply within 24 hours.",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ContactPage({ searchParams }: Props) {
  const [{ subject }, session] = await Promise.all([searchParams, auth()]);

  return (
    <>
      <section className="border-b border-forest-900/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow mb-4 text-forest-700">Contact</p>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">
            Say hello.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Questions about permits, custom trips, or specific destinations — we usually reply within 24 hours.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <aside className="lg:col-span-2">
            <p className="eyebrow mb-4 text-forest-700">By other means</p>
            <dl className="space-y-6 text-sm">
              <div>
                <dt className="text-ink-mute">Email</dt>
                <dd className="mt-1.5 font-medium text-ink">
                  <a href={`mailto:${site.email}`} className="underline underline-offset-4 hover:text-forest-800">
                    {site.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-ink-mute">WhatsApp</dt>
                <dd className="mt-1.5 font-medium text-ink">
                  <a
                    href={whatsappLink("Hi DeltaWay, I have a question about a trip.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-forest-800"
                  >
                    {site.whatsappDisplay}
                  </a>
                  <span className="mt-1 block text-xs font-normal text-ink-mute">
                    Fastest way to reach us
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-ink-mute">Based in</dt>
                <dd className="mt-1.5 leading-relaxed text-ink">{site.city}</dd>
              </div>
              <div>
                <dt className="text-ink-mute">Response time</dt>
                <dd className="mt-1.5 font-medium text-ink">{site.replyTime}</dd>
              </div>
            </dl>
          </aside>

          <div className="lg:col-span-3">
            <p className="eyebrow mb-4 text-forest-700">Send a message</p>
            <ContactForm
              defaultName={session?.user?.name ?? ""}
              defaultEmail={session?.user?.email ?? ""}
              defaultSubject={typeof subject === "string" ? subject.slice(0, 150) : ""}
            />
          </div>
        </div>
      </section>
    </>
  );
}