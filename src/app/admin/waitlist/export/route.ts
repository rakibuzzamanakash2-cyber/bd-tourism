import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/session";

/** CSV of the homestay waitlist, for importing into an email tool. */
export async function GET() {
  const admin = await getAdminOrNull();
  if (!admin) return new NextResponse("Not found", { status: 404 });

  const entries = await db.waitlistEntry.findMany({ orderBy: { createdAt: "asc" } });
  // Quote every field; prefix formula-like values so spreadsheets don't run them
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const rows = [
    ["email", "kind", "joined_at", "notified_at"],
    ...entries.map((e) => [e.email, e.kind, e.createdAt.toISOString(), e.notifiedAt?.toISOString() ?? ""]),
  ];
  const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="deltaway-homestay-waitlist-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
