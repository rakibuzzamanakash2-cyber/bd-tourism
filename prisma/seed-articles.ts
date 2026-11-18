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

const articles: { slug: string; title: string; excerpt: string; districtSlug: string | null; body: string }[] = [
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
  {
    slug: "when-to-visit-bangladesh",
    title: "When to come to Bangladesh",
    excerpt:
      "Almost everyone will tell you November to February, and for most of the country they are right. But the monsoon is the best time to see some of the best things here, and nobody mentions that.",
    districtSlug: null,
    body: `Bangladesh has three seasons rather than four, and which one you pick changes the trip more than where you go.

## The short answer
Come between November and February. The air is dry, the days are sunny, daytime temperatures sit in the twenties, and every part of the country is reachable. Cox's Bazar, the Sundarbans and the hill districts are all at their easiest.
If those months do not work, October and March are the shoulders and still good. April and May are hot and heavy. June to September is the monsoon.

## Winter, November to February
This is the dry season and the reason most people come now. Expect warm, clear days and genuinely cool mornings in the north. Humidity drops away, which matters more than the temperature does — the same 28 degrees feels very different in January than in May.
It is also peak season. Hotels in Cox's Bazar and Srimangal fill up, especially around Bengali holidays, so book earlier than you think you need to.

## Hot season, March to May
April and May are the hottest months of the year, with afternoons above thirty and humidity climbing ahead of the rains. It is not unbearable, but walking around Old Dhaka at two in the afternoon in May is a different experience from doing it in January.
The upside is price. This is the cheapest time to travel here, and the places that are shoulder to shoulder in December are quiet.

## Monsoon, June to October
The rains arrive from the south-east around late May or early June and the country turns a green you will not see at any other time of year. Rainfall through these months is heavy — well over a metre across the season.
Here is the part most guides skip: the monsoon is not a season to avoid. It is the season for the wetlands. Ratargul, the freshwater swamp forest near Sylhet, is only properly a swamp forest when the water is high; in winter you walk through it, in monsoon you row through it. The haors, the vast seasonal wetlands of the north-east, are a landscape of water and tiny island villages in the rains and flat farmland in the dry months.
What you trade is certainty. Roads flood, ferries stop, and a day can disappear to weather. If your trip has to run to a fixed plan, come in winter. If you have slack in it, the monsoon rewards you.

## By place
- The Sundarbans: winter. The boats run, the weather is settled, and wildlife is easier to see.
- Cox's Bazar and the beaches: November to February.
- The hill districts: the dry months, when the roads are safest and permits are more straightforward.
- Sylhet's tea gardens: winter for walking, though the gardens are greenest after rain.
- Ratargul and the haors: the monsoon, which is the whole point of them.

## What we would tell a friend
If this is your only trip and you want everything to work, come in December or January.
If you have been before, or you care more about how a place looks than how easy it is, come in the rains and plan fewer things.

These are seasonal patterns, not forecasts. We check the actual conditions for your dates before confirming an itinerary, and we will tell you plainly if the month you have chosen is wrong for the places you want.`,
  },
  {
    slug: "dhaka-airport-to-the-city",
    title: "Landing at Dhaka airport, and getting out of it",
    excerpt:
      "The arrivals hall is calmer than its reputation. The pavement outside is not. Here is what the options actually are, what they cost, and the one decision worth making before you fly.",
    districtSlug: null,
    body: `Hazrat Shahjalal is about seventeen kilometres from the middle of Dhaka. On a good run that is forty minutes. In the wrong traffic it is two hours and more. Nothing else about your arrival matters as much as that.

## Inside the terminal
The arrivals hall itself is orderly. Only official vendors are allowed in — SIM cards, banks, currency exchange, car rental and taxi desks — so the crowd you may have read about is outside, not in here.
Two things are worth doing before you walk out. Buy a SIM at one of the counters, because every option below works better with data. And settle your transport while you are still inside, not on the pavement.

## The options

- A transfer booked before you fly. Someone is waiting with your name. It costs more than anything else here and it is the right answer for a first arrival, a late-night landing, or anyone travelling alone.
- Uber or Pathao. Both work at the airport and both quote the fare up front, which removes the argument. At the time of writing a ride to central Dhaka typically runs somewhere around 300 to 600 taka. The catch is the pickup: finding your driver in the crush outside takes patience, and numberplates are hard to read.
- The prepaid taxi counter. Near the exit of international arrivals. You pay a set fare at the desk and get a receipt, so there is nothing to negotiate. Slower and dearer than an app, but simple.
- A taxi off the rank. There is no published airport tariff and the meters are not reliable, so you agree the price before you get in. If you have just got off a long flight, this is the option most likely to go badly.
- Buses. They run past the airport along the Mymensingh highway. They are cheap, slow, very crowded, and not a serious proposition with luggage.

## About the train
You will read that there is a railway station just outside the airport, and you will also read that Dhaka has no rail link to the airport. Both are sort of true. There is a station on the commuter line nearby, but it is not an airport rail service in the sense you would expect, the timetable is limited, and it will not get you to most hotels.
Treat it as a curiosity rather than a plan.

## The one decision worth making early
If you land after dark, book the transfer. Dhaka traffic at night is easier but the arrival is harder: fewer people around, more pressure on the pavement, and no good moment to start comparing prices on your phone.

## Once you are in the city
Uber and Pathao are what most people use day to day. CNG auto-rickshaws — the green three-wheelers — are quicker for short hops and cheaper than a car, but you have to agree a price or insist on the meter, or the fare drifts up for a foreign face. The metro runs across the north of the city and is genuinely good, though it will not help you from the airport.

Fares and timetables here change faster than any article can keep up with. We arrange the airport pickup as part of every trip we run, so if you are travelling with us this is one thing you do not need to work out.`,
  },
  {
    slug: "bangladesh-solo-women-travellers",
    title: "Travelling Bangladesh alone as a woman",
    excerpt:
      "The honest answer is that safe and comfortable are two different questions here, and most of what you will read online only answers the first one.",
    districtSlug: null,
    body: `We get asked this more than any other question, and the reassuring answer you will find on most travel sites is not quite the truth. So here is ours.

## Two different questions
Is it safe? Violent crime against foreign visitors is rare in Bangladesh, and that holds for women travelling alone. Women have crossed this country by bus and train on their own and come away saying they never once felt in danger. That is a real and common experience, not a lucky exception.
Is it comfortable? Often, no. The two questions get mashed together online and they should not be.

## What the attention is actually like
You will be looked at. Not glanced at — looked at, steadily, by a lot of people, for a long time. Women travelling here describe men following them down the street to ask where they are from, crowds of thirty gathering around them, being filmed while eating, having a headscarf lifted so someone could see their hair.
Almost all of it is curiosity. Foreign visitors are genuinely rare here and a woman travelling without a husband is rarer still, so you are the most interesting thing on the street. Travellers who have been through it are nearly unanimous that it did not feel threatening. They are also unanimous that it is exhausting.
But not all of it is curiosity, and we are not going to pretend otherwise. Verbal harassment happens. So does the physical kind. Foreign governments warn about both in their travel advice for Bangladesh, and they are not wrong to.

## The number worth paying attention to
On the safety apps where women rate places, Bangladesh scores middling from visiting women — and noticeably lower from Bangladeshi women rating their own country.
That gap is the most useful thing on this page. Guests get hospitality, help and the benefit of the doubt. Local women navigate something harder. If you only read the visitor reviews you will get an incomplete picture of the place you are actually in.

## What actually helps

- Land in daylight. Everything about a first arrival is easier before dark.
- Sort your transport before you need it, not on the street. Settled in advance, never improvised at night.
- Dress modestly and loosely — long sleeves, nothing close-fitting. A scarf is useful to have, though you are not obliged to cover your hair. This is not about blame; it is about how much attention you want to field.
- Pick accommodation with women on staff. Travellers keep mentioning this and hotel listings never do. A hotel run entirely by men can be perfectly kind and still feel odd, because nobody there is sure how to deal with a woman arriving alone.
- Get dropped at the door. Not the end of the lane.
- Sit with other women. On buses and trains this is the norm, and women will make room for you.
- "Where is your husband?" is small talk, not a threat. Answer however you like. Plenty of travellers invent one for simplicity and feel no guilt about it.

## What this does not mean
It does not mean do not come. Women who have travelled Bangladesh alone are, as a group, strikingly positive about it — the tea invitations, the strangers who organise themselves into a rescue party when you look lost, the fact that almost nobody else has been where you are standing.
It means come with your eyes open, and do not let anyone — including a tour company — tell you it is effortless.

Travelling with a guide takes most of the friction out of this, which is the honest commercial note at the bottom of an honest page. It is not the only way to do it, and we would rather you came on your own terms than not at all.`,
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
