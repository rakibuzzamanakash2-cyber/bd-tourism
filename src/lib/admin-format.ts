// Formatting for the admin panel. Timestamps (created, paid…) are shown in
// Dhaka time, where the team works. Trip dates use formatDate (UTC).

export function money(value: number | string | { toString(): string } | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : Number(value.toString());
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function dateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  }).format(d);
}

export function shortDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

/** "5 min ago", "3 h ago", "2 d ago" */
export function timeAgo(d: Date): string {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

/** Reads ?page=N safely; returns { page, skip, take } */
export function pagination(raw: unknown, take = 25) {
  const n = typeof raw === "string" ? parseInt(raw, 10) : 1;
  const page = Number.isFinite(n) && n > 0 ? n : 1;
  return { page, skip: (page - 1) * take, take };
}

/** Plain-English description of an audit log action. */
export function describeAction(action: string): string {
  const map: Record<string, string> = {
    "booking.status": "changed a booking's status",
    "booking.cancel": "cancelled a booking",
    "booking.mark_paid": "recorded a manual payment",
    "booking.refund_paid": "recorded a refund",
    "booking.notes": "updated booking notes",
    "contact.status": "updated a message",
    "user.role": "changed a user's role",
    "permit.update": "updated a permit",
    "application.submit": "submitted the application",
    "application.resubmit": "resubmitted the application",
    "application.status": "moved the application",
    "application.checklist": "updated the checklist",
    "application.invite": "created an invite",
    "application.invite_revoke": "cancelled an invite",
    "application.invite_renew": "renewed an invite",
    "guide.assign": "asked a guide to lead it",
    "guide.unassign": "took the guide off",
    "guide.accept": "accepted the trip as guide",
    "guide.decline": "declined the trip as guide",
    "guide.payout": "recorded a guide payout",
    "guide.update": "edited a guide profile",
    "guide.create": "created a guide profile",
    "guide.profile": "updated their guide profile",
    "content.destination.create": "added a destination",
    "content.destination.update": "edited a destination",
    "content.gallery.add": "added a gallery photo",
    "content.gallery.remove": "removed a gallery photo",
    "content.tour.create": "added a tour",
    "content.tour.update": "edited a tour",
    "content.region.create": "added a region",
    "content.region.update": "edited a region",
    "content.category.create": "added a destination type",
    "content.category.update": "renamed a destination type",
  };
  return map[action] ?? action;
}

/** The moment `days` days before now. */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const METHOD_LABELS: Record<string, string> = {
  sslcommerz: "SSLCommerz",
  bkash: "bKash",
  nagad: "Nagad",
  bank: "Bank transfer",
  cash: "Cash",
  other: "Other",
};

/** "manual:bkash" → "bKash (recorded manually)", "sslcommerz" → "SSLCommerz" */
export function paymentMethod(provider: string): string {
  const [kind, method] = provider.split(":");
  if (kind === "manual" && method) return `${METHOD_LABELS[method] ?? method} (recorded manually)`;
  return METHOD_LABELS[provider] ?? provider;
}

/** Whole days from now until `date` (negative once it has passed). */
export function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

/** "DOCUMENTS_NEEDED" → "documents needed" */
export function humanize(code: string): string {
  return code.replace(/_/g, " ").toLowerCase();
}
