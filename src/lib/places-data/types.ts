// Places to visit in each district: sights, nature, religious places,
// markets and crafts, local food and experiences. The seed copies these into
// the DistrictPlace table; photos come from `npm run photos:wikimedia`.

export const PLACE_KINDS = [
  { value: "SIGHT", label: "Sights & history" },
  { value: "NATURE", label: "Nature" },
  { value: "RELIGIOUS", label: "Mosques, temples & shrines" },
  { value: "MARKET", label: "Markets & crafts" },
  { value: "FOOD", label: "Local food" },
  { value: "EXPERIENCE", label: "Experiences" },
] as const;

export type PlaceKind = (typeof PLACE_KINDS)[number]["value"];

export type PlaceSeed = {
  name: string;
  kind: PlaceKind;
  description: string;
  tip?: string;
  /** Wikimedia Commons search term, if the name alone won't find it */
  photoQuery?: string;
};

/** Short builder so the data files stay readable. */
export const p = (name: string, kind: PlaceKind, description: string, tip?: string, photoQuery?: string): PlaceSeed => ({
  name,
  kind,
  description,
  ...(tip ? { tip } : {}),
  ...(photoQuery ? { photoQuery } : {}),
});
