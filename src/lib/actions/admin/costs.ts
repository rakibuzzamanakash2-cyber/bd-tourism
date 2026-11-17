"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/session";
import type { AdminActionResult } from "@/lib/actions/admin/bookings";

const rateSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(2, "Give it a name.").max(60),
  // Whole taka. The ceiling is a typo guard, not a business rule.
  amountBdt: z.coerce.number().int().min(0, "Can't be negative.").max(10_000_000),
  note: z.string().trim().max(200),
  isActive: z.coerce.boolean(),
});

export async function saveCostRateAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Admins only." };

  const parsed = rateSchema.safeParse({
    id: formData.get("id") ?? "",
    label: formData.get("label") ?? "",
    amountBdt: formData.get("amountBdt") ?? "",
    note: formData.get("note") ?? "",
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const r = parsed.data;

  const saved = await db.costRate
    .update({ where: { id: r.id }, data: { label: r.label, amountBdt: r.amountBdt, note: r.note || null, isActive: r.isActive } })
    .catch(() => null);
  if (!saved) return { ok: false, error: "Rate not found." };

  await audit({
    actorId: admin.id,
    action: "content.cost.update",
    targetType: "CostRate",
    targetId: r.id,
    details: { key: saved.key, amountBdt: saved.amountBdt },
  });
  refresh();
  return { ok: true, message: `${saved.label} saved.` };
}

const SETTINGS = {
  serviceFeePercent: z.coerce.number().min(0, "Can't be negative.").max(100, "That's over 100%."),
  estimateGroupSize: z.coerce.number().int().min(1, "At least one person.").max(20),
} as const;

export async function saveCostSettingsAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Admins only." };

  const values: Record<string, string> = {};
  for (const [key, check] of Object.entries(SETTINGS)) {
    const parsed = check.safeParse(formData.get(key) ?? "");
    if (!parsed.success) return { ok: false, error: `${key}: ${parsed.error.issues[0].message}` };
    values[key] = String(parsed.data);
  }

  await db.$transaction(
    Object.entries(values).map(([key, value]) =>
      db.setting.upsert({ where: { key }, update: { value }, create: { key, value } }),
    ),
  );
  await audit({ actorId: admin.id, action: "content.costSettings.update", targetType: "Setting", targetId: "costs", details: values });
  refresh();
  return { ok: true, message: "Settings saved." };
}

function refresh() {
  revalidatePath("/admin/costs");
  // Every district page prints an estimate built from these numbers.
  revalidatePath("/districts", "layout");
}
