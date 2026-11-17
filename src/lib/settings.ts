import { db } from "@/lib/db";

/** Defaults used when a row is missing, so a fresh database still works. */
const DEFAULTS = {
  serviceFeePercent: 15,
  estimateGroupSize: 2,
};

export type CostSettings = { [K in keyof typeof DEFAULTS]: number };

/** The handful of numbers an admin can change without a deploy. */
export async function readSettings(): Promise<CostSettings> {
  const rows = await db.setting.findMany({ where: { key: { in: Object.keys(DEFAULTS) } } });
  const out = { ...DEFAULTS } as CostSettings;
  for (const row of rows) {
    const n = Number(row.value);
    if (Number.isFinite(n)) out[row.key as keyof CostSettings] = n;
  }
  return out;
}
