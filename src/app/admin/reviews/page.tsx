import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminPageHeader, FilterPills, Pagination } from "@/components/admin/ui";
import { Stars } from "@/components/reviews/stars";
import { AdminReviewActions } from "@/components/reviews/review-actions";
import { dateTime, pagination } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { bookingTitle } from "@/lib/homestay-shared";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Reviews" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminReviewsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const show = sp.show === "hidden" || sp.show === "low" ? (sp.show as string) : undefined;
  const { page, skip, take } = pagination(sp.page);
  const where: Prisma.ReviewWhereInput = show === "hidden" ? { status: "HIDDEN" } : show === "low" ? { OR: [{ rating: { lte: 3 } }, { guideRating: { lte: 3 } }] } : {};
  const [reviews, total, stats] = await Promise.all([
    db.review.findMany({
      where,
      include: {
        author: { select: { name: true, email: true } },
        booking: { select: { id: true, bookingCode: true, package: { select: { title: true } }, homestay: { select: { name: true } } } },
        guide: { select: { displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.review.count({ where }),
    db.review.aggregate({ where: { status: "PUBLISHED" }, _avg: { rating: true }, _count: true }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        description={`${stats._count} published · average ${stats._avg.rating ? stats._avg.rating.toFixed(1) : "—"}. Reviews go live straight away; hide any with personal details or abuse.`}
      />
      <div className="mb-6">
        <FilterPills options={[{ value: "low", label: "3 stars or less" }, { value: "hidden", label: "Hidden" }]} current={show} param="show" basePath="/admin/reviews" params={{ show }} />
      </div>
      {reviews.length === 0 ? (
        <p className="rounded-lg border border-forest-900/10 bg-paper-warm p-8 text-center text-ink-soft">No reviews here yet.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className={`rounded-lg border p-5 ${r.status === "HIDDEN" ? "border-clay-600/30 bg-clay-500/5" : "border-forest-900/10"}`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2"><Stars value={r.rating} />{r.title && <span className="font-medium">{r.title}</span>}</div>
                  <p className="mt-1 text-xs text-ink-mute">
                    {r.author.name ?? r.author.email} · <Link href={`/admin/bookings/${r.booking.id}`} className="underline underline-offset-4">{bookingTitle(r.booking)}</Link> · {dateTime(r.createdAt)}
                  </p>
                </div>
                {r.status === "HIDDEN" && <span className="text-xs font-medium text-clay-700">Hidden: {r.hiddenReason}</span>}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{r.comment}</p>
              {r.guide && r.guideRating && (
                <div className="mt-3 rounded-md bg-paper-warm p-3 text-sm">
                  <p className="flex items-center gap-2 text-xs text-ink-mute">Guide {r.guide.displayName} <Stars value={r.guideRating} size="size-3.5" /></p>
                  {r.guideComment && <p className="mt-1 whitespace-pre-line">{r.guideComment}</p>}
                </div>
              )}
              {r.reply && (
                <div className="mt-3 border-l-2 border-forest-700 pl-3 text-sm">
                  <p className="text-xs text-forest-800">{r.replyBy === "HOST" ? "Host replied" : "DeltaWay replied"}</p>
                  <p className="whitespace-pre-line text-ink-soft">{r.reply}</p>
                </div>
              )}
              <div className="mt-4"><AdminReviewActions id={r.id} hidden={r.status === "HIDDEN"} reply={r.reply} replyBy={r.replyBy} /></div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} total={total} take={take} basePath="/admin/reviews" params={{ show }} />
    </div>
  );
}
