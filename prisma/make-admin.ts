// Gives an existing account admin access (or removes it with --remove).
//
//   npm run make-admin -- you@example.com
//   npm run make-admin -- you@example.com --remove
//
// The person must have signed up on the site first.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const remove = process.argv.includes("--remove");
  if (!email || !email.includes("@")) {
    console.error("Usage: npm run make-admin -- you@example.com [--remove]");
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No account found for ${email}. Sign up on the site first, then run this again.`);
    process.exit(1);
  }

  const role = remove ? "TOURIST" : "ADMIN";
  await db.user.update({ where: { id: user.id }, data: { role } });
  await db.auditLog.create({
    data: {
      action: "user.role",
      targetType: "User",
      targetId: user.id,
      details: { from: user.role, to: role, via: "make-admin script" },
    },
  });
  console.log(remove ? `✓ ${email} is no longer an admin.` : `✓ ${email} is now an admin. Open /admin (it may take up to 5 minutes, or sign out and in).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
