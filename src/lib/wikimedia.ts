// Picking free-licence photos from Wikimedia Commons. Pure functions (no
// network, no database), so they can be tested; the script in
// prisma/photos-wikimedia.ts does the fetching and saving.

export type CommonsPage = {
  title: string;
  index?: number;
  imageinfo?: {
    thumburl?: string;
    thumbwidth?: number;
    thumbheight?: number;
    url?: string;
    descriptionurl?: string;
    width?: number;
    height?: number;
    mime?: string;
    extmetadata?: Record<string, { value?: string } | undefined>;
  }[];
};

export type PickedPhoto = {
  url: string; // 1600px-wide thumbnail on upload.wikimedia.org
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  sourceUrl: string;
  caption: string | null;
};

// Licences we can use with attribution on a commercial site. Commons doesn't
// accept non-commercial or no-derivatives licences, but check anyway.
const OK_LICENSE = /^(cc[ -]by(-sa)?[ -]\d(\.\d)?.*|cc0.*|public domain.*|pd.*)$/i;
const BAD_LICENSE = /\b(nc|nd|non-?commercial|no-?deriv)/i;
// Not a photo of the place
const BAD_TITLE = /\b(map|maps|locator|logo|flag|emblem|seal|diagram|chart|plan|stamp|coin|banknote|poster|banner|screenshot|svg|drawing|painting|illustration)\b/i;

/** "<a href=...>Jane Doe</a>" → "Jane Doe" */
export function stripHtml(html: string | undefined): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The search results of one Commons API call → the usable photos, best first. */
export function pickPhotos(pages: CommonsPage[], max: number): PickedPhoto[] {
  const out: PickedPhoto[] = [];
  const sorted = [...pages].sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  for (const p of sorted) {
    const info = p.imageinfo?.[0];
    if (!info?.thumburl || !info.descriptionurl) continue;
    if (info.mime !== "image/jpeg") continue;
    const w = info.width ?? 0;
    const h = info.height ?? 1;
    // Big enough, and landscape (wide hero images and gallery tiles)
    if (w < 1600 || w / h < 1.25 || w / h > 2.4) continue;
    if (BAD_TITLE.test(p.title)) continue;
    const meta = info.extmetadata ?? {};
    const license = stripHtml(meta.LicenseShortName?.value);
    if (!license || !OK_LICENSE.test(license) || BAD_LICENSE.test(license)) continue;
    const author = stripHtml(meta.Artist?.value) || stripHtml(meta.Credit?.value);
    // CC licences need a named author; skip files where we can't credit anyone
    if (!author && !/^(public domain|pd|cc0)/i.test(license)) continue;
    const caption = stripHtml(meta.ImageDescription?.value || meta.ObjectName?.value).slice(0, 140) || null;
    if (out.some((x) => x.url === info.thumburl)) continue;
    out.push({
      url: info.thumburl,
      title: p.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, ""),
      author: (author || "Unknown author").slice(0, 200),
      license,
      licenseUrl: stripHtml(meta.LicenseUrl?.value) || null,
      sourceUrl: info.descriptionurl,
      caption,
    });
    if (out.length >= max) break;
  }
  return out;
}

/** Commons API search URL for photos matching a query. */
export function commonsSearchUrl(query: string): string {
  const q = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "40",
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1600",
    iiextmetadatafilter: "Artist|Credit|LicenseShortName|LicenseUrl|ImageDescription|ObjectName",
    origin: "*",
  });
  return `https://commons.wikimedia.org/w/api.php?${q}`;
}
