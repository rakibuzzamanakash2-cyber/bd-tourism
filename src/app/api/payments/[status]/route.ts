import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = Promise<{ status: string }>;

export async function POST(req: NextRequest, ctx: { params: Params }) {
  return handleCallback(req, ctx);
}

export async function GET(req: NextRequest, ctx: { params: Params }) {
  return handleCallback(req, ctx);
}

async function handleCallback(
  req: NextRequest,
  { params }: { params: Params },
) {
  const { status } = await params;

  const allowedStatuses = new Set(["success", "fail", "cancel"]);
  if (!allowedStatuses.has(status)) {
    return NextResponse.redirect(new URL("/dashboard/bookings", req.url));
  }

  // Extract tran_id from POST body or query string
  let tranId: string | null = null;
  try {
    if (req.method === "POST") {
      const form = await req.formData();
      const t = form.get("tran_id");
      if (t) tranId = t.toString();
    } else {
      tranId = req.nextUrl.searchParams.get("tran_id");
    }
  } catch {
    // Body might not be form-encoded — ignore
  }

  let bookingId: string | null = null;
  if (tranId) {
    const payment = await db.payment.findFirst({
      where: { providerTxnId: tranId },
      select: { bookingId: true },
    });
    bookingId = payment?.bookingId ?? null;
  }

  if (!bookingId) {
    // No matching booking — send to their bookings list with a status flag
    return NextResponse.redirect(
      new URL(`/dashboard/bookings?payment=${status}`, req.url),
    );
  }

  // Route by outcome
  let target: string;
  if (status === "success") {
    // Celebrate on the dedicated success page
    target = `/dashboard/bookings/${bookingId}/pay/success`;
  } else {
    // Fail / cancel — send back to booking detail with a flag
    target = `/dashboard/bookings/${bookingId}?payment=${status}`;
  }

  return NextResponse.redirect(new URL(target, req.url));
}
