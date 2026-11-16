// Public business details, defined once and used across pages and emails.
// Change them here and every page updates.

export const site = {
  name: "DeltaWay",
  tagline: "Bangladesh, guided.",
  email: "rakibuzzaman.akash2@gmail.com",
  // E.164 digits, no "+" — used to build wa.me links
  whatsappNumber: "8801986338391",
  whatsappDisplay: "+880 1986-338391",
  city: "Dhaka, Bangladesh",
  replyTime: "Within 24 hours, usually faster",
} as const;

/**
 * The people behind DeltaWay, shown on /about.
 *
 * PLACEHOLDER BIO — rewrite it in your own words. A named human with a face
 * is the single thing a visitor looks for before sending money abroad, so
 * this is worth getting right. Add `photo` once you have a picture: either a
 * Cloudinary URL or a file in /public.
 */
export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  photo?: string;
};

export const team: TeamMember[] = [
  {
    name: "Md Rakibuzzaman",
    role: "Founder",
    bio: "Grew up in Dhaka and spent years travelling the country on local buses and launches, mostly to places no tour company had heard of. Started DeltaWay because visitors kept arriving with no honest way to find a guide they could trust.",
  },
];

/** WhatsApp click-to-chat link, optionally with a pre-filled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
