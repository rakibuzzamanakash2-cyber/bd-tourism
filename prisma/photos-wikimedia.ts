// Fetch real, free-licence photos of each destination from Wikimedia Commons,
// with author and licence credits.
//
//   npm run photos:wikimedia -- --dry-run   # show what it would pick
//   npm run photos:wikimedia                # save them
//   npm run photos:wikimedia -- --replace   # also replace photos you set yourself
//
// Run it on a computer with internet access. Destinations whose main photo is
// still an Unsplash placeholder get a Commons photo; every destination gets up
// to 4 extra gallery photos. Tours still on a placeholder take the photo of
// their first destination. Remove any photo you don't like in the admin.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cleanImageUrl, commonsSearchUrl, pickPhotos, type CommonsPage, type PickedPhoto } from "../src/lib/wikimedia";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const DRY = process.argv.includes("--dry-run");
const REPLACE = process.argv.includes("--replace");
const GALLERY_MAX = 6;
// Wikimedia asks automated clients to say who they are
const USER_AGENT = "DeltaWayPhotoBot/1.0 (+https://github.com/rakibuzzamanakash2-cyber/bd-tourism)";

// Better search terms than the display name, for places Commons names differently
const QUERIES: Record<string, string[]> = {
  "coxs-bazar-beach": ["Cox's Bazar beach"],
  "saint-martin-island": ["Saint Martin's Island Bangladesh", "St. Martin's Island"],
  "sundarbans-mangrove": ["Sundarbans Bangladesh", "Sundarbans mangrove"],
  "sajek-valley": ["Sajek valley", "Sajek Rangamati"],
  "bandarban-nilgiri": ["Nilgiri Bandarban", "Bandarban hills"],
  "srimangal-tea-gardens": ["Sreemangal tea garden", "Srimangal tea"],
  sonargaon: ["Panam Nagar Sonargaon", "Sonargaon"],
  "paharpur-vihara": ["Somapura Mahavihara", "Paharpur Buddhist Vihara"],
  "ratargul-swamp-forest": ["Ratargul swamp forest", "Ratargul"],
  "old-dhaka": ["Ahsan Manzil", "Lalbagh Fort", "Old Dhaka"],
  "bagerhat-sixty-dome-mosque": ["Sixty Dome Mosque Bagerhat", "Shat Gombuj Mosque"],
  "kuakata-beach": ["Kuakata sea beach", "Kuakata"],
  "rangamati-kaptai-lake": ["Kaptai Lake Rangamati", "Rangamati hanging bridge"],
  jaflong: ["Jaflong", "Piyain river Jaflong"],
  "tanguar-haor": ["Tanguar Haor", "Tanguar haor Sunamganj"],
  mahasthangarh: ["Mahasthangarh", "Mahasthan Bogra"],
};

