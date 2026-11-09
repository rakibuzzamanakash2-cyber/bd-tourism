import { ContentPage } from "@/components/layout/content-page";
import { site } from "@/lib/site";

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
      updated="9 November 2026"
      sections={[
        {
          heading: "What we collect",
          bullets: [
            "Account details: your name, email address and password (stored only as a secure hash), or your Google profile if you sign in with Google.",
            "Trip details: dates, number of travelers, phone number and any special requests.",
            "Permit details for restricted-area tours and homestays: passport number and nationality for every traveler.",
            "Optional profile details: emergency contact and dietary preferences.",
            "Payment records: amount, status and transaction ID. Card details are handled entirely by SSLCommerz — we never receive them.",
          ],
        },
        {
          heading: "How we use it",
          bullets: [
            "To create and manage your bookings.",
            "To apply for permits with the relevant district and Forest Department offices.",
            "To share what's needed with your guide and host so they can look after you: your name, phone number and notes, once the trip is paid. Guides and hosts never see passport details.",
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
          heading: "How we protect it",
          bullets: [
            "Passport numbers are encrypted before they're stored (AES-256). Everywhere on the site they're shown masked, like •••• 4567.",
            "Only the DeltaWay team can see a full passport number, only to apply for a permit, and every time someone looks it is logged.",
            "Passwords are stored only as a secure hash. All pages are served over an encrypted connection.",
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
            "Passport numbers are deleted automatically 90 days after your trip ends; we keep only the last four digits.",
            "We keep booking and payment records for as long as the law requires for accounting. When you delete your account, your name, email, phone, passport details, saved trips and messages are removed, and your bookings stay in our records without them.",
          ],
        },
        {
          heading: "Your choices",
          paragraphs: [
            "You can view and edit your profile from your dashboard. In Profile → Your data you can download everything we hold about you, or delete your account yourself.",
            `Questions about your data? Email ${site.email}.`,
          ],
        },
      ]}
    />
  );
}
