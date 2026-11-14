// Rules for photos travelers share, used by the form and the server.
export const MAX_PHOTOS_PER_SUBMISSION = 8;
export const MAX_PENDING_PER_USER = 40;
export const CAPTION_MIN = 5;
export const CAPTION_MAX = 500;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** "Anna Müller" → "Anna M." (the default name shown under a photo). */
export function defaultCreditName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export const TRAVELER_PHOTO_STATUS_LABEL: Record<string, string> = {
  PENDING: "Waiting for review",
  APPROVED: "On the site",
  REJECTED: "Not used",
};
