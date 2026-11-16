import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/content-page";
import { cancellationPolicy, guideChecks, permitRefundNote, promises } from "@/lib/policy";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How a DeltaWay trip gets planned, how we check our guides, what you pay and when, and what happens if your plans change.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <ContentPage
      eyebrow="How it works"
      title="What you're agreeing to, before you agree to it."
      intro="Booking a trip in a country you've never been to means trusting a company you found on the internet. Here is how we work, what we check, and what happens if something changes — in one place, so you don't have to dig it out of the terms."
      sections={[
        {
          heading: "Planning a trip",
          paragraphs: [
            "Pick a tour and book it, or send us a rough idea — the districts you want, roughly when, and how many of you there are.",
            "We plan the route, stays, transport and guide for your dates, then send you the plan and the full price. You decide after you have seen both.",
          ],
        },
        {
          heading: "What we promise",
          bullets: promises.map((p) => `${p.title} — ${p.body}`),
        },
        {
          heading: "How we check our guides",
          paragraphs: [
            "Our guides are self-employed Bangladeshis, not our staff. That is the point — they are from the places they take you to. It also means the checking matters.",
          ],
          bullets: guideChecks,
        },
        {
          heading: "Paying",
          paragraphs: [
            "Tours with a fixed price are paid online when you book. Custom trips are quoted first and paid once you accept, and a quote is held for seven days.",
            "Your card details go straight to the payment provider and never touch our servers. Passport and visa numbers are encrypted, shown to our own team masked, and deleted 90 days after your trip ends.",
          ],
        },
        {
          heading: "If your plans change",
          bullets: cancellationPolicy.map((r) => `${r.when}: ${r.refund.toLowerCase()}.`),
          paragraphs: [permitRefundNote],
        },
        {
          heading: "If our plans change",
          paragraphs: [
            "Weather, strikes and cancelled ferries are part of travelling here. If we have to change your route we tell you as soon as we know and offer an alternative of the same standard.",
            "If we cancel a trip outright, you get everything back, including any permit fee we have not already spent.",
          ],
        },
        {
          heading: "Still have a question?",
          paragraphs: [
            `Write to ${site.email} or message us on WhatsApp at ${site.whatsappDisplay}. ${site.replyTime}.`,
          ],
        },
      ]}
      cta={{
        label: "See destinations",
        href: "/destinations",
        note: "Or tell us the rough shape of the trip you want, and we'll come back with a plan.",
      }}
    />
  );
}
