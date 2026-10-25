import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MessageActions } from "@/components/admin/message-actions";
import { ContactStatusBadge } from "@/components/admin/ui";
import { dateTime } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata = { title: "Message" };

export default async function AdminMessagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  let message = await db.contactMessage.findUnique({
    where: { id },
    include: { user: { select: { id: true, _count: { select: { bookings: true } } } } },
  });
  if (!message) notFound();

  // Opening a new message marks it as read
  if (message.status === "NEW") {
    message = await db.contactMessage.update({
      where: { id },
      data: { status: "READ" },
      include: { user: { select: { id: true, _count: { select: { bookings: true } } } } },
    });
  }

  const quoted = message.message
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");
  const replyHref = `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}&body=${encodeURIComponent(
    `Hi ${message.name.split(/\s+/)[0]},\n\n\n\n— ${site.name}\n\n${quoted}`,
  )}`;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/messages" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-forest-800">
        <ArrowLeft className="size-4" /> All messages
      </Link>
      <div className="mt-4 flex items-start justify-between gap-4">
        <h1 className="font-display text-3xl leading-tight">{message.subject}</h1>
        <ContactStatusBadge status={message.status} />
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        From <span className="font-medium text-ink">{message.name}</span> &lt;{message.email}&gt; · {dateTime(message.createdAt)}
        {message.user && ` · signed-in user with ${message.user._count.bookings} booking(s)`}
      </p>
      <div className="mt-6 whitespace-pre-wrap rounded-lg border border-forest-900/10 bg-paper-warm p-6 leading-relaxed">
        {message.message}
      </div>
      <div className="mt-6">
        <MessageActions messageId={message.id} status={message.status} replyHref={replyHref} />
      </div>
    </div>
  );
}
