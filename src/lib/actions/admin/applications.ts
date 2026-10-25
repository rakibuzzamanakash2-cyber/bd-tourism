"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ApplicationStatus, Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail, simpleEmail } from "@/lib/email";
import { getAdminOrNull } from "@/lib/session";
import { createGuideProfileFromApplication } from "@/lib/guides";
import { APPLICATION_TRANSITIONS, CHECKLIST, normalizeBdPhone } from "@/lib/applications";
import { INVITE_DAYS, inviteEmail, inviteLink, inviteMessage, inviteState, inviteWhatsapp, siteOrigin } from "@/lib/invites";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

function refresh(id?: string) {
  revalidatePath("/admin/applications");
  if (id) revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard/application");
}

// What the applicant is told at each step (English + Bangla)
const STATUS_EMAIL: Partial<Record<ApplicationStatus, { en: [string, string]; bn: [string, string] }>> = {
  INTERVIEW: {
    en: ["Let's talk", "We've looked at your application and would like to talk to you. Expect a call or WhatsApp message from us in the next few days."],
    bn: ["কথা বলা যাক", "আপনার আবেদন আমরা দেখেছি এবং আপনার সাথে কথা বলতে চাই। কয়েক দিনের মধ্যে আমাদের ফোন বা হোয়াটসঅ্যাপ বার্তা পাবেন।"],
  },
  HOME_VISIT: {
    en: ["Next: a home visit", "Thanks for talking to us. The next step is a short visit to your home; we'll call to agree a time."],
    bn: ["পরের ধাপ: বাড়ি পরিদর্শন", "কথা বলার জন্য ধন্যবাদ। পরের ধাপে আমরা অল্প সময়ের জন্য আপনার বাড়ি দেখতে আসব; সময় ঠিক করতে ফোন করব।"],
  },
  CHANGES_REQUESTED: {
    en: ["A few changes, please", "We need a few changes to your application before we can continue. Please read our message, edit your application and submit it again."],
    bn: ["কিছু পরিবর্তন দরকার", "এগিয়ে যাওয়ার আগে আপনার আবেদনে কিছু পরিবর্তন দরকার। আমাদের বার্তাটি পড়ে আবেদন ঠিক করে আবার জমা দিন।"],
  },
  APPROVED: {
    en: ["Welcome to DeltaWay!", "Your application is approved. We'll be in touch about your first trips."],
    bn: ["DeltaWay-এ স্বাগতম!", "আপনার আবেদন অনুমোদিত হয়েছে। প্রথম ট্রিপগুলো নিয়ে আমরা শিগগিরই যোগাযোগ করব।"],
  },
  REJECTED: {
    en: ["About your application", "Thank you for applying. We can't approve your application right now."],
    bn: ["আপনার আবেদন সম্পর্কে", "আবেদনের জন্য ধন্যবাদ। এই মুহূর্তে আমরা আপনার আবেদন অনুমোদন করতে পারছি না।"],
  },
};

// ============================================================
// Move through the review pipeline
// ============================================================
const statusSchema = z.object({
  id: z.string().min(1),
  to: z.enum(["UNDER_REVIEW", "INTERVIEW", "HOME_VISIT", "CHANGES_REQUESTED", "APPROVED", "REJECTED"]),
  message: z.string().trim().max(3000).optional().default(""),
  notify: z.boolean().default(true),
});

