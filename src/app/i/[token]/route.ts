import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { kindParam } from "@/lib/applications";
import { db } from "@/lib/db";
import { INVITE_COOKIE, applyPathFor, inviteState } from "@/lib/invites";

// Link previews (WhatsApp, Messenger, Telegram…) fetch the link before the
// person taps it. Those visits shouldn't count as "opened".
const PREVIEW_BOT = /whatsapp|facebookexternalhit|facebot|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|googlebot|bingbot|embedly|preview/i;

// The short invite link: /i/<token>
// Remembers the invite in a cookie (so it survives sign-up, sign-in and
// Google), then sends the person to the right form in the right language.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token.slice(0, 100);
  // Send them on using the address they came in on (Wi-Fi IP, tunnel or the
  // real domain). req.url can carry the server's bind address (0.0.0.0).
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const go = (path: string) => {
    const res = NextResponse.redirect(`${proto}://${host}${path}`, 307);
    res.headers.set("Cache-Control", "no-store");
    return res;
  };

  const invite = await db.applicationInvite.findUnique({
    where: { token },
    include: { application: { select: { userId: true } } },
  });
  if (!invite) return go("/invite?status=invalid");

  const lang = invite.language === "en" ? "en" : "bn";
  const state = inviteState(invite);
  if (state === "used") {
    // The person who used it is just coming back: take them to their application
    const session = await auth();
    if (session?.user?.id && session.user.id === invite.application?.userId) return go("/dashboard/application");
    return go(`/invite?status=used&kind=${kindParam(invite.kind)}&lang=${lang}`);
  }
  if (state === "expired") return go(`/invite?status=expired&kind=${kindParam(invite.kind)}&lang=${lang}`);

  if (!invite.openedAt && !PREVIEW_BOT.test(req.headers.get("user-agent") ?? "")) {
    await db.applicationInvite.updateMany({ where: { id: invite.id, openedAt: null }, data: { openedAt: new Date() } });
  }

  const res = go(applyPathFor(invite.kind, lang));
  res.cookies.set(INVITE_COOKIE, invite.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    expires: invite.expiresAt,
  });
  return res;
}
