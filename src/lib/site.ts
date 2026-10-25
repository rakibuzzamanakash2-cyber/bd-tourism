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

/** WhatsApp click-to-chat link, optionally with a pre-filled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
