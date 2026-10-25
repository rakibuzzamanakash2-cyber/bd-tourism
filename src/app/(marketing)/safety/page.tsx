import { ContentPage } from "@/components/layout/content-page";

export const metadata = {
  title: "Traveler safety",
  description: "How we keep travelers safe, and what to know before you go.",
};

export default function SafetyPage() {
  return (
    <ContentPage
      eyebrow="Traveler safety"
      title="Looked after, from arrival to departure."
      intro="Bangladesh is famously welcoming to visitors. Here's what we do to keep your trip safe — and a few things worth knowing before you go."
      sections={[
        {
          heading: "What we do",
          bullets: [
            "Every guide is identity-verified and rated by the travelers they've hosted.",
            "Homestay families are visited and briefed before they host anyone.",
            "We handle permits for restricted areas, so you're always travelling legally.",
            "Your guide has our team's number, and we can reach you through the phone number on your booking.",
          ],
        },
        {
          heading: "Before you go",
          bullets: [
            "Get travel insurance that covers medical care and evacuation.",
            "Check with a travel clinic about vaccinations and malaria advice, especially for the hill tracts.",
            "Add an emergency contact to your profile so we know who to call.",
            "Carry your passport (and a photocopy) in restricted areas — checkpoints will ask for it.",
          ],
        },
        {
          heading: "Local customs",
          bullets: [
            "Dress modestly, covering shoulders and knees — especially at mosques, temples and in rural areas.",
            "Ask before photographing people, particularly in indigenous communities.",
            "Drink bottled or filtered water.",
            "During Ramadan, avoid eating or drinking in public during the day.",
          ],
        },
        {
          heading: "In an emergency",
          paragraphs: [
            "Call 999, Bangladesh's national emergency number for police, fire and ambulance. Then let your guide or our team know so we can help straight away.",
          ],
        },
      ]}
      cta={{ label: "Contact our team", href: "/contact" }}
    />
  );
}
