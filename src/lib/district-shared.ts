// District helpers that are safe on both server and client.
import { DIVISIONS, type DivisionSlug } from "@/lib/districts-data";

export const divisionName = (slug: string) => DIVISIONS.find((d) => d.slug === slug)?.name ?? slug;
export const divisionNameBn = (slug: string) => DIVISIONS.find((d) => d.slug === slug)?.nameBn ?? slug;
export const isDivision = (slug: string | undefined): slug is DivisionSlug => DIVISIONS.some((d) => d.slug === slug);

type Point = { latitude: number; longitude: number };

/** Straight-line distance in km between two district towns. */
export function distanceKm(a: Point, b: Point): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough road distance: roads and ferries wind, so ~1.35× the straight line. */
export const roadKm = (a: Point, b: Point) => Math.round(distanceKm(a, b) * 1.35);
