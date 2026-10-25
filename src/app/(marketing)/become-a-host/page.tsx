import { ContentPage } from "@/components/layout/content-page";

export const metadata = {
  title: "Host tourists",
  description: "Welcome travelers into your home through Live Like a Local homestays.",
};

export default function BecomeAHostPage() {
  return (
    <ContentPage
      eyebrow="Host tourists"
      title="Open your home, share your life."
      intro="Live Like a Local homestays let travelers experience Bangladesh the way it's actually lived. Host sign-up opens soon — register your interest and we'll reach out."
      sections={[
        {
          heading: "What hosting involves",
          bullets: [
            "A clean, private room for guests.",
            "Home-cooked meals with your family.",
            "Sharing everyday life — the market, the neighbourhood, your traditions.",
          ],
        },
        {
          heading: "How we support you",
          bullets: [
            "We visit and verify every home, and brief you before your first guests.",
            "Guests book and pay through us; you get paid after each stay.",
            "Our team is a phone call away if anything comes up.",
          ],
        },
      ]}
      cta={{
        label: "Register your interest",
        href: "/contact",
        note: "Tell us where you live and a little about your home, and we'll contact you when host sign-up opens.",
      }}
    />
  );
}
