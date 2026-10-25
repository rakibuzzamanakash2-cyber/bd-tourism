// Hosts we accept photos from. Used by next.config.ts (image optimizer and
// Content-Security-Policy) and by the admin forms to validate pasted links.

export const IMAGE_HOSTS = [
  "images.unsplash.com",
  "images.pexels.com",
  "upload.wikimedia.org",
  "res.cloudinary.com",
  "lh3.googleusercontent.com", // Google profile pictures
] as const;

/** Hosts an admin may paste a photo link from (profile pictures excluded). */
export const CONTENT_IMAGE_HOSTS = IMAGE_HOSTS.filter((h) => h !== "lh3.googleusercontent.com");

export function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (CONTENT_IMAGE_HOSTS as readonly string[]).includes(url.hostname);
  } catch {
    return false;
  }
}
