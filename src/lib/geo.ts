/** Dhaka, where almost every visitor's trip starts. */
export const DHAKA = { latitude: 23.8103, longitude: 90.4125 };

const R = 6371; // km
const rad = (d: number) => (d * Math.PI) / 180;

/**
 * Straight-line distance in km. Roads here wind a lot, so this is only ever
 * shown as an approximation — the real travel time goes in `travelTime`,
 * which a human fills in.
 */
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rounded to the nearest 10 km above 100, nearest 5 below — no false precision. */
export function roughKm(km: number) {
  return km >= 100 ? Math.round(km / 10) * 10 : Math.round(km / 5) * 5;
}
