import { ContentPage } from "@/components/layout/content-page";
import { whatsappLink } from "@/lib/site";

export const metadata = {
  title: "Guides",
  description: "How DeltaWay works with local guides in Bangladesh.",
  robots: { index: false },
};

// Guide applications are invite-only for now (GUIDE_APPLICATIONS_OPEN in
// src/lib/applications.ts). This page explains that to anyone with an old link.
export default function BecomeAGuidePage() {
  return (
    <ContentPage
      eyebrow="Guides"
      title="Our guide team is invite-only for now."
      intro="We're building DeltaWay's guide team ourselves, one region at a time, so every traveler gets a guide we know personally. Public applications will open later."
      sections={[
        {
          heading: "Got an invite?",
          paragraphs: ["Open the invite link we sent you on WhatsApp or email. It takes you straight to the application form."],
        },
        {
          heading: "Want to be considered?",
          paragraphs: ["If you're an experienced guide and would like us to keep you in mind, send us a message. We'll get in touch when we're looking for guides in your area."],
        },
      ]}
      cta={{
        label: "Message us on WhatsApp",
        href: whatsappLink("Hi DeltaWay, I'm a tour guide and would like to work with you."),
        note: "আমাদের হোয়াটসঅ্যাপে বাংলায়ও মেসেজ দিতে পারেন।",
      }}
    />
  );
}