export async function adminSetApplicationStatus(input: z.input<typeof statusSchema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { id, to, message, notify } = parsed.data;

  const app = await db.partnerApplication.findUnique({ where: { id }, include: { user: { select: { email: true, role: true } } } });
  if (!app) return { ok: false, error: "Application not found." };
  if (!APPLICATION_TRANSITIONS[app.status]?.includes(to)) {
    return { ok: false, error: `Can't move an application from ${app.status.toLowerCase().replace("_", " ")} to ${to.toLowerCase().replace("_", " ")}.` };
  }
  if (to === "HOME_VISIT" && app.kind !== "HOST") return { ok: false, error: "Home visits are only for host applications." };
  if ((to === "CHANGES_REQUESTED" || to === "REJECTED") && message.length < 5) {
    return { ok: false, error: "Write a short message so the applicant knows why." };
  }
  if (to === "APPROVED") {
    const checklist = (app.checklist ?? {}) as Record<string, boolean>;
    const missing = CHECKLIST[app.kind].filter((k) => !checklist[k]);
    if (missing.length) return { ok: false, error: "Finish the checklist before approving." };
  }

  const decided = to === "APPROVED" || to === "REJECTED";
  // An approved applicant becomes a guide or host (admins stay admins)
  const newRole = to === "APPROVED" && app.user.role === "TOURIST" ? app.kind : null;

  const { count } = await db.partnerApplication.updateMany({
    where: { id, status: app.status },
    data: {
      status: to,
      decidedAt: decided ? new Date() : null,
      ...(to === "CHANGES_REQUESTED" || to === "REJECTED" ? { messageToApplicant: message } : {}),
      ...(to === "UNDER_REVIEW" ? { messageToApplicant: null } : {}),
    },
  });
  if (count === 0) return { ok: false, error: "The application changed meanwhile. Refresh and try again." };
  if (newRole) await db.user.update({ where: { id: app.userId }, data: { role: newRole } });
  // Approved guides get their public profile straight away (they can edit it)
  const profile = to === "APPROVED" && app.kind === "GUIDE" ? await createGuideProfileFromApplication(app.userId) : null;
  if (profile) revalidatePath("/guides");

  await audit({
    actorId: admin.id,
    action: "application.status",
    targetType: "PartnerApplication",
    targetId: id,
    details: { from: app.status, to, ...(message && { message }), ...(newRole && { roleGranted: newRole }) },
  });

  const copy = STATUS_EMAIL[to];
  if (notify && copy) {
    const [heading, body] = app.language === "bn" ? copy.bn : copy.en;
    const msgLabel = app.language === "bn" ? "আমাদের বার্তা" : "Our message";
    const link = app.language === "bn" ? "আবেদন দেখুন" : "Your application";
    await sendEmail({
      to: app.user.email,
      subject: `${heading} — DeltaWay`,
      html: simpleEmail(heading, [
        body,
        ...(message && (to === "CHANGES_REQUESTED" || to === "REJECTED") ? [`${msgLabel}:\n${message}`] : []),
        `${link}: ${env.NEXT_PUBLIC_APP_URL}/dashboard/application`,
      ]),
    });
  }

  refresh(id);
  return { ok: true, message: to === "APPROVED" ? `Approved.${newRole ? ` The account is now a ${newRole.toLowerCase()}.` : ""}` : "Status updated." };
}

// ============================================================
// Checklist and notes
// ============================================================
const checklistSchema = z.object({ id: z.string().min(1), key: z.string(), value: z.boolean() });

export async function adminSetChecklistItem(input: z.input<typeof checklistSchema>): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = checklistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const app = await db.partnerApplication.findUnique({ where: { id: parsed.data.id }, select: { kind: true, checklist: true } });
  if (!app) return { ok: false, error: "Application not found." };
  if (!(CHECKLIST[app.kind] as readonly string[]).includes(parsed.data.key)) return { ok: false, error: "Unknown checklist item." };

  const checklist = { ...((app.checklist ?? {}) as Record<string, boolean>), [parsed.data.key]: parsed.data.value };
  await db.partnerApplication.update({ where: { id: parsed.data.id }, data: { checklist: checklist as Prisma.InputJsonValue } });
  await audit({
    actorId: admin.id,
    action: "application.checklist",
    targetType: "PartnerApplication",
    targetId: parsed.data.id,
    details: { item: parsed.data.key, done: parsed.data.value },
  });
  refresh(parsed.data.id);
  return { ok: true };
}

