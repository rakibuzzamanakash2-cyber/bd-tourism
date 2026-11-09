import "server-only";
import type { ImageCredit } from "@prisma/client";
import { db } from "@/lib/db";

/** Credits for these image URLs, keyed by URL (only the ones we have). */
export async function creditsFor(urls: string[]): Promise<Map<string, ImageCredit>> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await db.imageCredit.findMany({ where: { url: { in: unique } } });
  return new Map(rows.map((r) => [r.url, r]));
}
