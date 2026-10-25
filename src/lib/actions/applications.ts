"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { notifyTeam, sendEmail, simpleEmail } from "@/lib/email";
import { signUpload, type UploadSignature } from "@/lib/cloudinary";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";
import { INVITE_COOKIE, currentInvite } from "@/lib/invites";
import {
  EDITABLE_STATUSES,
  STEPS,
  STEP_SCHEMA,
  basicsSchema,
  documentsSchemaFor,
  privateFileSchema,
  type Kind,
  type StepId,
} from "@/lib/applications";

export type StepResult =
  | { ok: true; nextStep: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; /** step to go back to */ goToStep?: number };

const kindSchema = z.enum(["GUIDE", "HOST"]);
const langSchema = z.enum(["en", "bn"]);

function issuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const k = i.path.join(".");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

const isEditable = (status: string) => (EDITABLE_STATUSES as readonly string[]).includes(status);

// When uploads are off, photos can't be required: we collect them on WhatsApp
function documentsSchema(kind: Kind) {
  if (features.uploads) return documentsSchemaFor(kind);
  return kind === "GUIDE"
    ? z.object({
        photoUrl: z.string().optional().default(""),
        licenceDocument: privateFileSchema.nullable(),
        idDocument: privateFileSchema.nullable(),
        shareIdLater: z.boolean(),
      }).refine((d) => d.idDocument || d.shareIdLater, { message: "id", path: ["idDocument"] })
    : z.object({
        homePhotos: z.array(z.string()).max(12),
        idDocument: privateFileSchema.nullable(),
        shareIdLater: z.boolean(),
      }).refine((d) => d.idDocument || d.shareIdLater, { message: "id", path: ["idDocument"] });
}

// ============================================================
// Save one step
// ============================================================
export async function saveApplicationStepAction(input: {
  kind: Kind;
  step: StepId;
  data: unknown;
  language: "en" | "bn";
}): Promise<StepResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "signin" };
  const userId = session.user.id;

  const kind = kindSchema.safeParse(input.kind);
  const language = langSchema.safeParse(input.language);
  if (!kind.success || !language.success) return { ok: false, error: "generic" };
  const steps = STEPS[kind.data] as readonly string[];
  const stepIndex = steps.indexOf(input.step);
  if (stepIndex < 0 || input.step === "review") return { ok: false, error: "generic" };

  const existing = await db.partnerApplication.findUnique({ where: { userId_kind: { userId, kind: kind.data } } });
  if (existing && !isEditable(existing.status)) return { ok: false, error: "locked" };
  if (!existing && input.step !== "basics") return { ok: false, error: "generic" };

  const nextStep = Math.max(existing?.step ?? 1, stepIndex + 2);

  // An invite in this browser (from the /i/ link) gets linked to the
  // application, also when they had started a draft before opening it
  const invite = !existing?.inviteId ? await currentInvite(kind.data) : null;
  const claimInvite = async (applicationId: string) => {
    if (!invite) return;
    const { count } = await db.applicationInvite.updateMany({ where: { id: invite.id, usedAt: null }, data: { usedAt: new Date() } });
    if (count) await db.partnerApplication.update({ where: { id: applicationId }, data: { inviteId: invite.id } });
    (await cookies()).delete(INVITE_COOKIE);
  };

  if (input.step === "basics") {
    const parsed = basicsSchema.safeParse(input.data);
    if (!parsed.success) return { ok: false, error: "fixErrors", fieldErrors: issuesToFieldErrors(parsed.error) };
    const found = await db.region.count({ where: { id: { in: parsed.data.regionIds } } });
    if (found !== parsed.data.regionIds.length) return { ok: false, error: "fixErrors", fieldErrors: { regionIds: "regions" } };
    const basics = { ...parsed.data, heardFrom: parsed.data.heardFrom || null, language: language.data };

    if (existing) {
      await db.partnerApplication.update({ where: { id: existing.id }, data: { ...basics, step: nextStep } });
      await claimInvite(existing.id);
    } else {
      const created = await db.partnerApplication.create({ data: { ...basics, kind: kind.data, userId, step: nextStep } });
      await claimInvite(created.id);
    }
  } else if (input.step === "documents") {
    const parsed = documentsSchema(kind.data).safeParse(input.data);
    if (!parsed.success) return { ok: false, error: "fixErrors", fieldErrors: issuesToFieldErrors(parsed.error) };
    const d = parsed.data as {
      photoUrl?: string;
      homePhotos?: string[];
      idDocument: Prisma.InputJsonValue | null;
      licenceDocument?: Prisma.InputJsonValue | null;
      shareIdLater: boolean;
    };
    await db.partnerApplication.update({
      where: { id: existing!.id },
      data: {
        step: nextStep,
        language: language.data,
        shareIdLater: d.shareIdLater,
        // A JSON column is cleared with Prisma.DbNull, not plain null
        idDocument: d.idDocument ?? Prisma.DbNull,
        ...(kind.data === "GUIDE"
          ? { photoUrl: d.photoUrl || null, licenceDocument: d.licenceDocument ?? Prisma.DbNull }
          : { homePhotos: d.homePhotos ?? [] }),
      },
    });
  } else {
    const schema = STEP_SCHEMA[input.step as "experience" | "references" | "home"];
    const parsed = schema.safeParse(input.data);
    if (!parsed.success) return { ok: false, error: "fixErrors", fieldErrors: issuesToFieldErrors(parsed.error) };
    const details = { ...((existing!.details as Record<string, unknown>) ?? {}), ...parsed.data };
    await db.partnerApplication.update({
      where: { id: existing!.id },
      data: { details: details as Prisma.InputJsonValue, step: nextStep, language: language.data },
    });
  }
  if (existing && input.step !== "basics") await claimInvite(existing.id);

  revalidatePath("/dashboard/application");
  return { ok: true, nextStep: stepIndex + 2 };
}

