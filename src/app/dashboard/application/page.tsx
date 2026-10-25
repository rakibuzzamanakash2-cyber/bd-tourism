import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EDITABLE_STATUSES, STEPS, kindParam } from "@/lib/applications";
import { db } from "@/lib/db";
import { applyText, langFromParam } from "@/lib/i18n/apply";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Your application" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MyApplicationPage({ searchParams }: Props) {
  const user = await requireUser("/dashboard/application");
  const { submitted } = await searchParams;
  const apps = await db.partnerApplication.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });

  if (apps.length === 0) {
    return (
      <div>
        <p className="eyebrow mb-4 text-forest-700">Work with us</p>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Guide or host with DeltaWay.</h1>
        <p className="mt-4 max-w-xl text-ink-soft">You haven&rsquo;t started an application yet.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/apply/guide" className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-forest-900 text-paper hover:bg-forest-800")}>
            Apply to be a guide
          </Link>
          <Link href="/apply/host" className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-full border border-forest-900/20")}>
            Apply to host travelers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {submitted === "1" && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-forest-700/20 bg-forest-100 p-5 text-forest-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p>Application submitted. We&rsquo;ve emailed you a confirmation. · আবেদন জমা হয়েছে।</p>
        </div>
      )}
      {apps.map((app) => {
        const t = applyText[langFromParam(app.language)];
        const editable = (EDITABLE_STATUSES as readonly string[]).includes(app.status);
        const total = STEPS[app.kind].length;
        const href = `/apply/${kindParam(app.kind)}${app.language === "bn" ? "?lang=bn" : ""}`;
        return (
          <section key={app.id} className="rounded-lg border border-forest-900/10 p-6 sm:p-8">
            <p className="eyebrow mb-3 text-forest-700">{app.kind === "GUIDE" ? "Guide application" : "Host application"}</p>
            <h1 className="font-display text-3xl leading-tight">{t.statusTitle}</h1>
            <p className="mt-4 text-lg text-ink">{t.status[app.status]}</p>
            {app.status === "DRAFT" && (
              <div className="mt-4 max-w-md">
                <div className="h-2 overflow-hidden rounded-full bg-forest-100">
                  <div className="h-full bg-forest-700" style={{ width: `${Math.round(((Math.min(app.step, total) - 1) / (total - 1)) * 100)}%` }} />
                </div>
                <p className="mt-2 text-xs text-ink-mute">{t.stepOf(Math.min(app.step, total), total)}</p>
              </div>
            )}
            {app.messageToApplicant && (app.status === "CHANGES_REQUESTED" || app.status === "REJECTED") && (
              <div className="mt-6 rounded-md border border-clay-600/30 bg-clay-500/10 p-4">
                <p className="text-sm font-medium text-clay-700">{t.messageFromTeam}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{app.messageToApplicant}</p>
              </div>
            )}
            {editable && (
              <Link href={href} className={cn(buttonVariants({ size: "lg" }), "mt-6 rounded-full bg-forest-900 text-paper hover:bg-forest-800")}>
                {app.status === "CHANGES_REQUESTED" ? t.editAndResubmit : t.continueApplication}
              </Link>
            )}
          </section>
        );
      })}
    </div>
  );
}
