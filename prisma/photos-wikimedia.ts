// Fetch real, free-licence photos of each destination from Wikimedia Commons,
// with author and licence credits.
//
//   npm run photos:wikimedia -- --dry-run   # show what it would pick
//   npm run photos:wikimedia                # save them
//   npm run photos:wikimedia -- --replace   # also replace photos you set yourself
//   npm run photos:wikimedia -- --districts # only the 64 district photos
//   npm run photos:wikimedia -- --places    # only the places to visit in each district
//   npm run photos:wikimedia -- --redo=coxs-bazar-beach   # pick new photos for one destination
//
// Run it on a computer with internet access. Destinations whose main photo is
// still an Unsplash placeholder get a Commons photo; every destination gets up
// to 4 extra gallery photos. Tours still on a placeholder take the photo of
// their first destination. Each of the 64 districts and every place to visit
// without a photo gets one (the places take a few minutes).
// Remove any photo you don't like in the admin.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cleanImageUrl, commonsSearchUrl, pickPhotos, type CommonsPage, type PickedPhoto } from "../src/lib/wikimedia";
import { DISTRICTS } from "../src/lib/districts-data";
import { DISTRICT_PLACES } from "../src/lib/places-data";
import { slugify } from "../src/lib/slug";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const DRY = process.argv.includes("--dry-run");
const REPLACE = process.argv.includes("--replace");
const ONLY_DISTRICTS = process.argv.includes("--districts");
const ONLY_PLACES = process.argv.includes("--places");
const REDO = process.argv.find((a) => a.startsWith("--redo="))?.slice("--redo=".length);
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

