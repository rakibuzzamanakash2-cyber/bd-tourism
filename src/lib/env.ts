import "server-only";
import { z } from "zod";

/**
 * Every environment variable the server uses, checked once at startup.
 * A missing or malformed required value stops the app with a clear message
 * instead of failing later in some random request.
 *
 * See .env.example for what each one is for.
 */
const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Required
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is missing" })
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must start with postgresql://"),
  AUTH_SECRET: z
    .string({ error: "AUTH_SECRET is missing (generate one with: npx auth secret)" })
    .min(16, "AUTH_SECRET is too short; use at least 32 random characters"),

  // App
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),

  // Optional features — each switches on when its keys are present
  AUTH_GOOGLE_ID: optional,
  AUTH_GOOGLE_SECRET: optional,

  SSLCOMMERZ_STORE_ID: optional,
  SSLCOMMERZ_STORE_PASSWORD: optional,
  SSLCOMMERZ_SANDBOX: optional,
  SSLCOMMERZ_SUCCESS_URL: optional,
  SSLCOMMERZ_FAIL_URL: optional,
  SSLCOMMERZ_CANCEL_URL: optional,
  SSLCOMMERZ_IPN_URL: optional,

  RESEND_API_KEY: optional,
  EMAIL_FROM: optional,
  // Where team notifications (new contact messages, cancellations) go.
  // Defaults to the public contact email in src/lib/site.ts.
  ADMIN_EMAIL: optional,
  // Shared secret Vercel Cron sends to /api/cron/* routes
  CRON_SECRET: optional,

  // Photo uploads in the admin panel (cloudinary.com → Settings → API Keys)
  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`);
  throw new Error(
    `\n\nInvalid environment variables — check your .env file (see .env.example):\n${lines.join("\n")}\n`,
  );
}

export const env = parsed.data;

/** Which optional integrations are configured. */
export const features = {
  google: Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
  payments: Boolean(env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD),
  email: Boolean(env.RESEND_API_KEY),
  uploads: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
};
