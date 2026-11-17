/**
 * Seeds the journal with a first article.
 *
 * It is created as a DRAFT on purpose. The permit rules below were written
 * from the hill districts' own foreigner portals and from Bangladeshi news
 * reporting, but they change, and whoever runs DeltaWay knows the current
 * process better than any website does. Read it, correct it, then publish.
 *
 * Safe to run more than once: it updates the article in place by slug and
 * never changes whether it is published.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { parseBodyText } from "../src/lib/articles";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const articles = [
  {
    slug: "chittagong-hill-tracts-permit",
    title: "Do you need a permit for the Chittagong Hill Tracts?",
    excerpt:
      "If you hold a foreign passport: yes, for Bandarban, Rangamati and Khagrachhari. Here is who grants it, what they ask for, and why the answer changes from month to month.",
    districtSlug: "bandarban",
    body: `Bangladesh lets most visitors travel freely. The three hill districts in the south-east are the exception, and the rules there are specific enough to ruin a trip if you find out about them at a checkpoint.

## The short answer
If you hold a foreign passport, you need permission to visit Bandarban, Rangamati or Khagrachhari. You do not need it for Chittagong city or the rest of Chittagong division, which is a common and expensive mix-up.
Bangladeshi citizens do not need the same permission, though some routes require registering at a checkpoint.

## Who grants it
This is where published advice disagrees, because more than one office can issue it.
Rangamati's own portal for foreign visitors says applications go to the Deputy Commissioner of the district, the Ministry of Home Affairs, or the Ministry of Foreign Affairs. Bandarban has run an online system where a registered guide applies on the traveller's behalf, with the application passing to the police special branch for verification before the district office issues the permit.
In practice almost every visitor goes through a registered tour operator, because the operator knows which office is issuing permits that month and what the current paperwork looks like.

## What they ask for
The districts publish broadly the same list:
- A scan of your passport
- A passport-size colour photograph
- Your signature
- A detailed itinerary, which you are then expected to keep to
Rangamati's guidance also notes that prior approval from the Deputy Commissioner is needed for any meeting with the indigenous communities who live there, and that visitors keep in touch with the local administration while moving around the district.

## How long it takes
Bandarban's online system has been described as issuing a permit within about five days of application. Older reporting from when the rules were tightened described a month's notice to the Home Ministry.
Treat anything you read, including this page, as the shape of the process rather than a promise. Give it several weeks if you can.

## Why the answer keeps changing
The hill districts open and close routes in response to local security. Ruma and Thanchi in Bandarban were closed to tourists from March 2023 after a security operation, and reopened more than a year later by a public notice from the district administration.
That is the real reason not to plan a hill trip from a blog post. A route that was open last season may not be open in yours.

## What we do about it
We apply for the permit as part of your trip, using the passport details you give us when you book, and we confirm which routes are actually open for your dates before we promise you an itinerary. If a route closes between booking and travel, we change the plan rather than letting you find out at a checkpoint.
One thing we cannot change: Rangamati's published conditions state that Israeli citizens cannot apply.`,
  },
];

async function main() {
  for (const a of articles) {
    const district = a.districtSlug
      ? await db.district.findUnique({ where: { slug: a.districtSlug }, select: { id: true } })
      : null;
    const body = parseBodyText(a.body);
    const existing = await db.article.findUnique({ where: { slug: a.slug }, select: { id: true } });

    await db.article.upsert({
      where: { slug: a.slug },
      create: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        body,
        districtId: district?.id ?? null,
        isPublished: false,
      },
      // Never flip a published article back to a draft, and never overwrite
      // edits to the published date.
      update: { title: a.title, excerpt: a.excerpt, body, districtId: district?.id ?? null },
    });
    console.log(`${existing ? "updated" : "created"}: ${a.slug} (${body.length} sections)`);
  }
  console.log("\nThese are drafts. Read them in Admin > Journal, correct anything wrong, then tick “Live on the site”.");
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
