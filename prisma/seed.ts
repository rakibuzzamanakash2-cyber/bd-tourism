import "dotenv/config";
import { PrismaClient, TourDuration } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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
  const [beaches, hills, historical, wildlife, cultural, rivers] = await Promise.all([
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