import { CHATTOGRAM_PLACES } from "./chattogram";
import { DHAKA_PLACES } from "./dhaka";
import { NORTH_PLACES } from "./north";
import { SYLHET_KHULNA_BARISHAL_PLACES } from "./sylhet-khulna-barishal";
import { DHAKA_DETAILS } from "./details-dhaka";
import { CHATTOGRAM_DETAILS } from "./details-chattogram";
import { SYLHET_KHULNA_BARISHAL_DETAILS } from "./details-sylhet-khulna-barishal";
import { NORTH_DETAILS } from "./details-north";
import type { PlaceDetails, PlaceSeed } from "./types";

export { PLACE_KINDS, type PlaceDetails, type PlaceKind, type PlaceSeed } from "./types";

/** Places to visit, keyed by district slug. */
export const DISTRICT_PLACES: Record<string, PlaceSeed[]> = {
  ...DHAKA_PLACES,
  ...CHATTOGRAM_PLACES,
  ...SYLHET_KHULNA_BARISHAL_PLACES,
  ...NORTH_PLACES,
};

/** The longer write-ups, keyed by district slug and then by place name. */
export const PLACE_DETAILS: Record<string, Record<string, PlaceDetails>> = {
  ...DHAKA_DETAILS,
  ...CHATTOGRAM_DETAILS,
  ...SYLHET_KHULNA_BARISHAL_DETAILS,
  ...NORTH_DETAILS,
};
