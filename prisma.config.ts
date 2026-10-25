import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Not using env("DATABASE_URL") because it throws when the variable is
    // missing, which would break `npm install` (postinstall runs
    // `prisma generate`, which doesn't need a database). Commands that do
    // need the database (migrate, seed, studio) still fail clearly without it.
    url: process.env.DATABASE_URL ?? "",
  },
});
