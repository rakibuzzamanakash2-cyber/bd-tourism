import { ContentPage } from "@/components/layout/content-page";

export const metadata = {
  title: "Terms",
  description: "The terms that apply when you book a tour through DeltaWay.",
};

// NOTE: plain-language starter terms. Have a lawyer review before taking real payments.
export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Terms"
      title="Booking terms, in plain language."
      intro="These terms apply when you create an account or book a tour with us. We've kept them short and readable — if anything is unclear, ask us before you book."
      updated="25 October 2026"
      sections={[
        {
          heading: "Your account",
          paragraphs: [
            "You need an account to book. Keep your login details private — you're responsible for bookings made from your account. You must be at least 18 to book.",
          ],
        },
        {
          heading: "Bookings and payment",
          paragraphs: [
            "A booking is confirmed once your payment succeeds. Prices are shown in US dollars and charged through SSLCommerz, a licensed Bangladeshi payment gateway. We never see or store your card details.",
            "Tours must start at least 21 days after the booking date, so there is time to arrange guides, lodging and any permits.",
          ],
        },
        {
          heading: "Restricted areas and permits",
          paragraphs: [
            "Tours that visit the Chittagong Hill Tracts or the Sundarbans need government permits for foreign visitors. We apply on your behalf, which is why we ask for passport details for every traveler. Our permit processing fee is charged with your booking; government permit fees are billed separately once the permit is approved.",
            "If a permit is refused, we refund our processing fee and work with you to rearrange the trip around unrestricted regions.",
          ],
        },
        {
          heading: "Cancellations and refunds",
          bullets: [
            "More than 14 days before the start date: full refund.",
            "Within 14 days of the start date: 50% refund.",
            "Within 48 hours of the start date: no refund.",
            "Permit fees are non-refundable once the application has been submitted.",
          ],
        },
        {
          heading: "Changes on our side",
          paragraphs: [
            "Weather, road conditions or official restrictions sometimes force changes. If we have to change a core part of your trip, we'll offer a comparable alternative or a full refund for the affected part — your choice.",
          ],
        },
        {
          heading: "Your safety and conduct",
          paragraphs: [
            "Please follow your guide's instructions, respect local communities and customs, and carry your passport in restricted areas. We may end a tour without refund if a traveler puts others at risk.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            "Questions about these terms: hello@bangladeshtourism.co. These terms are governed by the laws of Bangladesh.",
          ],
        },
      ]}
    />
  );
}
