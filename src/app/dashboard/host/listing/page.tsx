import Link from "next/link";
import { notFound } from "next/navigation";
import { HostHeader } from "@/components/host/host-header";
import { HomestayListingForm } from "@/components/homestays/homestay-listing-form";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { hostLang, hostText } from "@/lib/i18n/host";
import { requireHost } from "@/lib/session";

export const metadata = { title: "My homestay" };

export default async function HostListingPage() {
  const { homestay: h } = await requireHost("/dashboard/host/listing");
  if (!h) notFound();
  const lang = hostLang(h.language);
  const t = hostText[lang];
  const regions = await db.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div className="max-w-2xl">
      <HostHeader lang={lang} title={t.nav.listing} />
      <p className="-mt-6 mb-8"><Link href={`/homestays/${h.slug}`} className="text-sm underline underline-offset-4">{t.viewPublic} →</Link></p>
      <HomestayListingForm
        mode="self"
        lang={lang}
        regions={regions}
        uploadsEnabled={features.uploads}
        initial={{
          name: h.name, regionId: h.regionId, district: h.district, area: h.area, address: h.address ?? "",
          description: h.description, houseRules: h.houseRules ?? "", rooms: String(h.rooms), maxGuests: String(h.maxGuests),
          facilities: h.facilities, languages: h.languages, photos: h.photos, isListed: h.isListed,
        }}
      />
    </div>
  );
}
