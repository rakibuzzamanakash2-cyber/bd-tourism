import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { notifyTeam } from "@/lib/email";
import { env } from "@/lib/env";

export type ErrorSource = "page" | "action" | "route" | "webhook" | "cron" | "email";

/** Don't email about the same bug more than once a day. */
const NOTIFY_EVERY_MS = 24 * 60 * 60 * 1000;

/**
 * Groups errors so one bug is one row rather than a thousand.
 *
 * Line numbers move with every deploy, so the fingerprint uses the message
 * with anything variable stripped out — ids, numbers, quoted values — plus
 * where it happened. Two reports of the same broken query land together even
 * though their messages mention different booking codes.
 */
export function fingerprintOf(message: string, where: string, path: string | null) {
  const shape = message
    .replace(/[0-9a-f]{8,}/gi, "<id>")
    .replace(/\d+/g, "<n>")
    .replace(/(["'`])(?:(?!\1).)*\1/g, "<str>")
    .slice(0, 300);
  return createHash("sha256").update(`${where}|${path ?? ""}|${shape}`).digest("hex").slice(0, 32);
}

const messageOf = (err: unknown) =>
  (err instanceof Error ? err.message : String(err)).slice(0, 1000) || "Unknown error";

/**
 * Records a failure and, the first time it is seen (or once a day after),
 * emails the team.
 *
 * Never throws and never rejects: it is called from catch blocks, and a
 * reporter that breaks while reporting would hide the original problem. If
 * the database is the thing that is down, this falls back to the console.
 */
export async function reportError(
  err: unknown,
  context: { where: ErrorSource; path?: string | null; digest?: string | null; userId?: string | null },
): Promise<void> {
  const message = messageOf(err);
  const stack = err instanceof Error ? err.stack?.slice(0, 8000) ?? null : null;
  const path = context.path ?? null;
  const fingerprint = fingerprintOf(message, context.where, path);

  // Always on the console too: if the database write fails, this is all we have.
  console.error(`[error:${context.where}]${path ? ` ${path}` : ""} ${message}`);

  try {
    const row = await db.errorLog.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        message,
        stack,
        where: context.where,
        path,
        digest: context.digest ?? null,
        userId: context.userId ?? null,
      },
      update: {
        count: { increment: 1 },
        lastSeen: new Date(),
        message,
        stack,
        // A bug that comes back is not resolved any more.
        resolvedAt: null,
      },
      select: { id: true, count: true, notifiedAt: true, firstSeen: true },
    });

    const due = !row.notifiedAt || Date.now() - row.notifiedAt.getTime() > NOTIFY_EVERY_MS;
    if (!due) return;

    await db.errorLog.update({ where: { id: row.id }, data: { notifiedAt: new Date() } });
    await notifyTeam({
      // Reporting a failure to send this very email would recurse.
      recordFailure: false,
      subject: `${row.count === 1 ? "New error" : `Error seen ${row.count} times`}: ${message.slice(0, 80)}`,
      lines: [
        message,
        `Where: ${context.where}${path ? ` · ${path}` : ""}`,
        `Seen ${row.count} time${row.count === 1 ? "" : "s"} since ${row.firstSeen.toISOString().slice(0, 16).replace("T", " ")} UTC.`,
        `${env.NEXT_PUBLIC_APP_URL}/admin/errors`,
      ],
    });
  } catch (reporting) {
    // The reporter must never be the reason a request fails.
    console.error("[error:reporter] could not record the error above", reporting);
  }
}
