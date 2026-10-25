// Guide rules shared by forms (browser) and server actions. No server imports.
import { z } from "zod";
import { isAllowedImageUrl } from "@/lib/image-hosts";

export const guideProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Name is too short").max(80),
  photoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || isAllowedImageUrl(v), "Use an uploaded photo or a Cloudinary / Unsplash / Pexels / Wikimedia link")
    .optional()
    .default(""),
  bio: z.string().trim().min(30, "Write at least a few sentences (30+ characters)").max(2000),
  languages: z.array(z.string().trim().min(2).max(40)).min(1, "Pick at least one language").max(12),
  regionIds: z.array(z.string().min(1)).min(1, "Pick at least one region").max(8),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  dayRateBDT: z.coerce.number().int().min(500, "At least ৳500").max(100000),
  licenceNumber: z.string().trim().max(60).optional().default(""),
  isListed: z.boolean().default(true),
});
export type GuideProfileInput = z.input<typeof guideProfileSchema>;

export const ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Waiting for guide",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

/** Booking statuses where a guide can be (or stay) assigned. */
export const GUIDE_ASSIGNABLE_BOOKING = ["PAID", "CONFIRMED", "IN_PROGRESS"] as const;

/** Whole days a trip covers, counting the first and last day. */
export function tripDays(start: Date, end: Date): number {
  const ms = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) - Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

/** "2026-11-03" for a date, by its UTC calendar day (dates are stored at UTC midnight). */
export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function daysBetween(start: Date, end: Date): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  while (d.getTime() <= last && out.length < 60) {
    out.push(dayKey(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export const bdt = (n: number) => `৳${n.toLocaleString("en-US")}`;

/** Paid trips that include a guide, starting soon, with nobody asked or confirmed yet. */
export const needsGuideWhere = (now: Date) => ({
  status: { in: ["PAID", "CONFIRMED"] as ("PAID" | "CONFIRMED")[] },
  startDate: { gte: now },
  package: { includesGuide: true },
  guideAssignments: { none: { status: { in: ["PENDING", "ACCEPTED"] as ("PENDING" | "ACCEPTED")[] } } },
});