// ============================================================
// Submit
// ============================================================
export async function submitApplicationAction(input: { kind: Kind; confirmed: boolean }): Promise<StepResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "signin" };
  if (!input.confirmed) return { ok: false, error: "confirmRequired" };
  const kind = kindSchema.safeParse(input.kind);
  if (!kind.success) return { ok: false, error: "generic" };

  const app = await db.partnerApplication.findUnique({
    where: { userId_kind: { userId: session.user.id, kind: kind.data } },
    include: { user: { select: { email: true } } },
  });
  if (!app) return { ok: false, error: "generic" };
  if (!isEditable(app.status)) return { ok: false, error: "locked" };

  // Re-check every step; send them back to the first one with a problem
  const details = (app.details as Record<string, unknown>) ?? {};
  const steps = STEPS[kind.data] as readonly StepId[];
  const checks: [StepId, z.ZodType, unknown][] = [
    ["basics", basicsSchema, { fullName: app.fullName, phone: app.phone, regionIds: app.regionIds, heardFrom: app.heardFrom ?? "" }],
    ...(kind.data === "GUIDE"
      ? ([
          ["experience", STEP_SCHEMA.experience, details],
          ["documents", documentsSchema("GUIDE"), { photoUrl: app.photoUrl ?? "", licenceDocument: app.licenceDocument ?? null, idDocument: app.idDocument ?? null, shareIdLater: app.shareIdLater }],
          ["references", STEP_SCHEMA.references, details],
        ] as [StepId, z.ZodType, unknown][])
      : ([
          ["home", STEP_SCHEMA.home, details],
          ["documents", documentsSchema("HOST"), { homePhotos: app.homePhotos, idDocument: app.idDocument ?? null, shareIdLater: app.shareIdLater }],
        ] as [StepId, z.ZodType, unknown][])),
  ];
  for (const [step, schema, data] of checks) {
    if (!schema.safeParse(data).success) return { ok: false, error: "incomplete", goToStep: steps.indexOf(step) + 1 };
  }

  const resubmitted = app.status === "CHANGES_REQUESTED";
  await db.partnerApplication.update({
    where: { id: app.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  await audit({
    actorId: session.user.id,
    action: resubmitted ? "application.resubmit" : "application.submit",
    targetType: "PartnerApplication",
    targetId: app.id,
  });

  const what = kind.data === "GUIDE" ? "guide" : "homestay host";
  await Promise.all([
    sendEmail({
      to: app.user.email,
      subject: app.language === "bn" ? "আপনার আবেদন জমা হয়েছে — DeltaWay" : "We've got your application — DeltaWay",
      html: simpleEmail(
        app.language === "bn" ? "আবেদনের জন্য ধন্যবাদ।" : "Thanks for applying.",
        app.language === "bn"
          ? [`${app.fullName}, আপনার আবেদন আমরা পেয়েছি। ৩ কার্যদিবসের মধ্যে দেখে আপনার সাথে যোগাযোগ করব।`, `অবস্থা দেখুন: ${env.NEXT_PUBLIC_APP_URL}/dashboard/application`]
          : [`Hi ${app.fullName.split(/\s+/)[0]}, we've received your application to be a DeltaWay ${what}. We'll review it within 3 working days and get in touch.`, `Check its status any time: ${env.NEXT_PUBLIC_APP_URL}/dashboard/application`],
      ),
    }),
    notifyTeam({
      subject: `${resubmitted ? "Resubmitted" : "New"} ${what} application: ${app.fullName}`,
      lines: [`${app.fullName}, ${app.phone}`, `Review it: ${env.NEXT_PUBLIC_APP_URL}/admin/applications/${app.id}`],
    }),
  ]);

  revalidatePath("/dashboard/application");
  revalidatePath("/admin/applications");
  return { ok: true, nextStep: steps.length };
}

// ============================================================
// Upload signature for the applicant's own files
// ============================================================
export async function getApplicantUploadSignature(
  folder: "applications" | "documents",
): Promise<{ ok: true; signature: UploadSignature } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in again." };
  if (folder !== "applications" && folder !== "documents") return { ok: false, error: "Invalid upload." };

  const editable = await db.partnerApplication.findFirst({
    where: { userId: session.user.id, status: { in: [...EDITABLE_STATUSES] } },
    select: { id: true },
  });
  if (!editable) return { ok: false, error: "Start your application first." };

  const limited = await rateLimit(`upload:user:${session.user.id}`, RATE_LIMITS.uploadUser);
  if (!limited.ok) return { ok: false, error: "Too many uploads. Please wait a little and try again." };

  const signature = signUpload(folder);
  if (!signature) return { ok: false, error: "Uploads aren't available right now." };
  return { ok: true, signature };
}
