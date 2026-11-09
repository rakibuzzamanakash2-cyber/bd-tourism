// Moves passport numbers from old bookings and profiles into encrypted
// storage. The daily job does this too; run it by hand right after updating:
//   npm run privacy:migrate
import "dotenv/config";
import { migrateLegacyTravelerData } from "../src/lib/travelers";
import { db } from "../src/lib/db";

migrateLegacyTravelerData()
  .then((r) => console.log(`🔐 Encrypted passports from ${r.bookings} bookings and ${r.profiles} profiles.`))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
