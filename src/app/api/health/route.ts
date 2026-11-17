import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Always fresh: a cached health check tells you the cache is alive.
export const dynamic = "force-dynamic";

/**
 * For uptime monitoring. Deliberately dull: whether the app is running and
 * whether it can reach its database, and nothing else. No version, no
 * configuration, no counts — anyone on the internet can read this.
 */
export async function GET() {
  const startedAt = Date.now();
  let database: "ok" | "unreachable" = "ok";

  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "unreachable";
  }

  const ok = database === "ok";
  return NextResponse.json(
    { status: ok ? "ok" : "degraded", database, checkedInMs: Date.now() - startedAt },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
