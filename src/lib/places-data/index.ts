import { CHATTOGRAM_PLACES } from "./chattogram";
import { DHAKA_PLACES } from "./dhaka";
import { NORTH_PLACES } from "./north";
import { SYLHET_KHULNA_BARISHAL_PLACES } from "./sylhet-khulna-barishal";
import type { PlaceSeed } from "./types";

export { PLACE_KINDS, type PlaceKind, type PlaceSeed } from "./types";

/** Places to visit, keyed by district slug. */
export const DISTRICT_PLACES: Record<string, PlaceSeed[]> = {
  ...DHAKA_PLACES,
  ...CHATTOGRAM_PLACES,
  ...SYLHET_KHULNA_BARISHAL_PLACES,
  ...NORTH_PLACES,
};
