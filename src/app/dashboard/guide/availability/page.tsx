import { notFound } from "next/navigation";
import { GuideHeader } from "../guide-header";
import { AvailabilityCalendar } from "@/components/guide/availability-calendar";
import { db } from "@/lib/db";
import { dayKey, daysBetween } from "@/lib/guide-shared";
import { guideLang, guideText } from "@/lib/i18n/guide";
import { requireGuide } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Availability" };

export default async function GuideAvailabilityPage() {
  const { profile } = await requireGuide("/dashboard/guide/availability");
  if (!profile) notFound();
  const lang = guideLang(profile.language);
  const t = guideText[lang];
  const todayKey = dayKey(new Date());
  const today = new Date(todayKey);
  const [blocked, trips] = await Promise.all([
    db.guideBlockedDate.findMany({ where: { guideId: profile.id, date: { gte: today } }, select: { date: true } }),
    db.guideAssignment.findMany({
      where: { guideId: profile.id, status: "ACCEPTED", booking: { status: { not: "CANCELLED" }, endDate: { gte: today } } },
      select: { booking: { select: { startDate: true, endDate: true } } },
    }),
  ]);
  return (
    <div className={cn(lang === "bn" && "font-bengali")}>
      <GuideHeader lang={lang} title={t.availabilityTitle} intro={t.availabilityIntro} />
      <AvailabilityCalendar
        lang={lang}
        today={todayKey}
        blocked={blocked.map((b) => dayKey(b.date))}
        tripDays={trips.flatMap((x) => daysBetween(x.booking.startDate, x.booking.endDate))}
      />
    </div>
  );
}
