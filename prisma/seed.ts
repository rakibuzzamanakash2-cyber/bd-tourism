import "dotenv/config";
import { PrismaClient, TourDuration } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DESTINATION_DISTRICT, DISTRICTS } from "../src/lib/districts-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================================
  // REGIONS
  // ============================================================
  const [chittagongHillTracts, sundarbans, sylhet, coxsBazar, dhakaRegion, rajshahi] =
    await Promise.all([
      db.region.upsert({
        where: { slug: "chittagong-hill-tracts" },
        update: {},
        create: {
          name: "Chittagong Hill Tracts",
          slug: "chittagong-hill-tracts",
          description:
            "A mountainous region in southeastern Bangladesh home to indigenous communities, rolling green hills, and dramatic viewpoints. Requires special permits for foreign visitors.",
          isRestricted: true,
          permitFeeBDT: 3000,
        },
      }),
      db.region.upsert({
        where: { slug: "sundarbans" },
        update: {},
        create: {
          name: "Sundarbans",
          slug: "sundarbans",
          description:
            "The largest mangrove forest in the world and a UNESCO World Heritage Site. Home to the Royal Bengal Tiger. Requires Forest Department permits.",
          isRestricted: true,
          permitFeeBDT: 3000,
        },
      }),
      db.region.upsert({
        where: { slug: "sylhet" },
        update: {},
        create: {
          name: "Sylhet",
          slug: "sylhet",
          description:
            "Tea gardens, rolling hills, and clear rivers in the northeastern corner of Bangladesh.",
          isRestricted: false,
        },
      }),
      db.region.upsert({
        where: { slug: "coxs-bazar" },
        update: {},
        create: {
          name: "Cox's Bazar",
          slug: "coxs-bazar",
          description:
            "Home to the world's longest natural sandy sea beach, stretching over 120 kilometers along the Bay of Bengal.",
          isRestricted: false,
        },
      }),
      db.region.upsert({
        where: { slug: "dhaka-region" },
        update: {},
        create: {
          name: "Dhaka Region",
          slug: "dhaka-region",
          description:
            "The capital and its surrounding historical sites, including ancient river ports and Mughal architecture.",
          isRestricted: false,
        },
      }),
      db.region.upsert({
        where: { slug: "rajshahi" },
        update: {},
        create: {
          name: "Rajshahi",
          slug: "rajshahi",
          description:
            "Historical and archaeological heart of Bangladesh, home to ancient Buddhist ruins and silk weaving traditions.",
          isRestricted: false,
        },
      }),
    ]);

  // ============================================================
  // CATEGORIES
  // ============================================================
  await Promise.all([
    db.category.upsert({
      where: { slug: "beaches" },
      update: {},
      create: { name: "Beaches", slug: "beaches", icon: "waves" },
    }),
    db.category.upsert({
      where: { slug: "hills" },
      update: {},
      create: { name: "Hills & Mountains", slug: "hills", icon: "mountain" },
    }),
    db.category.upsert({
      where: { slug: "historical" },
      update: {},
      create: { name: "Historical", slug: "historical", icon: "landmark" },
    }),
    db.category.upsert({
      where: { slug: "wildlife" },
      update: {},
      create: { name: "Wildlife", slug: "wildlife", icon: "leaf" },
    }),
    db.category.upsert({
      where: { slug: "cultural" },
      update: {},
      create: { name: "Cultural", slug: "cultural", icon: "users" },
    }),
    db.category.upsert({
      where: { slug: "rivers" },
      update: {},
      create: { name: "Rivers & Lakes", slug: "rivers", icon: "droplet" },
    }),
  ]);

  // ============================================================
  // DESTINATIONS
  // Using Unsplash URLs for now — swap for Cloudinary later
  // ============================================================
  const destinations = [
    {
      slug: "coxs-bazar-beach",
      name: "Cox's Bazar Beach",
      shortDesc: "The world's longest natural sandy sea beach — 120 km of unbroken coastline.",
      longDesc:
        "Cox's Bazar Beach stretches over 120 kilometers along the Bay of Bengal, making it the longest natural sandy sea beach in the world. Beyond its title, it's a lively hub with fresh seafood, boat rides, and dramatic sunsets. Ideal for beach walks, swimming, and paragliding.",
      latitude: 21.4272,
      longitude: 92.0058,
      featuredImage: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=1200",
      bestSeason: "November to March",
      averageBudget: "$$",
      regionId: coxsBazar.id,
      isFeatured: true,
      categorySlugs: ["beaches"],
    },
    {
      slug: "saint-martin-island",
      name: "Saint Martin's Island",
      shortDesc: "Bangladesh's only coral island — turquoise water, coconut palms, and quiet nights.",
      longDesc:
        "A tiny coral island in the northeast Bay of Bengal, Saint Martin's is fringed by turquoise water and coral reefs. It's a paradise for snorkeling, seafood, and slow days. Reachable by ferry from Teknaf during peak season.",
      latitude: 20.6274,
      longitude: 92.3235,
      featuredImage: "https://images.unsplash.com/photo-1559196050-a4b8ad2fc02b?w=1200",
      bestSeason: "November to February",
      averageBudget: "$$",
      regionId: coxsBazar.id,
      isFeatured: true,
      categorySlugs: ["beaches"],
    },
    {
      slug: "sundarbans-mangrove",
      name: "Sundarbans National Park",
      shortDesc: "The world's largest mangrove forest and home of the Royal Bengal Tiger.",
      longDesc:
        "A UNESCO World Heritage Site, the Sundarbans is a labyrinth of tidal waterways, mudflats, and mangrove islands. Boat safaris offer chances to see spotted deer, crocodiles, dolphins, and — if you're lucky — the elusive Royal Bengal Tiger. Requires Forest Department permits and an authorized guide.",
      latitude: 21.9497,
      longitude: 89.1833,
      featuredImage: "https://images.unsplash.com/photo-1602800458591-eddda28a498b?w=1200",
      bestSeason: "October to March",
      averageBudget: "$$$",
      regionId: sundarbans.id,
      isFeatured: true,
      categorySlugs: ["wildlife", "rivers"],
    },
    {
      slug: "sajek-valley",
      name: "Sajek Valley",
      shortDesc: "Cloud-covered hilltops in Rangamati — often called the queen of hills.",
      longDesc:
        "Perched high in Rangamati district, Sajek Valley is famous for its sea of clouds at sunrise and its indigenous Lushai and Tripura villages. Restricted access requires permits; the road journey itself is an adventure through pine-covered hills.",
      latitude: 23.3833,
      longitude: 92.2833,
      featuredImage: "https://images.unsplash.com/photo-1543039717-b9f3caebe83b?w=1200",
      bestSeason: "October to March",
      averageBudget: "$$",
      regionId: chittagongHillTracts.id,
      isFeatured: true,
      categorySlugs: ["hills"],
    },
    {
      slug: "bandarban-nilgiri",
      name: "Nilgiri Hills, Bandarban",
      shortDesc: "One of Bangladesh's highest peaks — a sea of clouds and misty pine forests.",
      longDesc:
        "Nilgiri sits over 2,200 feet above sea level in Bandarban district. On clear mornings, guests wake above a rolling ocean of clouds. Managed by the Bangladesh Army, the hilltop resort requires advance booking and a permit.",
      latitude: 21.7833,
      longitude: 92.4333,
      featuredImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200",
      bestSeason: "November to February",
      averageBudget: "$$",
      regionId: chittagongHillTracts.id,
      categorySlugs: ["hills"],
    },
    {
      slug: "srimangal-tea-gardens",
      name: "Srimangal Tea Gardens",
      shortDesc: "The tea capital of Bangladesh — endless green rows and seven-layer tea.",
      longDesc:
        "Srimangal is Bangladesh's tea heartland, blanketed in emerald tea gardens, rubber plantations, and pineapple groves. Don't miss the famous seven-layer tea and a walk through Lawachara rainforest to spot hoolock gibbons.",
      latitude: 24.3065,
      longitude: 91.7296,
      featuredImage: "https://images.unsplash.com/photo-1524350876685-274059332603?w=1200",
      bestSeason: "November to March",
      averageBudget: "$$",
      regionId: sylhet.id,
      isFeatured: true,
      categorySlugs: ["hills", "cultural"],
    },
    {
      slug: "sonargaon",
      name: "Sonargaon Old City",
      shortDesc: "The ancient capital of Bengal — abandoned mansions and old Mughal streets.",
      longDesc:
        "Once the medieval capital of Bengal, Sonargaon's Panam City is a hauntingly beautiful stretch of abandoned 19th-century mansions. The nearby Folk Art Museum is one of the best in the country.",
      latitude: 23.6489,
      longitude: 90.6011,
      featuredImage: "https://images.unsplash.com/photo-1590523278191-995cbcda646b?w=1200",
      bestSeason: "October to March",
      averageBudget: "$",
      regionId: dhakaRegion.id,
      categorySlugs: ["historical", "cultural"],
    },
    {
      slug: "paharpur-vihara",
      name: "Somapura Mahavihara, Paharpur",
      shortDesc: "8th-century Buddhist monastery — a UNESCO World Heritage Site.",
      longDesc:
        "The vast ruins of Somapura Mahavihara in Paharpur are among the largest Buddhist monasteries south of the Himalayas. Built in the 8th century, this UNESCO site sprawls across 27 acres and offers a quiet, contemplative half-day visit.",
      latitude: 25.0316,
      longitude: 88.9784,
      featuredImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200",
      bestSeason: "November to February",
      averageBudget: "$",
      regionId: rajshahi.id,
      categorySlugs: ["historical"],
    },
    {
      slug: "ratargul-swamp-forest",
      name: "Ratargul Swamp Forest",
      shortDesc: "Bangladesh's only freshwater swamp forest — silent boat rides through submerged trees.",
      longDesc:
        "The only freshwater swamp forest in Bangladesh, Ratargul is best visited during monsoon when narrow wooden boats glide silently between half-submerged trees. Home to snakes, kingfishers, and monkeys.",
      latitude: 25.0000,
      longitude: 91.9500,
      featuredImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200",
      bestSeason: "June to September",
      averageBudget: "$",
      regionId: sylhet.id,
      categorySlugs: ["wildlife", "rivers"],
    },
    {
      slug: "old-dhaka",
      name: "Old Dhaka",
      shortDesc: "Mughal alleys, Lalbagh Fort, and the food capital of the country.",
      longDesc:
        "Wander the narrow lanes of Old Dhaka past Lalbagh Fort, Ahsan Manzil (the Pink Palace), Star Mosque, and the chaotic Sadarghat river port. Come hungry — this is arguably the best street food in South Asia.",
      latitude: 23.7104,
      longitude: 90.4074,
      featuredImage: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200",
      bestSeason: "November to February",
      averageBudget: "$",
      regionId: dhakaRegion.id,
      isFeatured: true,
      categorySlugs: ["historical", "cultural"],
    },
  ];

  for (const d of destinations) {
    const { categorySlugs, ...data } = d;
    await db.destination.upsert({
      where: { slug: d.slug },
      update: {},
      create: {
        ...data,
        categories: {
          connect: categorySlugs.map((slug) => ({ slug })),
        },
      },
    });
  }

  // ============================================================
  // TOUR PACKAGES (a few starter examples)
  // ============================================================
  await db.tourPackage.upsert({
    where: { slug: "old-dhaka-day-tour" },
    update: {},
    create: {
      slug: "old-dhaka-day-tour",
      title: "Old Dhaka Day Tour",
      summary: "A full day in the historic heart of Dhaka — forts, palaces, and street food.",
      description:
        "Explore Lalbagh Fort, Ahsan Manzil, Star Mosque, and Sadarghat river port on foot and by rickshaw. Ends with a guided street-food crawl through Old Dhaka.",
      duration: TourDuration.ONE_DAY,
      durationDays: 1,
      basePriceUSD: 79,
      featuredImage: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200",
      maxTravelers: 6,
      itinerary: {
        create: [
          {
            dayNumber: 1,
            title: "Old Dhaka on Foot",
            description:
              "Morning at Lalbagh Fort and Ahsan Manzil. Lunch of biryani at Nanna's. Afternoon rickshaw tour through Shakhari Bazaar and Sadarghat. Evening street-food walk in Chawkbazar.",
          },
        ],
      },
    },
  });

  await db.tourPackage.upsert({
    where: { slug: "sundarbans-3-day" },
    update: {},
    create: {
      slug: "sundarbans-3-day",
      title: "Sundarbans 3-Day Wildlife Cruise",
      summary: "Three days on a private boat through the world's largest mangrove forest.",
      description:
        "Board a comfortable river cruiser from Mongla for three days of tiger tracking, dolphin watching, and mangrove trekking with an authorized Forest Department guide. All permits included.",
      duration: TourDuration.THREE_DAY,
      durationDays: 3,
      basePriceUSD: 449,
      featuredImage: "https://images.unsplash.com/photo-1602800458591-eddda28a498b?w=1200",
      maxTravelers: 8,
      itinerary: {
        create: [
          {
            dayNumber: 1,
            title: "Mongla → Karamjal → Harbaria",
            description:
              "Depart Mongla mid-morning. Visit Karamjal wildlife breeding center. Overnight anchored near Harbaria.",
          },
          {
            dayNumber: 2,
            title: "Kotka Wildlife Sanctuary",
            description:
              "Dawn walk on Kotka beach, boat safari through narrow creeks, watchtower visit at sunset.",
          },
          {
            dayNumber: 3,
            title: "Hiron Point → Return",
            description:
              "Morning boat safari at Hiron Point. Lunch onboard. Return to Mongla by evening.",
          },
        ],
      },
    },
  });

  await db.tourPackage.upsert({
    where: { slug: "sylhet-5-day" },
    update: {},
    create: {
      slug: "sylhet-5-day",
      title: "Sylhet Tea & Rainforest 5-Day Trip",
      summary: "Five days across Bangladesh's tea heartland — gardens, waterfalls, and hill villages.",
      description:
        "Explore Srimangal's tea gardens, hike Lawachara rainforest to spot hoolock gibbons, take a boat through Ratargul swamp forest, and visit Jaflong on the Indian border.",
      duration: TourDuration.FIVE_DAY,
      durationDays: 5,
      basePriceUSD: 649,
      featuredImage: "https://images.unsplash.com/photo-1524350876685-274059332603?w=1200",
      maxTravelers: 8,
      itinerary: {
        create: [
          { dayNumber: 1, title: "Arrive in Sylhet", description: "Overnight train from Dhaka, arrive Sylhet, check in, visit Hazrat Shahjalal's shrine." },
          { dayNumber: 2, title: "Srimangal Tea Gardens", description: "Drive to Srimangal. Tea garden walk, seven-layer tea tasting." },
          { dayNumber: 3, title: "Lawachara Rainforest", description: "Morning hike to spot hoolock gibbons. Afternoon at the Khasi tribe village." },
          { dayNumber: 4, title: "Ratargul Swamp", description: "Boat ride through Bangladesh's only freshwater swamp forest." },
          { dayNumber: 5, title: "Jaflong & Return", description: "Visit Jaflong on the Indian border, return to Sylhet, night train to Dhaka." },
        ],
      },
    },
  });

  // ============================================================
  // MORE PLACES (Nov 2026)
  // New destinations are published. New tours are saved as drafts
  // (isPublished: false) so prices can be checked in the admin first.
  // Re-running the seed never overwrites anything already there.
  // ============================================================
  const [khulna, barishal] = await Promise.all([
    db.region.upsert({
      where: { slug: "khulna" },
      update: {},
      create: {
        name: "Khulna & Bagerhat",
        slug: "khulna",
        description: "The southwest: the medieval mosque city of Bagerhat, river towns and the gateway to the Sundarbans. No permit needed outside the forest itself.",
        isRestricted: false,
      },
    }),
    db.region.upsert({
      where: { slug: "barishal" },
      update: {},
      create: {
        name: "Barishal & Kuakata",
        slug: "barishal",
        description: "The river delta of the south: floating markets, endless waterways and the long beach at Kuakata.",
        isRestricted: false,
      },
    }),
  ]);

  const morePlaces = [
    {
      slug: "bagerhat-sixty-dome-mosque",
      name: "Bagerhat & the Sixty Dome Mosque",
      shortDesc: "A UNESCO World Heritage mosque city from the 15th century, built by Khan Jahan Ali.",
      longDesc:
        "Bagerhat was founded in the 15th century by the saint and general Khan Jahan Ali, and its ruins are a UNESCO World Heritage Site, the Historic Mosque City of Bagerhat. The centrepiece is the Shat Gombuj (Sixty Dome) Mosque, a vast brick hall of slender stone pillars under 77 low domes. Around it are smaller mosques, Khan Jahan Ali's tomb beside a pond famous for its resident crocodiles, and quiet village lanes. Most people visit on a day trip from Khulna, often on the way to the Sundarbans.",
      latitude: 22.6748,
      longitude: 89.7419,
      featuredImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200",
      bestSeason: "November to February",
      averageBudget: "$",
      regionId: khulna.id,
      isFeatured: false,
      categorySlugs: ["historical", "cultural"],
    },
    {
      slug: "kuakata-beach",
      name: "Kuakata",
      shortDesc: "A long, quiet beach where you can watch the sun both rise and set over the sea.",
      longDesc:
        "Kuakata sits at the southern tip of Patuakhali, facing the Bay of Bengal. Its long, gently curving beach is one of the few places in South Asia where you can see both sunrise and sunset over the water. Beyond the sand there are Rakhine villages and a Buddhist temple, fishing boats landing their catch, and mangrove patches to explore by boat. It is calmer and less built-up than Cox's Bazar.",
      latitude: 21.8167,
      longitude: 90.12,
      featuredImage: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=1200",
      bestSeason: "November to February",
      averageBudget: "$",
      regionId: barishal.id,
      isFeatured: false,
      categorySlugs: ["beaches", "cultural"],
    },
    {
      slug: "rangamati-kaptai-lake",
      name: "Rangamati & Kaptai Lake",
      shortDesc: "Boat days on a huge, island-studded lake among the hills of the Chittagong Hill Tracts.",
      longDesc:
        "Kaptai Lake was formed in the early 1960s when the Karnaphuli River was dammed at Kaptai, flooding a wide valley in the hills. Today it is a maze of green islands and inlets around the town of Rangamati. Days here are spent on the water: the hanging bridge, the Shuvolong waterfalls in the wet season, lakeside restaurants and markets run by the Chakma and other indigenous communities. Foreign visitors need a permit for the Hill Tracts, which we arrange.",
      latitude: 22.6533,
      longitude: 92.1789,
      featuredImage: "https://images.unsplash.com/photo-1543039717-b9f3caebe83b?w=1200",
      bestSeason: "October to March",
      averageBudget: "$$",
      regionId: chittagongHillTracts.id,
      isFeatured: false,
      categorySlugs: ["rivers", "hills", "cultural"],
    },
    {
      slug: "jaflong",
      name: "Jaflong",
      shortDesc: "Clear river water and stone beds at the foot of the Khasi Hills, on the Indian border.",
      longDesc:
        "Jaflong lies north of Sylhet where the Piyain River comes down from the Khasi Hills of Meghalaya. The river runs clear and green over wide beds of stones, with the hills and the Dawki bridge just across the border. Visitors come for the views, boat rides on the river and walks to nearby Khasi villages and betel-leaf gardens. It is busiest after the monsoon, when the water is high and the hills are at their greenest.",
      latitude: 25.1636,
      longitude: 92.0175,
      featuredImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200",
      bestSeason: "October to February",
      averageBudget: "$",
      regionId: sylhet.id,
      isFeatured: false,
      categorySlugs: ["rivers", "hills"],
    },
    {
      slug: "tanguar-haor",
      name: "Tanguar Haor",
      shortDesc: "A vast seasonal wetland: houseboats in the monsoon, migratory birds in winter.",
      longDesc:
        "Tanguar Haor in Sunamganj is one of Bangladesh's great wetlands and a Ramsar site of international importance. In the monsoon the haor becomes an inland sea with flooded swamp trees and the Meghalaya hills on the horizon, best seen from a traditional houseboat. In winter the water drops back into dozens of beels, and the area fills with migratory ducks and other waterbirds. Local fishing communities depend on the haor, so visits are slow, simple and close to village life.",
      latitude: 25.15,
      longitude: 91.07,
      featuredImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200",
      bestSeason: "July to September (water), December to February (birds)",
      averageBudget: "$$",
      regionId: sylhet.id,
      isFeatured: false,
      categorySlugs: ["rivers", "wildlife"],
    },
    {
      slug: "mahasthangarh",
      name: "Mahasthangarh",
      shortDesc: "The ruined walls of ancient Pundranagara, one of the oldest cities in Bangladesh.",
      longDesc:
        "Mahasthangarh, near Bogura, is one of the earliest urban archaeological sites in Bangladesh: the remains of the ancient city of Pundranagara, inhabited from at least the 3rd century BCE. You can walk the old brick ramparts, see excavated temples and monasteries nearby, and visit the site museum, which holds coins, terracotta and inscriptions found here. It pairs well with a visit to Paharpur, a few hours away.",
      latitude: 24.9614,
      longitude: 89.3436,
      featuredImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200",
      bestSeason: "November to February",
      averageBudget: "$",
      regionId: rajshahi.id,
      isFeatured: false,
      categorySlugs: ["historical"],
    },
  ];
  for (const d of morePlaces) {
    const { categorySlugs, ...data } = d;
    await db.destination.upsert({
      where: { slug: d.slug },
      update: {},
      create: { ...data, categories: { connect: categorySlugs.map((slug) => ({ slug })) } },
    });
  }

  // Draft tours: check the prices in Admin → Tours, then publish
  await db.tourPackage.upsert({
    where: { slug: "bagerhat-heritage-day" },
    update: {},
    create: {
      slug: "bagerhat-heritage-day",
      title: "Bagerhat Mosque City Day Trip",
      summary: "A day among the 15th-century mosques of Khan Jahan Ali, a UNESCO World Heritage Site.",
      description:
        "Leave Khulna in the morning for Bagerhat. Walk through the Sixty Dome Mosque and the smaller mosques of the old city with a local guide, visit Khan Jahan Ali's tomb and its pond, and have lunch with a village family before returning in the evening.",
      duration: TourDuration.ONE_DAY,
      durationDays: 1,
      basePriceUSD: 69,
      featuredImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200",
      maxTravelers: 8,
      includesLodging: false,
      isPublished: false,
      itinerary: {
        create: [
          { dayNumber: 1, title: "The mosque city", description: "Sixty Dome Mosque, Singair and Nine Dome mosques, Khan Jahan Ali's tomb, village lunch, back to Khulna by evening." },
        ],
      },
    },
  });
  await db.tourPackage.upsert({
    where: { slug: "rangamati-kaptai-3-day" },
    update: {},
    create: {
      slug: "rangamati-kaptai-3-day",
      title: "Rangamati & Kaptai Lake 3-Day Trip",
      summary: "Three days on the lake and in the hills of Rangamati, with your Hill Tracts permit arranged.",
      description:
        "Drive from Chattogram into the Hill Tracts and spend two days exploring Kaptai Lake by boat: islands, the hanging bridge, Shuvolong falls (in season), lakeside markets and a Chakma village. Nights in a lakeside guesthouse. We arrange the permit foreign visitors need.",
      duration: TourDuration.THREE_DAY,
      durationDays: 3,
      basePriceUSD: 389,
      featuredImage: "https://images.unsplash.com/photo-1543039717-b9f3caebe83b?w=1200",
      maxTravelers: 8,
      isPublished: false,
      itinerary: {
        create: [
          { dayNumber: 1, title: "Into the hills", description: "Pickup in Chattogram, drive to Rangamati, permit check, evening by the lake." },
          { dayNumber: 2, title: "A day on Kaptai Lake", description: "Boat day: islands, Shuvolong falls (best July to October), lunch at a lakeside restaurant, a Chakma village." },
          { dayNumber: 3, title: "Markets and back", description: "Morning market and the hanging bridge, then the drive back to Chattogram." },
        ],
      },
    },
  });
  await db.tourPackage.upsert({
    where: { slug: "sylhet-haor-jaflong-3-day" },
    update: {},
    create: {
      slug: "sylhet-haor-jaflong-3-day",
      title: "Tanguar Haor & Jaflong 3-Day Trip",
      summary: "A night on a houseboat on Tanguar Haor, then the clear river at Jaflong.",
      description:
        "From Sylhet, travel to Sunamganj and board a traditional houseboat for a night on Tanguar Haor: swimming, village visits and sunset over the hills. Return via Jaflong for the river, the Khasi villages and the view to the Dawki bridge. Best in the monsoon and just after (June to October).",
      duration: TourDuration.THREE_DAY,
      durationDays: 3,
      basePriceUSD: 349,
      featuredImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200",
      maxTravelers: 8,
      isPublished: false,
      itinerary: {
        create: [
          { dayNumber: 1, title: "To the haor", description: "Sylhet to Sunamganj, board the houseboat, afternoon on Tanguar Haor, night on board." },
          { dayNumber: 2, title: "Haor morning, Jaflong afternoon", description: "Sunrise on the water and a fishing village, then on to Jaflong for the river and a Khasi village." },
          { dayNumber: 3, title: "Back to Sylhet", description: "Tea garden stop on the way back, drop-off in Sylhet." },
        ],
      },
    },
  });

  // ============================================================
  // DISTRICTS (all 64) — photos and text edited in the admin are kept
  // ============================================================
  for (const d of DISTRICTS) {
    const data = {
      name: d.name,
      nameBn: d.nameBn,
      division: d.division,
      latitude: d.latitude,
      longitude: d.longitude,
      permitRequired: d.permitRequired ?? false,
    };
    // The text can be edited in the admin, so it's only written the first time
    await db.district.upsert({
      where: { slug: d.slug },
      update: data,
      create: { slug: d.slug, ...data, knownFor: d.knownFor, highlights: d.highlights },
    });
  }
  for (const [destination, district] of Object.entries(DESTINATION_DISTRICT)) {
    await db.destination.updateMany({
      where: { slug: destination, districtId: null },
      data: { districtId: (await db.district.findUniqueOrThrow({ where: { slug: district } })).id },
    });
  }
  console.log(`✅ ${DISTRICTS.length} districts.`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });