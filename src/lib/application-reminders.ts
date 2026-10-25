import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail, simpleEmail } from "@/lib/email";
import { kindParam } from "@/lib/applications";

const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

/**
 * One friendly nudge for applications left as a draft for 2+ days.
 * Sent once only (reminderSentAt); editing the draft later doesn't re-arm it.
 */
export async function remindStaleDrafts(now = new Date()): Promise<number> {
  const stale = await db.partnerApplication.findMany({
    where: { status: "DRAFT", reminderSentAt: null, updatedAt: { lt: new Date(now.getTime() - TWO_DAYS) } },
    include: { user: { select: { email: true } } },
    take: 200,
  });
  let sent = 0;
  for (const app of stale) {
    // Claim it first so two overlapping runs can't both send
    const { count } = await db.partnerApplication.updateMany({
      where: { id: app.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (!count) continue;
    const link = `${env.NEXT_PUBLIC_APP_URL}/apply/${kindParam(app.kind)}?lang=${app.language}&step=${app.step}`;
    const bn = app.language === "bn";
    const first = app.fullName.split(/\s+/)[0];
    await sendEmail({
      to: app.user.email,
      subject: bn ? "আপনার আবেদন এখনো বাকি — DeltaWay" : "Your DeltaWay application is waiting",
      html: simpleEmail(
        bn ? `${first}, আবেদনটা শেষ করবেন?` : `Hi ${first}, want to finish your application?`,
        bn
          ? ["আপনার উত্তরগুলো সংরক্ষিত আছে, যেখানে থেমেছিলেন সেখান থেকেই শুরু করতে পারবেন।", `চালিয়ে যান: ${link}`, "কোনো সমস্যা হলে এই ইমেইলের উত্তর দিন বা হোয়াটসঅ্যাপে লিখুন।"]
          : ["Your answers are saved, so you can pick up right where you left off.", `Continue: ${link}`, "Stuck on something? Reply to this email or message us on WhatsApp."],
      ),
    });
    sent++;
  }
  return sent;
}
