import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { receiptForBooking } from "@/lib/receipts";

// PDF receipt for a paid booking. The traveler who booked, or the team.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Please sign in.", { status: 401 });
  const [booking, me] = await Promise.all([
    db.booking.findUnique({ where: { id }, select: { touristId: true } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
  ]);
  if (!booking || (booking.touristId !== session.user.id && me?.role !== "ADMIN")) return new NextResponse("Not found.", { status: 404 });
  const receipt = await receiptForBooking(id);
  if (!receipt) return new NextResponse("There's no receipt for this booking yet.", { status: 404 });
  return new NextResponse(Buffer.from(receipt.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receipt.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
