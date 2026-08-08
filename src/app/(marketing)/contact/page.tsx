import { ContactForm } from "@/components/contact/contact-form";

export const metadata = {
  title: "Contact",
  description: "Questions about permits, custom trips, or specific destinations — we usually reply within 24 hours.",
};

export default function ContactPage() {
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
                <dd className="mt-1.5 font-medium text-ink">hello@bangladeshtourism.co</dd>
              </div>
              <div>
                <dt className="text-ink-mute">WhatsApp</dt>
                <dd className="mt-1.5 font-medium text-ink">+880 1XXX-XXXXXX</dd>
              </div>
              <div>
                <dt className="text-ink-mute">Office</dt>
                <dd className="mt-1.5 leading-relaxed text-ink">
                  Dhanmondi<br />Dhaka 1209<br />Bangladesh
                </dd>
              </div>
              <div>
                <dt className="text-ink-mute">Response time</dt>
                <dd className="mt-1.5 font-medium text-ink">Within 24 hours, usually faster</dd>
              </div>
            </dl>
          </aside>

          <div className="lg:col-span-3">
            <p className="eyebrow mb-4 text-forest-700">Send a message</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}