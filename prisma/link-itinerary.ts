import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Map of package slug → { day number → destination slug }
const links: {
  packageSlug: string;
  days: { dayNumber: number; destinationSlug: string }[];
}[] = [
  {
    packageSlug: "old-dhaka-day-tour",
    days: [{ dayNumber: 1, destinationSlug: "old-dhaka" }],
  },
  {
    packageSlug: "sundarbans-3-day",
    days: [
      { dayNumber: 1, destinationSlug: "sundarbans-mangrove" },
      { dayNumber: 2, destinationSlug: "sundarbans-mangrove" },
      { dayNumber: 3, destinationSlug: "sundarbans-mangrove" },
    ],
  },
  {
    packageSlug: "sylhet-5-day",
    days: [
      { dayNumber: 2, destinationSlug: "srimangal-tea-gardens" },
      { dayNumber: 4, destinationSlug: "ratargul-swamp-forest" },
    ],
  },
];

async function main() {
  console.log("🔗 Linking itinerary days to destinations…");

  for (const link of links) {
    const pkg = await db.tourPackage.findUnique({
      where: { slug: link.packageSlug },
    });
    if (!pkg) {
      console.log(`  ⚠  Package ${link.packageSlug} not found — skipping`);
      continue;
    }

    for (const day of link.days) {
      const dest = await db.destination.findUnique({
        where: { slug: day.destinationSlug },
      });
      if (!dest) {
        console.log(
          `  ⚠  Destination ${day.destinationSlug} not found — skipping`,
        );
        continue;
      }

      const result = await db.tourPackageDay.updateMany({
        where: { packageId: pkg.id, dayNumber: day.dayNumber },
        data: { destinationId: dest.id },
      });

      console.log(
        `  ✅ ${link.packageSlug} day ${day.dayNumber} → ${day.destinationSlug} (${result.count} row${result.count === 1 ? "" : "s"})`,
      );
    }
  }

  console.log("✅ Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
