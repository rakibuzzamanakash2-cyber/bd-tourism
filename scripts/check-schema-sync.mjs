/**
 * Fails if schema.prisma and the migrated database have drifted apart.
 *
 * It asks the generated client to read one row from every model. Prisma
 * selects each column it believes exists, so a field added to schema.prisma
 * without a matching migration fails here — loudly, in CI — instead of
 * throwing at a traveller mid-booking.
 *
 * Deliberately uses only the client, never the schema engine, so it runs
 * anywhere `npm ci` works.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const models = Prisma.dmmf.datamodel.models.map((m) => m.name);
const failures = [];

for (const name of models) {
  const delegate = name[0].toLowerCase() + name.slice(1);
  try {
    await db[delegate].findFirst();
  } catch (err) {
    failures.push(`${name}: ${String(err.message).split("\n").find((l) => l.trim()) ?? err}`);
  }
}

await db.$disconnect();

if (failures.length) {
  console.error(`Schema and database disagree on ${failures.length} of ${models.length} models:\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error("\nA field was probably added to schema.prisma without a migration. Write one in prisma/migrations/.");
  process.exit(1);
}

console.log(`Schema matches the database: all ${models.length} models read cleanly.`);
