import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CopyButton, InviteForm, RevokeInviteButton, WhatsAppLinkButton } from "@/components/admin/application-actions";
import { AdminPageHeader, Table, Td } from "@/components/admin/ui";
import { dateTime } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { inviteLink, inviteWhatsapp } from "@/lib/invites";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Invites" };

export default async function AdminInvitesPage() {
  await requireAdmin();
  const invites = await db.applicationInvite.findMany({
    include: { application: { select: { id: true, status: true } }, createdBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const now = new Date();

  return (
    <div>
      <Link href="/admin/applications" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> Applications
      </Link>
      <div className="mt-4">
        <AdminPageHeader
          title="Invite a guide or host"
          description="Create a personal link and send it on WhatsApp. It pre-fills their name and phone, works for 14 days, and shows up as 'invited' when they apply."
        />
      </div>
      <InviteForm />

      <h2 className="mb-4 mt-12 font-display text-2xl">Recent invites</h2>
      <Table head={["Person", "As", "Status", "Created", ""]} empty={invites.length === 0}>
        {invites.map((i) => {
          const used = Boolean(i.usedAt);
          const expired = !used && i.expiresAt <= now;
          const link = inviteLink(i.kind, i.token);
          return (
            <tr key={i.id}>
              <Td>
                {i.name ?? "—"}
                <div className="text-xs text-ink-mute">{[i.phone, i.email].filter(Boolean).join(" · ") || "No contact saved"}</div>
                {i.note && <div className="text-xs italic text-ink-mute">{i.note}</div>}
              </Td>
              <Td>{i.kind === "GUIDE" ? "Guide" : "Host"}</Td>
              <Td className="text-sm">
                {used ? (
                  i.application ? (
                    <Link href={`/admin/applications/${i.application.id}`} className="text-forest-800 underline underline-offset-4">
                      Applied
                    </Link>
                  ) : (
                    "Used"
                  )
                ) : expired ? (
                  <span className="text-ink-mute">Expired</span>
                ) : (
                  <span>Waiting · until {dateTime(i.expiresAt)}</span>
                )}
              </Td>
              <Td className="whitespace-nowrap text-xs text-ink-mute">
                {dateTime(i.createdAt)}
                <div>by {i.createdBy?.name ?? i.createdBy?.email ?? "—"}</div>
              </Td>
              <Td>
                {!used && !expired && (
                  <div className="flex flex-wrap items-center gap-2">
                    {i.phone && <WhatsAppLinkButton href={inviteWhatsapp(i.phone, i.kind, i.name, link)} label="WhatsApp" />}
                    <CopyButton text={link} />
                    <RevokeInviteButton id={i.id} />
                  </div>
                )}
              </Td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
