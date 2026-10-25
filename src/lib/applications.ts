// Guide & host applications: the steps, their fields and validation.
// Shared by the form (browser) and the server actions, so both check the
// same rules. No server-only imports here.
import { z } from "zod";
import { isAllowedImageUrl } from "@/lib/image-hosts";

export type Kind = "GUIDE" | "HOST";
export const kindFromParam = (v: string): Kind | null => (v === "guide" ? "GUIDE" : v === "host" ? "HOST" : null);
export const kindParam = (k: Kind) => (k === "GUIDE" ? "guide" : "host");

// ============================================================
// Options
// ============================================================
export const LANGUAGE_OPTIONS = [
  "Bangla", "English", "Hindi", "Urdu", "Arabic", "Chakma", "Marma",
  "Chinese", "French", "German", "Japanese", "Spanish",
] as const;

export const FACILITY_OPTIONS = [
  "private_room", "attached_bathroom", "western_toilet", "hot_water",
  "air_conditioning", "fan", "wifi", "home_cooked_meals", "parking", "english_speaker",
] as const;

// ============================================================
// Phone numbers (Bangladesh mobiles)
// ============================================================
/** "01712-345678" / "+880 1712 345678" → "+8801712345678", or null if not a BD mobile. */
export function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const local = digits.startsWith("880") ? digits.slice(2) : digits.startsWith("88") ? digits.slice(2) : digits;
  return /^01[3-9]\d{8}$/.test(local) ? `+88${local}` : null;
}

const bdPhone = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const n = normalizeBdPhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "phone" });
      return z.NEVER;
    }
    return n;
  });

const photo = z.string().trim().refine(isAllowedImageUrl, "photo");
export const privateFileSchema = z.object({
  // Must be one of our own private uploads, not any file on the account
  publicId: z.string().min(1).max(300).startsWith("deltaway/documents/"),
  format: z.string().regex(/^[a-z0-9]{2,5}$/),
});
export type PrivateFile = z.infer<typeof privateFileSchema>;

// Messages are keys into the translations (src/lib/i18n/apply.ts)
// so each language can say them its own way.

// ============================================================
// Steps
// ============================================================
export const basicsSchema = z.object({
  fullName: z.string().trim().min(2, "name").max(120),
  phone: bdPhone,
  regionIds: z.array(z.string().min(1)).min(1, "regions").max(6),
  heardFrom: z.string().trim().max(200).optional().default(""),
});

export const guideExperienceSchema = z.object({
  languages: z.array(z.string()).min(1, "languages").max(12),
  yearsExperience: z.coerce.number().int("number").min(0, "number").max(60, "number"),
  bio: z.string().trim().min(30, "bio").max(2000),
  dayRateBDT: z.coerce.number().int("number").min(500, "rate").max(100000, "rate"),
  availability: z.string().trim().max(500).optional().default(""),
  licenceNumber: z.string().trim().max(60).optional().default(""),
});

const idChoice = {
  idDocument: privateFileSchema.nullable(),
  shareIdLater: z.boolean(),
};

export const guideDocumentsSchema = z
  .object({
    photoUrl: photo,
    licenceDocument: privateFileSchema.nullable(),
    ...idChoice,
  })
  .refine((d) => d.idDocument || d.shareIdLater, { message: "id", path: ["idDocument"] });

export const guideReferencesSchema = z.object({
  references: z
    .array(
      z.object({
        name: z.string().trim().min(2, "refName").max(100),
        phone: bdPhone,
        relation: z.string().trim().min(2, "refRelation").max(100),
      }),
    )
    .length(2, "references"),
});

export const hostHomeSchema = z.object({
  district: z.string().trim().min(2, "district").max(60),
  area: z.string().trim().min(2, "area").max(200),
  rooms: z.coerce.number().int("number").min(1, "number").max(20, "number"),
  maxGuests: z.coerce.number().int("number").min(1, "number").max(30, "number"),
  facilities: z.array(z.enum(FACILITY_OPTIONS)).max(FACILITY_OPTIONS.length),
  languages: z.array(z.string()).min(1, "languages").max(12),
  family: z.string().trim().min(10, "family").max(1000),
  houseRules: z.string().trim().max(1000).optional().default(""),
  pricePerNightBDT: z.coerce.number().int("number").min(300, "price").max(50000, "price"),
});

export const hostDocumentsSchema = z
  .object({
    homePhotos: z.array(photo).min(3, "homePhotos").max(12),
    ...idChoice,
  })
  .refine((d) => d.idDocument || d.shareIdLater, { message: "id", path: ["idDocument"] });

/** The steps for each kind, in order. The last step is always "review". */
export const STEPS = {
  GUIDE: ["basics", "experience", "documents", "references", "review"],
  HOST: ["basics", "home", "documents", "review"],
} as const;
export type StepId = (typeof STEPS)[Kind][number];

export const STEP_SCHEMA = {
  basics: basicsSchema,
  experience: guideExperienceSchema,
  references: guideReferencesSchema,
  home: hostHomeSchema,
} as const;

export const documentsSchemaFor = (kind: Kind) => (kind === "GUIDE" ? guideDocumentsSchema : hostDocumentsSchema);

/** Statuses in which the applicant may still edit their answers. */
export const EDITABLE_STATUSES = ["DRAFT", "CHANGES_REQUESTED"] as const;

// ============================================================
// Admin checklist
// ============================================================
export const CHECKLIST = {
  GUIDE: ["idChecked", "phoneVerified", "interviewDone", "referencesChecked"],
  HOST: ["idChecked", "phoneVerified", "interviewDone", "homeVisited"],
} as const;

export const CHECKLIST_LABEL: Record<string, string> = {
  idChecked: "ID document checked",
  phoneVerified: "Phone number verified",
  interviewDone: "Interview / call done",
  referencesChecked: "Both references called",
  homeVisited: "Home visited in person",
};

export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  INTERVIEW: "Interview",
  HOME_VISIT: "Home visit",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};

/** Which status an admin can move an application to, from each status. */
export const APPLICATION_TRANSITIONS: Record<string, readonly string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "CHANGES_REQUESTED", "REJECTED"],
  UNDER_REVIEW: ["INTERVIEW", "CHANGES_REQUESTED", "REJECTED"],
  INTERVIEW: ["HOME_VISIT", "APPROVED", "CHANGES_REQUESTED", "REJECTED"],
  HOME_VISIT: ["APPROVED", "CHANGES_REQUESTED", "REJECTED"],
  CHANGES_REQUESTED: ["REJECTED"],
  REJECTED: ["UNDER_REVIEW"],
  APPROVED: [],
};
