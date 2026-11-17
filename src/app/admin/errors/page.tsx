import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/ui";
import { ErrorActions } from "@/components/admin/error-actions";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Errors" };
const PER_PAGE = 50;

type Props = { searchParams: Promise<{ show?: string }> };

export default async function AdminErrorsPage({ searchParams }: Props) {
  await requireAdmin();
  const showResolved = (await searchParams).show === "resolved";

  const [errors, open, resolved] = await Promise.all([
    db.errorLog.findMany({
      where: showResolved ? { resolvedAt: { not: null } } : { resolvedAt: null },
      orderBy: { lastSeen: "desc" },
      take: PER_PAGE,
    }),
    db.errorLog.count({ where: { resolvedAt: null } }),
    db.errorLog.count({ where: { resolvedAt: { not: null } } }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Errors"
        description="Anything that broke, grouped so one bug is one row. We email you the first time each one appears, then at most once a day after that. A bug you mark as sorted reopens itself if it happens again."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { href: "/admin/errors", label: "Open", n: open, on: !showResolved },
          { href: "/admin/errors?show=resolved", label: "Sorted", n: resolved, on: showResolved },
        ].map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm",
              t.on ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 hover:border-forest-900/40",
            )}
          >
            {t.label} <span className="ml-1 opacity-70">{t.n}</span>
          </Link>
        ))}
      </div>

      {errors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-forest-900/20 p-10 text-center text-ink-mute">
          {showResolved ? "Nothing marked sorted yet." : "Nothing is broken. This is the page you want to be empty."}
        </p>
      ) : (
        <ul className="space-y-4">
          {errors.map((e) => (
            <li key={e.id} className="rounded-lg border border-forest-900/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-mono text-sm leading-relaxed">{e.message}</p>
                <ErrorActions id={e.id} resolved={Boolean(e.resolvedAt)} />
              </div>
              <p className="mt-2 text-xs text-ink-mute">
                {e.where}
                {e.path ? ` · ${e.path}` : ""} · seen {e.count}×· first {e.firstSeen.toISOString().slice(0, 16).replace("T", " ")} · last{" "}
                {e.lastSeen.toISOString().slice(0, 16).replace("T", " ")} UTC
              </p>
              {e.stack && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-ink-mute">Stack</summary>
                  <pre className="mt-2 overflow-x-auto rounded bg-forest-100/60 p-3 text-xs leading-relaxed">{e.stack}</pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