const isPlaceholder = (url: string) => new URL(url).hostname === "images.unsplash.com";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function search(query: string): Promise<CommonsPage[]> {
  const res = await fetch(commonsSearchUrl(query), { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Commons said ${res.status} for "${query}"`);
  const json = (await res.json()) as { query?: { pages?: CommonsPage[] } };
  return json.query?.pages ?? [];
}

async function photosFor(slug: string, name: string): Promise<PickedPhoto[]> {
  const queries = QUERIES[slug] ?? [`${name} Bangladesh`];
  const found: PickedPhoto[] = [];
  for (const q of queries) {
    const pages = await search(q);
    for (const p of pickPhotos(pages, 8)) if (!found.some((f) => f.url === p.url)) found.push(p);
    await sleep(1000); // be gentle with the API
    if (found.length >= GALLERY_MAX) break;
  }
  return found;
}

async function saveCredit(p: PickedPhoto) {
  await db.imageCredit.upsert({
    where: { url: p.url },
    update: { author: p.author, license: p.license, licenseUrl: p.licenseUrl, sourceUrl: p.sourceUrl, title: p.title },
    create: { url: p.url, author: p.author, license: p.license, licenseUrl: p.licenseUrl, sourceUrl: p.sourceUrl, title: p.title },
  });
}

/** Photos saved by an earlier run may carry "?utm_source=…": remove it everywhere. */
async function tidySavedUrls() {
  const tidy = (u: string) => (u.includes("wikimedia.org") && u.includes("?") ? cleanImageUrl(u) : u);
  let n = 0;
  for (const d of await db.destination.findMany({ select: { id: true, featuredImage: true } })) {
    if (tidy(d.featuredImage) !== d.featuredImage) {
      await db.destination.update({ where: { id: d.id }, data: { featuredImage: tidy(d.featuredImage) } });
      n++;
    }
  }
  for (const t of await db.tourPackage.findMany({ select: { id: true, featuredImage: true } })) {
    if (tidy(t.featuredImage) !== t.featuredImage) {
      await db.tourPackage.update({ where: { id: t.id }, data: { featuredImage: tidy(t.featuredImage) } });
      n++;
    }
  }
  for (const i of await db.destinationImage.findMany({ select: { id: true, url: true } })) {
    if (tidy(i.url) !== i.url) {
      await db.destinationImage.update({ where: { id: i.id }, data: { url: tidy(i.url) } });
      n++;
    }
  }
  for (const c of await db.imageCredit.findMany({ select: { id: true, url: true } })) {
    const clean = tidy(c.url);
    if (clean === c.url) continue;
    // Keep one credit per photo
    if (await db.imageCredit.findUnique({ where: { url: clean } })) await db.imageCredit.delete({ where: { id: c.id } });
    else await db.imageCredit.update({ where: { id: c.id }, data: { url: clean } });
    n++;
  }
  if (n) console.log(`🧹 Tidied ${n} saved photo links.\n`);
}

async function main() {
  console.log(DRY ? "🔎 Dry run: nothing will be saved.\n" : "📷 Fetching photos from Wikimedia Commons…\n");
  if (!DRY) await tidySavedUrls();
  const destinations = await db.destination.findMany({ include: { images: true }, orderBy: { name: "asc" } });
  let featured = 0;
  let gallery = 0;

  for (const d of destinations) {
    let picks: PickedPhoto[];
    try {
      picks = await photosFor(d.slug, d.name);
    } catch (e) {
      console.log(`  ⚠  ${d.name}: ${(e as Error).message}`);
      continue;
    }
    if (picks.length === 0) {
      console.log(`  –  ${d.name}: no suitable free photos found`);
      continue;
    }
    console.log(`  ✓  ${d.name}: ${picks.length} photos`);
    for (const p of picks) console.log(`       ${p.title} · ${p.author} · ${p.license}`);
    if (DRY) continue;

    let rest = picks;
    if (REPLACE || isPlaceholder(d.featuredImage)) {
      const [hero, ...others] = picks;
      await saveCredit(hero);
      await db.destination.update({ where: { id: d.id }, data: { featuredImage: hero.url } });
      featured++;
      rest = others;
    }
    const have = new Set(d.images.map((i) => i.url));
    let order = d.images.length;
    for (const p of rest) {
      if (order >= GALLERY_MAX) break;
      if (have.has(p.url)) continue;
      await saveCredit(p);
      await db.destinationImage.create({ data: { destinationId: d.id, url: p.url, caption: p.caption ?? p.title, order: order++ } });
      gallery++;
    }
  }

  if (!DRY) {
    // Tours still on a placeholder take the photo of their first destination
    const tours = await db.tourPackage.findMany({
      include: { itinerary: { orderBy: { dayNumber: "asc" }, include: { destination: { select: { featuredImage: true } } } } },
    });
    for (const t of tours) {
      if (!REPLACE && !isPlaceholder(t.featuredImage)) continue;
      const photo = t.itinerary.map((day) => day.destination?.featuredImage).find((u) => u && !isPlaceholder(u));
      if (photo) {
        await db.tourPackage.update({ where: { id: t.id }, data: { featuredImage: photo } });
        console.log(`  ✓  Tour "${t.title}" now uses its destination's photo`);
      }
    }
    console.log(`\n✅ Done: ${featured} main photos and ${gallery} gallery photos, all with credits (see /credits).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
