import { ContentPage } from "@/components/layout/content-page";

export const metadata = {
  title: "Become a guide",
  description: "Guide international travelers around Bangladesh with DeltaWay.",
};

export default function BecomeAGuidePage() {
  return (
    <ContentPage
      eyebrow="Become a guide"
      title="Show the world your Bangladesh."
      intro="We're building a network of local guides who know their region inside out. Apply online: we review every application within 3 working days."
      sections={[
        {
          heading: "Who we're looking for",
          bullets: [
            "You know a region well — its routes, its food, its people.",
            "You speak English comfortably (other languages are a big plus).",
            "You enjoy looking after people and solving problems on the go.",
            "Government guide certification is required for restricted areas.",
          ],
        },
        {
          heading: "What you get",
          bullets: [
            "Bookings from international travelers, with payment handled for you.",
            "Your own profile with reviews, languages and regions.",
            "We take care of permits and paperwork.",
          ],
        },
      ]}
      cta={{
        label: "Apply now",
        href: "/apply/guide",
        note: "About 10 minutes, in English or Bangla. You can save and finish later. · বাংলায়ও আবেদন করা যায়।",
      }}
    />
  );
}
