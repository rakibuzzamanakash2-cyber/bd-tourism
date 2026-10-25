import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { ApplicationWizard, type WizardValues } from "@/components/apply/application-wizard";
import { EDITABLE_STATUSES, STEPS, kindFromParam, kindParam, type PrivateFile } from "@/lib/applications";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { applyText, langFromParam } from "@/lib/i18n/apply";
import { currentInvite } from "@/lib/invites";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ kind: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const kind = kindFromParam((await params).kind);
  return { title: kind === "HOST" ? "Apply to host" : "Apply to guide", robots: { index: false } };
}

const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export default async function ApplyPage({ params, searchParams }: Props) {
  const kind = kindFromParam((await params).kind);
  if (!kind) notFound();
  const sp = await searchParams;
  // Links from before the short /i/ links: send them through it so the
  // invite gets remembered the same way
  const oldInvite = str(sp.invite);
  if (oldInvite) redirect(`/i/${encodeURIComponent(oldInvite.slice(0, 100))}`);

  const [session, validInvite] = await Promise.all([auth(), currentInvite(kind)]);

  const existing = session?.user?.id
    ? await db.partnerApplication.findUnique({ where: { userId_kind: { userId: session.user.id, kind } } })
    : null;
  // Language: explicit choice in the URL, else what they used last time, else the invite's
  const lang = sp.lang ? langFromParam(sp.lang) : langFromParam(existing?.language ?? validInvite?.language);
  const t = applyText[lang];
  const base = `/apply/${kindParam(kind)}`;
  const keep = () => (lang === "bn" ? "lang=bn" : "");

  const header = (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="eyebrow mb-3 text-forest-700">{kind === "GUIDE" ? "Guides" : "Homestays"}</p>
        <h1 className={cn("font-display text-4xl leading-tight sm:text-5xl", lang === "bn" && "font-bengali leading-snug")}>
          {kind === "GUIDE" ? t.guideTitle : t.hostTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-ink-soft">{kind === "GUIDE" ? t.guideIntro : t.hostIntro}</p>
        {validInvite && <p className="mt-3 inline-block rounded-full bg-forest-100 px-3 py-1 text-sm text-forest-900">{t.invited}</p>}
      </div>
      <Link
        href={`${base}?${[lang === "bn" ? "lang=en" : "lang=bn", sp.step && `step=${str(sp.step)}`].filter(Boolean).join("&")}`}
        className={cn("shrink-0 rounded-full border border-forest-900/20 px-4 py-2 text-sm hover:bg-forest-100", lang === "en" && "font-bengali")}
      >
        {t.switchTo}
      </Link>
    </div>
  );

  // ---- Signed out: explain, then send them to sign up / in and back here
  if (!session?.user?.id) {
    const back = encodeURIComponent(`${base}${keep() ? `?${keep()}` : ""}`);
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        {header}
        <div className="rounded-lg border border-forest-900/10 bg-paper-warm p-8">
          <p className="text-ink-soft">{t.signInFirst}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/signup?callbackUrl=${back}`} className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-forest-900 text-paper hover:bg-forest-800")}>
              {t.signUp}
            </Link>
            <Link href={`/login?callbackUrl=${back}`} className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-full border border-forest-900/20")}>
              {t.signIn}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ---- Already submitted: show the status page instead
  if (existing && !(EDITABLE_STATUSES as readonly string[]).includes(existing.status)) {
    redirect("/dashboard/application");
  }

  const steps = STEPS[kind];
  const maxStep = Math.min(existing?.step ?? 1, steps.length);
  const requested = parseInt(str(sp.step) ?? "", 10);
  const step = Number.isFinite(requested) && requested >= 1 && requested <= maxStep ? requested : maxStep;

  const regions = await db.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const d = (existing?.details ?? {}) as Record<string, unknown>;
  const s = (k: string) => (d[k] === undefined || d[k] === null ? "" : String(d[k]));
  const arr = (k: string) => (Array.isArray(d[k]) ? (d[k] as string[]) : []);

  const initial: WizardValues = {
    fullName: existing?.fullName ?? validInvite?.name ?? session.user.name ?? "",
    phone: existing?.phone ?? validInvite?.phone ?? "",
    regionIds: existing?.regionIds ?? [],
    heardFrom: existing?.heardFrom ?? (validInvite ? "Invited by DeltaWay" : ""),
    languages: arr("languages"),
    yearsExperience: s("yearsExperience"),
    bio: s("bio"),
    dayRateBDT: s("dayRateBDT"),
    availability: s("availability"),
    licenceNumber: s("licenceNumber"),
    references: Array.isArray(d.references) ? (d.references as WizardValues["references"]) : [],
    photoUrl: existing?.photoUrl ?? "",
    licenceDocument: (existing?.licenceDocument as PrivateFile | null) ?? null,
    district: s("district"),
    area: s("area"),
    rooms: s("rooms"),
    maxGuests: s("maxGuests"),
    facilities: arr("facilities"),
    family: s("family"),
    houseRules: s("houseRules"),
    pricePerNightBDT: s("pricePerNightBDT"),
    homePhotos: existing?.homePhotos ?? [],
    idDocument: (existing?.idDocument as PrivateFile | null) ?? null,
    shareIdLater: existing?.shareIdLater ?? !features.uploads,
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      {header}
      {existing?.status === "CHANGES_REQUESTED" && existing.messageToApplicant && (
        <div className="mb-8 rounded-lg border border-clay-600/30 bg-clay-500/10 p-5">
          <p className="text-sm font-medium text-clay-700">{t.messageFromTeam}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{existing.messageToApplicant}</p>
        </div>
      )}
      <ApplicationWizard
        kind={kind}
        lang={lang}
        step={step}
        maxStep={maxStep}
        uploadsEnabled={features.uploads}
        regions={regions}
        initial={initial}
      />
    </section>
  );
}