async function searchOnce(query: string): Promise<CommonsPage[]> {
  const res = await fetch(commonsSearchUrl(query), { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Commons said ${res.status} for "${query}"`);
  const json = (await res.json()) as { query?: { pages?: CommonsPage[] } };
  return (json.query?.pages ?? []).sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
}

/**
 * Photos that Commons reviewers have rated (featured, quality or valued
 * images) come first: they are well composed and sharp. The ordinary search
 * results follow.
 */
async function search(query: string): Promise<CommonsPage[]> {
  const rated = await searchOnce(`${query} haswbstatement:P6731`).catch(() => []);
  await sleep(400);
  const rest = await searchOnce(query);
  const seen = new Set<string>();
  return [...rated, ...rest].filter((p) => !seen.has(p.title) && seen.add(p.title)).map((p, i) => ({ ...p, index: i + 1 }));
}

async function photosFor(slug: string, name: string): Promise<PickedPhoto[]> {
  const queries = QUERIES[slug] ?? [`${name} Bangladesh`];
  const found: PickedPhoto[] = [];
  for (const q of queries) {
    const pages = await search(q);
    for (const p of pickPhotos(pages, 8, q)) if (!found.some((f) => f.url === p.url)) found.push(p);
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
  for (const x of await db.district.findMany({ select: { id: true, photo: true } })) {
    if (x.photo && tidy(x.photo) !== x.photo) {
      await db.district.update({ where: { id: x.id }, data: { photo: tidy(x.photo) } });
      n++;
    }
  }
  for (const x of await db.districtPlace.findMany({ select: { id: true, photo: true } })) {
    if (x.photo && tidy(x.photo) !== x.photo) {
      await db.districtPlace.update({ where: { id: x.id }, data: { photo: tidy(x.photo) } });
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

/** One main photo per district (the 64 districts). */
async function districtPhotos() {
  const districts = await db.district.findMany({
    orderBy: { name: "asc" },
    include: { destinations: { select: { featuredImage: true }, orderBy: { isFeatured: "desc" } } },
  });
  let n = 0;
  console.log("\n🗺  District photos\n");
  for (const d of districts) {
    if (d.photo && !REPLACE) continue;
    const queries = DISTRICTS.find((x) => x.slug === d.slug)?.photoQueries ?? [`${d.name} Bangladesh`];
    let pick: PickedPhoto | undefined;
    try {
      for (const q of queries) {
        pick = pickPhotos(await search(q), 1, q)[0];
        await sleep(1000);
        if (pick) break;
      }
    } catch (e) {
      console.log(`  ⚠  ${d.name}: ${(e as Error).message}`);
      continue;
    }
    // Nothing on Commons? Use the photo of a place we feature there.
    const fallback = d.destinations.map((x) => x.featuredImage).find((u) => !isPlaceholder(u));
    if (!pick && !fallback) {
      console.log(`  –  ${d.name}: no suitable free photo found`);
      continue;
    }
    console.log(`  ✓  ${d.name}: ${pick ? `${pick.title} · ${pick.author} · ${pick.license}` : "uses its destination's photo"}`);
    if (DRY) continue;
    if (pick) await saveCredit(pick);
    await db.district.update({ where: { id: d.id }, data: { photo: pick?.url ?? fallback } });
    n++;
  }
  if (!DRY) console.log(`\n✅ ${n} district photos saved.`);
}

/** One photo per place to visit (sights, markets, food…). */
async function placePhotos() {
  const places = await db.districtPlace.findMany({
    where: REPLACE ? {} : { photo: null },
    orderBy: [{ district: { name: "asc" } }, { order: "asc" }],
    include: { district: { select: { slug: true, name: true } } },
  });
  console.log(`\n📍 Places to visit: ${places.length} need a photo\n`);
  let n = 0;
  for (const pl of places) {
    const seed = DISTRICT_PLACES[pl.district.slug]?.find((x) => slugify(x.name) === pl.slug);
    const queries = [seed?.photoQuery, `${pl.name} ${pl.district.name}`, pl.name].filter((q, i, a): q is string => !!q && a.indexOf(q) === i);
    let pick: PickedPhoto | undefined;
    try {
      for (const q of queries) {
        pick = pickPhotos(await search(q), 1, q)[0];
        await sleep(800);
        if (pick) break;
      }
    } catch (e) {
      console.log(`  ⚠  ${pl.district.name} · ${pl.name}: ${(e as Error).message}`);
      continue;
    }
    if (!pick) {
      console.log(`  –  ${pl.district.name} · ${pl.name}: no free photo found`);
      continue;
    }
    console.log(`  ✓  ${pl.district.name} · ${pl.name}: ${pick.title}`);
    if (DRY) continue;
    await saveCredit(pick);
    await db.districtPlace.update({ where: { id: pl.id }, data: { photo: pick.url } });
    n++;
  }
  if (!DRY) console.log(`\n✅ ${n} place photos saved. Swap any you don't like in /admin/districts.`);
}

async function main() {
  console.log(DRY ? "🔎 Dry run: nothing will be saved.\n" : "📷 Fetching photos from Wikimedia Commons…\n");
  if (!DRY) await tidySavedUrls();
  if (ONLY_DISTRICTS) return districtPhotos();
  if (ONLY_PLACES) return placePhotos();
  const destinations = await db.destination.findMany({
    where: REDO ? { slug: REDO } : {},
    include: { images: true },
    orderBy: { name: "asc" },
  });
  if (REDO && destinations.length === 0) {
    console.log(`No destination with the slug "${REDO}". The slug is the last part of its page address.`);
    return;
  }
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
    if (REDO) {
      // Start again for this destination: new main photo, new gallery
      await db.destinationImage.deleteMany({ where: { destinationId: d.id } });
      d.images = [];
    }
    if (REDO || REPLACE || isPlaceholder(d.featuredImage)) {
      const [hero, ...others] = picks;
      await saveCredit(hero);
      await db.destination.update({ where: { id: d.id }, data: { featuredImage: hero.url } });
      // Tours that showed the old photo follow it
      await db.tourPackage.updateMany({ where: { featuredImage: d.featuredImage }, data: { featuredImage: hero.url } });
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

  if (REDO) return;
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
  await districtPhotos();
  await placePhotos();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
