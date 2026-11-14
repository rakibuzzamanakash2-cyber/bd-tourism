import "server-only";
import { db } from "@/lib/db";
import { cloudinary } from "@/lib/env";
import { destroyUpload } from "@/lib/cloudinary";

const FOLDER = "deltaway/travelers/";

/**
 * True only for a photo uploaded to OUR Cloudinary account, in the travelers
 * folder, with the id the browser reported. Stops anyone submitting a link to
 * some other image.
 */
export function isOurTravelerUpload(url: string, publicId: string): boolean {
  if (!cloudinary.configured) return false;
  if (!/^deltaway\/travelers\/[A-Za-z0-9_-]{6,80}$/.test(publicId)) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.hostname !== "res.cloudinary.com" || u.search || u.hash) return false;
  const prefix = `/${cloudinary.cloudName}/image/upload/`;
  if (!u.pathname.startsWith(prefix)) return false;
  // …/image/upload/v1234567890/deltaway/travelers/<id>.jpg
  return new RegExp(`^(v\\d+/)?${publicId.replace(/[-/]/g, "\\$&")}\\.(jpe?g|png|webp)$`).test(u.pathname.slice(prefix.length)) && publicId.startsWith(FOLDER);
}

const publicSelect = {
  id: true,
  url: true,
  caption: true,
  creditName: true,
  placeName: true,
  place: { select: { name: true, slug: true } },
} as const;

/** Approved photos for a district page (newest first). */
export const approvedPhotosForDistrict = (districtId: string, take = 12) =>
  db.travelerPhoto.findMany({ where: { districtId, status: "APPROVED" }, orderBy: { reviewedAt: "desc" }, take, select: publicSelect });

/** Approved photos for one place's page. */
export const approvedPhotosForPlace = (placeId: string, take = 12) =>
  db.travelerPhoto.findMany({ where: { placeId, status: "APPROVED" }, orderBy: { reviewedAt: "desc" }, take, select: publicSelect });

/**
 * Take a traveler's photo off the site completely: wherever the team used it
 * (a place's or district's main photo, a gallery), its credit, the row and
 * the file itself.
 */
export async function removeTravelerPhoto(photo: { id: string; url: string; publicId: string }): Promise<void> {
  const inGalleries = await db.districtPlace.findMany({ where: { gallery: { has: photo.url } }, select: { id: true, gallery: true } });
  await db.$transaction([
    db.districtPlace.updateMany({ where: { photo: photo.url }, data: { photo: null } }),
    db.district.updateMany({ where: { photo: photo.url }, data: { photo: null } }),
    ...inGalleries.map((p) => db.districtPlace.update({ where: { id: p.id }, data: { gallery: p.gallery.filter((u) => u !== photo.url) } })),
    db.imageCredit.deleteMany({ where: { url: photo.url } }),
    db.travelerPhoto.deleteMany({ where: { id: photo.id } }),
  ]);
  await destroyUpload(photo.publicId);
}
