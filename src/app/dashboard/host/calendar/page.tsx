import { notFound } from "next/navigation";
import { AvailabilityCalendar } from "@/components/guide/availability-calendar";
import { HostHeader } from "@/components/host/host-header";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/guide-shared";
import { stayNightKeys } from "@/lib/homestay-shared";
import { holdingBookingWhere } from "@/lib/homestays";
import { hostLang, hostText } from "@/lib/i18n/host";
import { requireHost } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Calendar" };

export default async function HostCalendarPage() {
  const { homestay } = await requireHost("/dashboard/host/calendar");
  if (!homestay) notFound();
  const lang = hostLang(homestay.language);
  const t = hostText[lang];
  const todayKey = dayKey(new Date());
  const today = new Date(todayKey);
  const [closed, bookings] = await Promise.all([
    db.homestayBlockedDate.findMany({ where: { homestayId: homestay.id, date: { gte: today } }, select: { date: true } }),
    db.booking.findMany({ where: { homestayId: homestay.id, ...holdingBookingWhere(), endDate: { gt: today } }, select: { startDate: true, endDate: true } }),
  ]);
  return (
    <div className={cn(lang === "bn" && "font-bengali")}>
      <HostHeader lang={lang} title={t.calendarTitle} intro={t.calendarIntro} />
      <AvailabilityCalendar
        kind="host"
        lang={lang}
        today={todayKey}
        blocked={closed.map((c) => dayKey(c.date))}
        tripDays={bookings.flatMap((b) => stayNightKeys(b.startDate, b.endDate))}
      />
    </div>
  );
}
