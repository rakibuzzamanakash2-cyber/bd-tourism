import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

// Next revalidates this once a day; new places don't need a deploy to appear.
export const revalidate = 86400;

const BASE = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

/** Pages anyone can read. Sign-in, booking and admin pages are left out. */
const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/destinations", priority: 0.9, changeFrequency: "daily" },
  { path: "/packages", priority: 0.9, changeFrequency: "daily" },
  { path: "/homestays", priority: 0.8, changeFrequency: "daily" },
  { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
  { path: "/plan", priority: 0.7, changeFrequency: "weekly" },
  { path: "/permits", priority: 0.7, changeFrequency: "monthly" },
  { path: "/share", priority: 0.6, changeFrequency: "monthly" },
  { path: "/become-a-host", priority: 0.6, changeFrequency: "monthly" },
  { path: "/become-a-guide", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/safety", priority: 0.5, changeFrequency: "monthly" },
  { path: "/help", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/credits", priority: 0.3, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [districts, places, destinations, packages, homestays, guides] = await Promise.all([
    db.district.findMany({ select: { slug: true, updatedAt: true }, orderBy: { name: "asc" } }),
    db.districtPlace.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true, district: { select: { slug: true } } },
    }),
    db.destination.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.tourPackage.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.homestay.findMany({ where: { isActive: true, isListed: true }, select: { slug: true, updatedAt: true } }),
    db.guideProfile.findMany({ where: { isActive: true, isListed: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const now = new Date();
  const entry = (path: string, lastModified: Date, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => ({
    url: `${BASE}${path || "/"}`,
    lastModified,
    changeFrequency,
    priority,
  });

  return [
    ...STATIC.map((s) => entry(s.path, now, s.priority, s.changeFrequency)),
    ...districts.map((d) => entry(`/districts/${d.slug}`, d.updatedAt, 0.8, "weekly" as const)),
    ...places.map((p) => entry(`/districts/${p.district.slug}/${p.slug}`, p.updatedAt, 0.7, "weekly" as const)),
    ...destinations.map((d) => entry(`/destinations/${d.slug}`, d.updatedAt, 0.8, "weekly" as const)),
    ...packages.map((p) => entry(`/packages/${p.slug}`, p.updatedAt, 0.9, "weekly" as const)),
    ...homestays.map((h) => entry(`/homestays/${h.slug}`, h.updatedAt, 0.7, "weekly" as const)),
    ...guides.map((g) => entry(`/guides/${g.slug}`, g.updatedAt, 0.6, "monthly" as const)),
  ];
}
