/**
 * The "before you go" fields on a district — shared by the public page, the
 * admin form and the admin list.
 *
 * Plain module, not a client one: the admin list is a server component and
 * needs to call practicalFilled() while rendering.
 */
export type PracticalField =
  | "travelTime" | "bestMonths" | "whereToStay" | "moneyNotes"
  | "connectivity" | "gettingThere" | "safetyNotes" | "permitNote";

export const PRACTICAL_FIELDS: { name: PracticalField; label: string; hint?: string; rows?: number }[] = [
  { name: "travelTime", label: "Getting here, in a few words", hint: "e.g. 6–7 hours by bus, or 50 min flight then 1 hour by road" },
  { name: "bestMonths", label: "Best months", hint: "Seeded with the dry season — change it for the haor districts, where the monsoon is the whole point" },
  { name: "whereToStay", label: "Where to stay", hint: "Which town or area to base yourself in" },
  { name: "moneyNotes", label: "Money", hint: "ATMs, whether cards work, how much cash to bring" },
  { name: "connectivity", label: "Phone and internet" },
  { name: "gettingThere", label: "How to get here, in full", rows: 4 },
  { name: "safetyNotes", label: "Worth knowing", rows: 2 },
  { name: "permitNote", label: "Permit note", hint: "Only shown when the district is flagged as needing a permit", rows: 2 },
];

/** How many of the eight are filled in, so the admin list can show what's left. */
export function practicalFilled(d: Partial<Record<PracticalField, string | null>>) {
  return PRACTICAL_FIELDS.filter((f) => (d[f.name] ?? "").trim() !== "").length;
}
