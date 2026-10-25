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
      intro="Live Like a Local homestays let travelers experience Bangladesh the way it's actually lived. Apply online: we review every application, then visit your home."
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
        label: "Apply now",
        href: "/apply/host",
        note: "About 10 minutes, in English or Bangla. You can save and finish later. · বাংলায়ও আবেদন করা যায়।",
      }}
    />
  );
}
