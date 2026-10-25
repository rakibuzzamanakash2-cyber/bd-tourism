import { ContentPage } from "@/components/layout/content-page";

export const metadata = {
  title: "Privacy Policy",
  description: "What personal data DeltaWay collects, why, and how it is protected.",
};

// NOTE: plain-language starter policy. Have a lawyer review before launch.
export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Privacy"
      title="What we collect, and why."
      intro="We only ask for what we need to run your trip — and for restricted areas, what the government needs to issue your permit."
      updated="25 October 2026"
      sections={[
        {
          heading: "What we collect",
          bullets: [
            "Account details: your name, email address and password (stored only as a secure hash), or your Google profile if you sign in with Google.",
            "Trip details: dates, number of travelers, phone number and any special requests.",
            "Permit details for restricted-area tours: passport number and nationality for every traveler.",
            "Optional profile details: emergency contact and dietary preferences.",
            "Payment records: amount, status and transaction ID. Card details are handled entirely by SSLCommerz — we never receive them.",
          ],
        },
        {
          heading: "How we use it",
          bullets: [
            "To create and manage your bookings.",
            "To apply for permits with the relevant district and Forest Department offices.",
            "To share what's needed with your guide and host so they can look after you.",
            "To send booking receipts and important trip updates by email.",
          ],
          paragraphs: [
            "We don't sell your data, and we don't use it for advertising.",
          ],
        },
        {
          heading: "Who we share it with",
          bullets: [
            "SSLCommerz, to process payments.",
            "Resend, to deliver our emails.",
            "Google, only if you choose to sign in with Google.",
            "Government offices, only the details required for your permit.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "We use a single sign-in cookie to keep you logged in. We don't use advertising or tracking cookies.",
          ],
        },
        {
          heading: "How long we keep it",
          paragraphs: [
            "We keep booking and payment records for as long as the law requires for accounting. You can ask us to delete your account and personal details at any time; we'll remove everything we're not legally required to keep.",
          ],
        },
        {
          heading: "Your choices",
          paragraphs: [
            "You can view and edit your profile from your dashboard. For a copy of your data, or to delete your account, email hello@bangladeshtourism.co.",
          ],
        },
      ]}
    />
  );
}
