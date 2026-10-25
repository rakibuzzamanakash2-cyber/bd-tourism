import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import {
  ApplicationChecklist,
  ApplicationNotes,
  ApplicationStatusActions,
  WhatsAppLinkButton,
} from "@/components/admin/application-actions";
import { ApplicationStatusBadge } from "@/components/admin/ui";
import { dateTime, describeAction, humanize } from "@/lib/admin-format";
import { APPLICATION_TRANSITIONS, CHECKLIST, type PrivateFile } from "@/lib/applications";
import { privateDownloadUrl } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { applyText } from "@/lib/i18n/apply";
import { whatsappTo } from "@/lib/invites";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Application" };

export default async function AdminApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [app, history, regions] = await Promise.all([
    db.partnerApplication.findUnique({
      where: { id },
      include: { user: { select: { email: true, role: true, createdAt: true } }, invite: true },
    }),
    db.auditLog.findMany({
      where: { targetType: "PartnerApplication", targetId: id },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.region.findMany({ select: { id: true, name: true } }),
  ]);
  if (!app) notFound();

  const t = applyText.en;
  const d = (app.details ?? {}) as Record<string, unknown>;
  const s = (k: string) => (d[k] === undefined || d[k] === null || d[k] === "" ? "—" : String(d[k]));
  const list = (k: string, map?: (x: string) => string) => (Array.isArray(d[k]) && d[k].length ? (d[k] as string[]).map(map ?? ((x) => x)).join(", ") : "—");
  const regionNames = app.regionIds.map((rid) => regions.find((r) => r.id === rid)?.name ?? "?").join(", ");
  const doc = (f: unknown) => {
    const file = f as PrivateFile | null;
    return file ? { url: privateDownloadUrl(file.publicId, file.format), format: file.format } : null;
  };
  const idDoc = doc(app.idDocument);
  const licenceDoc = doc(app.licenceDocument);
  const checklist = (app.checklist ?? {}) as Record<string, boolean>;
  const items = CHECKLIST[app.kind];
  const allowed = (APPLICATION_TRANSITIONS[app.status] ?? []).filter((to) => to !== "HOME_VISIT" || app.kind === "HOST") as string[];
  const references = Array.isArray(d.references) ? (d.references as { name: string; phone: string; relation: string }[]) : [];

  return (
    <div>
      <Link href="/admin/applications" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> All applications
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-ink-mute">{app.kind === "GUIDE" ? "Guide application" : "Host application"}{app.invite ? " · invited" : ""}{app.language === "bn" ? " · filled in Bangla" : ""}</p>
          <h1 className="mt-1 font-display text-4xl leading-tight">{app.fullName}</h1>
          <p className="mt-2 text-ink-soft">
            {app.phone} · {app.user.email} · {regionNames}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <ApplicationStatusBadge status={app.status} />
          <WhatsAppLinkButton href={whatsappTo(app.phone)} label="WhatsApp them" />
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {app.kind === "GUIDE" ? (
            <Section title="Experience">
              <Rows rows={[
                [t.languages, list("languages")],
                [t.yearsExperience, s("yearsExperience")],
                [t.dayRate, d.dayRateBDT ? `৳${Number(d.dayRateBDT).toLocaleString()}` : "—"],
                [t.availability, s("availability")],
                [t.licenceNumber, s("licenceNumber")],
                [t.bio, s("bio")],
                [t.heardFrom, app.heardFrom ?? "—"],
              ]} />
            </Section>
          ) : (
            <Section title="Home">
              <Rows rows={[
                [t.district, s("district")],
                [t.area, s("area")],
                [t.rooms, s("rooms")],
                [t.maxGuests, s("maxGuests")],
                [t.pricePerNight, d.pricePerNightBDT ? `৳${Number(d.pricePerNightBDT).toLocaleString()}` : "—"],
                [t.facilities, list("facilities", (f) => t.facility[f] ?? f)],
                [t.languagesHost, list("languages")],
                [t.family, s("family")],
                [t.houseRules, s("houseRules")],
                [t.heardFrom, app.heardFrom ?? "—"],
              ]} />
            </Section>
          )}

          <Section title="Photos">
            {app.kind === "GUIDE" ? (
              app.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={app.photoUrl} alt={app.fullName} className="size-40 rounded-md object-cover" />
              ) : (
                <p className="text-sm text-ink-mute">No photo uploaded.</p>
              )
            ) : app.homePhotos.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {app.homePhotos.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="aspect-square w-full rounded-md object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-mute">No photos uploaded.</p>
            )}
          </Section>

          <Section title="ID & documents (private)">
            <div className="space-y-2 text-sm">
              <DocLine label={t.idDocument} doc={idDoc} fallback={app.shareIdLater ? "Will show it on WhatsApp / in person" : "Not provided"} />
              {app.kind === "GUIDE" && <DocLine label={t.licenceDocument} doc={licenceDoc} fallback="Not provided" />}
              <p className="text-xs text-ink-mute">Document links are private and stop working after 10 minutes. Reload the page for a fresh one.</p>
            </div>
          </Section>

          {app.kind === "GUIDE" && (
            <Section title="References">
              {references.length ? (
                <ul className="space-y-3 text-sm">
                  {references.map((r, i) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <span className="font-medium">{r.name}</span> · {r.relation}
                        <br />
                        <span className="text-ink-mute">{r.phone}</span>
                      </span>
                      <WhatsAppLinkButton href={whatsappTo(r.phone)} label="WhatsApp" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-mute">None yet.</p>
              )}
            </Section>
          )}

          <Section title="History">
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>{dateTime(app.createdAt)} · Started{app.invite ? " from an invite" : ""}</li>
              {history.map((h) => (
                <li key={h.id}>
                  {dateTime(h.createdAt)} · {h.actor?.name ?? h.actor?.email ?? "System"} {describeAction(h.action)}
                  {h.details && typeof h.details === "object" && "to" in h.details && ` → ${humanize(String(h.details.to))}`}
                  {h.details && typeof h.details === "object" && "item" in h.details && ` (${humanize(String(h.details.item))}: ${h.details.done ? "done" : "undone"})`}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title="Next step">
            {app.status === "DRAFT" ? (
              <p className="text-sm text-ink-mute">Not submitted yet (step {app.step}).</p>
            ) : (
              <ApplicationStatusActions id={app.id} allowed={allowed} checklistComplete={items.every((k) => checklist[k])} />
            )}
            {app.messageToApplicant && (
              <div className="mt-4 rounded-md bg-paper-warm p-3 text-xs">
                <p className="font-medium">Last message to applicant</p>
                <p className="mt-1 whitespace-pre-wrap text-ink-soft">{app.messageToApplicant}</p>
              </div>
            )}
          </Section>
          <Section title="Verification checklist">
            <ApplicationChecklist id={app.id} items={items} values={checklist} />
          </Section>
          <Section title="Team notes">
            <ApplicationNotes id={app.id} initial={app.adminNotes ?? ""} />
          </Section>
          {app.invite?.note && (
            <Section title="Invite note">
              <p className="text-sm text-ink-soft">{app.invite.note}</p>
            </Section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-forest-900/10 p-5">
      <h2 className="mb-4 font-sans text-xs uppercase tracking-wider text-ink-mute">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-[220px_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-mute">{k}</dt>
          <dd className="whitespace-pre-wrap">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function DocLine({ label, doc, fallback }: { label: string; doc: { url: string | null; format: string } | null; fallback: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2">
        <FileText className="size-4 text-ink-mute" /> {label}
      </span>
      {doc ? (
        doc.url ? (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
            Open {doc.format.toUpperCase()} <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span className="text-clay-700">Uploaded, but Cloudinary isn&rsquo;t configured on this server</span>
        )
      ) : (
        <span className="text-ink-mute">{fallback}</span>
      )}
    </div>
  );
}