export async function adminSaveApplicationNotes(input: { id: string; notes: string }): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = z.object({ id: z.string().min(1), notes: z.string().max(5000) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Notes are too long." };
  await db.partnerApplication.update({ where: { id: parsed.data.id }, data: { adminNotes: parsed.data.notes.trim() || null } });
  refresh(parsed.data.id);
  return { ok: true, message: "Notes saved." };
}

// ============================================================
// Invites
// ============================================================
const inviteSchema = z.object({
  kind: z.enum(["GUIDE", "HOST"]),
  language: z.enum(["en", "bn"]).default("bn"),
  name: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().max(200).optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
  sendEmail: z.boolean().optional().default(false),
});

export type InviteResult =
  | { ok: true; link: string; message: string; whatsapp: string | null; emailed: boolean }
  | { ok: false; error: string };

async function emailInvite(invite: { id: string; kind: "GUIDE" | "HOST"; name: string | null; email: string | null; language: string; token: string }) {
  if (!invite.email) return false;
  const link = inviteLink(await siteOrigin(), invite.token);
  const e = inviteEmail(invite.kind, invite.name, link, invite.language === "en" ? "en" : "bn");
  const sent = await sendEmail({ to: invite.email, subject: e.subject, html: simpleEmail(e.heading, e.lines, { label: e.cta, url: link }) });
  if (sent.success) await db.applicationInvite.update({ where: { id: invite.id }, data: { emailedAt: new Date() } });
  return sent.success;
}

export async function adminCreateInvite(input: z.input<typeof inviteSchema>): Promise<InviteResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form." };
  const i = parsed.data;
  const phone = i.phone ? normalizeBdPhone(i.phone) : null;
  if (i.phone && !phone) return { ok: false, error: "That doesn't look like a Bangladeshi mobile number." };
  if (i.email && !z.string().email().safeParse(i.email).success) return { ok: false, error: "That email doesn't look right." };
  if (i.sendEmail && !i.email) return { ok: false, error: "Add their email to send the invite by email." };

  const invite = await db.applicationInvite.create({
    data: {
      kind: i.kind,
      token: randomBytes(18).toString("base64url"),
      language: i.language,
      name: i.name || null,
      phone,
      email: i.email.toLowerCase() || null,
      note: i.note || null,
      createdById: admin.id,
      expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  await audit({ actorId: admin.id, action: "application.invite", targetType: "ApplicationInvite", targetId: invite.id, details: { kind: i.kind, name: i.name || null } });
  const emailed = i.sendEmail ? await emailInvite(invite) : false;
  revalidatePath("/admin/applications/invites");

  const link = inviteLink(await siteOrigin(), invite.token);
  const message = inviteMessage(i.kind, invite.name, link, i.language);
  return { ok: true, link, message, whatsapp: phone ? inviteWhatsapp(phone, message) : null, emailed };
}

export async function adminEmailInvite(id: string): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const invite = await db.applicationInvite.findUnique({ where: { id } });
  if (!invite) return { ok: false, error: "Invite not found." };
  if (inviteState(invite) !== "valid") return { ok: false, error: "Renew the invite first." };
  if (!invite.email) return { ok: false, error: "This invite has no email address." };
  const sent = await emailInvite(invite);
  revalidatePath("/admin/applications/invites");
  return sent ? { ok: true, message: `Emailed to ${invite.email}.` } : { ok: false, error: "The email couldn't be sent. Is RESEND_API_KEY set?" };
}

/** Give an expired (or nearly expired) invite another 14 days. Same link. */
export async function adminRenewInvite(id: string): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  const { count } = await db.applicationInvite.updateMany({
    where: { id, usedAt: null },
    data: { expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000) },
  });
  if (!count) return { ok: false, error: "This invite was already used." };
  await audit({ actorId: admin.id, action: "application.invite_renew", targetType: "ApplicationInvite", targetId: id });
  revalidatePath("/admin/applications/invites");
  return { ok: true, message: `Renewed for ${INVITE_DAYS} days. The same link works again.` };
}

export async function adminRevokeInvite(id: string): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Not allowed." };
  await db.applicationInvite.updateMany({ where: { id, usedAt: null }, data: { expiresAt: new Date() } });
  await audit({ actorId: admin.id, action: "application.invite_revoke", targetType: "ApplicationInvite", targetId: id });
  revalidatePath("/admin/applications/invites");
  return { ok: true, message: "Invite cancelled." };
}
