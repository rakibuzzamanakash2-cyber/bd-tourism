import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import {
  CopyButton,
  EmailInviteButton,
  InviteForm,
  RenewInviteButton,
  RevokeInviteButton,
  WhatsAppLinkButton,
} from "@/components/admin/application-actions";
import { AdminPageHeader, Table, Td } from "@/components/admin/ui";
import { dateTime, timeAgo } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { inviteLink, inviteMessage, inviteState, inviteWhatsapp, isLocalOrigin, siteOrigin } from "@/lib/invites";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Invites" };

export default async function AdminInvitesPage() {
  await requireAdmin();
  const [invites, origin] = await Promise.all([
    db.applicationInvite.findMany({
      include: { application: { select: { id: true, status: true } }, createdBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    siteOrigin(),
  ]);
  const now = new Date();
  const local = isLocalOrigin(origin);

  return (
    <div>
      <Link href="/admin/applications" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> Applications
      </Link>
      <div className="mt-4">
        <AdminPageHeader
          title="Invite a guide or host"
          description="Make a personal link and send it on WhatsApp or by email. It opens the form in their language with their name and phone filled in, keeps working through sign-up, and lasts 14 days."
        />
      </div>

      {local && (
        <div role="alert" className="mb-6 flex gap-3 rounded-lg border border-clay-600/30 bg-clay-500/10 p-4 text-sm">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-clay-700" />
          <div className="space-y-1.5">
            <p className="font-medium text-clay-700">These links point to {origin}, so they only open on this computer.</p>
            <p className="text-ink-soft">
              Once the site is online (NEXT_PUBLIC_APP_URL set to your real address) they work on any phone. To try one on
              your own phone now, connect it to the same Wi-Fi, start the site with <code className="font-mono text-xs">npx next dev -H &lt;your PC&apos;s IP&gt;</code>{" "}
              and open the admin at <code className="font-mono text-xs">http://&lt;your PC&apos;s IP&gt;:3000</code>. New links then use that address.
            </p>
          </div>
        </div>
      )}

      <InviteForm />

      <h2 className="mb-4 mt-12 font-display text-2xl">Recent invites</h2>
      <Table head={["Person", "As", "Status", "Created", ""]} empty={invites.length === 0}>
        {invites.map((i) => {
          const state = inviteState(i, now);
          const link = inviteLink(origin, i.token);
          const lang = i.language === "en" ? "en" : "bn";
          return (
            <tr key={i.id}>
              <Td>
                {i.name ?? "—"}
                <div className="text-xs text-ink-mute">{[i.phone, i.email].filter(Boolean).join(" · ") || "No contact saved"}</div>
                {i.note && <div className="text-xs italic text-ink-mute">{i.note}</div>}
              </Td>
              <Td>
                {i.kind === "GUIDE" ? "Guide" : "Host"}
                <div className="text-xs text-ink-mute">{lang === "bn" ? "Bangla" : "English"}</div>
              </Td>
              <Td className="text-sm">
                {state === "used" ? (
                  i.application ? (
                    <Link href={`/admin/applications/${i.application.id}`} className="text-forest-800 underline underline-offset-4">
                      Applied
                    </Link>
                  ) : (
                    "Used"
                  )
                ) : state === "expired" ? (
                  <span className="text-ink-mute">Expired{i.openedAt ? " (was opened)" : ""}</span>
                ) : i.openedAt ? (
                  <span>
                    Opened {timeAgo(i.openedAt)}
                    <div className="text-xs text-ink-mute">not started yet</div>
                  </span>
                ) : (
                  <span>
                    Not opened yet
                    <div className="text-xs text-ink-mute">until {dateTime(i.expiresAt)}</div>
                  </span>
                )}
                {i.emailedAt && <div className="text-xs text-ink-mute">emailed {timeAgo(i.emailedAt)}</div>}
              </Td>
              <Td className="whitespace-nowrap text-xs text-ink-mute">
                {dateTime(i.createdAt)}
                <div>by {i.createdBy?.name ?? i.createdBy?.email ?? "—"}</div>
              </Td>
              <Td>
                {state === "valid" && (
                  <div className="flex flex-wrap items-center gap-2">
                    {i.phone && <WhatsAppLinkButton href={inviteWhatsapp(i.phone, inviteMessage(i.kind, i.name, link, lang))} label="WhatsApp" />}
                    <CopyButton text={link} />
                    {i.email && <EmailInviteButton id={i.id} />}
                    <RevokeInviteButton id={i.id} />
                  </div>
                )}
                {state === "expired" && <RenewInviteButton id={i.id} />}
              </Td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
