import { ContentPage } from "@/components/layout/content-page";

export const metadata = {
  title: "Help center",
  description: "Answers to common questions about booking, payment and permits.",
};

export default function HelpPage() {
  return (
    <ContentPage
      eyebrow="Help center"
      title="Answers before you ask."
      intro="The questions travelers ask us most. Can't find yours? We reply to every message within 24 hours."
      sections={[
        {
          heading: "How far ahead do I need to book?",
          paragraphs: [
            "At least 21 days before your start date. That gives us time to confirm your guide and lodging and, for restricted areas, to get your permit approved (usually 5–7 working days).",
          ],
        },
        {
          heading: "How do I pay?",
          paragraphs: [
            "After you confirm a booking, open it from your dashboard and choose Pay now. You'll be taken to SSLCommerz's secure payment page, where you can pay by card or mobile banking. Your booking is confirmed as soon as the payment goes through.",
          ],
        },
        {
          heading: "Why do you need my passport number?",
          paragraphs: [
            "Only for tours that visit the Chittagong Hill Tracts or the Sundarbans. Foreign visitors need a government permit for these areas, and the application requires each traveler's passport details. We apply for you.",
          ],
        },
        {
          heading: "Can I cancel?",
          paragraphs: [
            "Yes. Cancel more than 14 days before your start date for a full refund, within 14 days for 50%, and within 48 hours there's no refund. Permit fees can't be refunded once submitted. Full details are in our terms.",
          ],
        },
        {
          heading: "I didn't get my receipt email.",
          paragraphs: [
            "Check your spam folder first. Your booking and payment status are always visible under Bookings in your dashboard, even if the email is delayed.",
          ],
        },
        {
          heading: "I forgot my password.",
          paragraphs: [
            "Use the Forgot? link on the sign-in page. We'll email you a link to choose a new password; it works once and expires after an hour.",
          ],
        },
      ]}
      cta={{
        label: "Contact us",
        href: "/contact",
        note: "Still stuck? Tell us what's going on and we'll sort it out.",
      }}
    />
  );
}
