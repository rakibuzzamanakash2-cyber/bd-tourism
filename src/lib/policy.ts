// The promises we make to travellers, written once and shown everywhere they
// matter: the terms page, "how it works", and the last step of a booking.
//
// EDIT THESE and every page updates. Keep the wording plain — these are read
// by people deciding whether to send money to a company they just found.

export type CancellationRule = { when: string; refund: string };

/** Starting point — adjust once you've settled terms with hotels and guides. */
export const cancellationPolicy: CancellationRule[] = [
  { when: "More than 14 days before the start date", refund: "Full refund" },
  { when: "Within 14 days of the start date", refund: "50% refund" },
  { when: "Within 48 hours of the start date", refund: "No refund" },
];

export const permitRefundNote =
  "Permit fees for restricted areas can't be refunded once the application has gone in, because the government doesn't return them.";

/** What we commit to. Shown on /how-it-works. */
export const promises: { title: string; body: string }[] = [
  {
    title: "A person answers, not a form",
    body: "Send a request and a real person reads it and writes back. No automated quote, no call centre.",
  },
  {
    title: "You see the price before you pay anything",
    body: "We plan the route, stays, transport and guide for your dates, then send the plan and the full price. Nothing is charged until you accept it.",
  },
  {
    title: "The price is the price",
    body: "Everything we quote is included. No arrival surcharge, no tipping expectation built into the total, no fee that appears at the end.",
  },
  {
    title: "Permits are our job",
    body: "Several of the best parts of the country need government permission to enter. We apply on your behalf so you are always travelling legally.",
  },
];

/** How a guide gets onto the site. Keep this honest as the process changes. */
export const guideChecks: string[] = [
  "We meet every guide, in person or on a video call, before they are listed.",
  "We check national ID and, where they have one, a tourism board or training certificate.",
  "We ask for references from people they have guided before, and we call them.",
  "After each trip the traveller rates the guide, and those ratings stay on the profile.",
  "A guide who takes money outside the platform, or who a traveller reports for anything serious, is removed.",
];
