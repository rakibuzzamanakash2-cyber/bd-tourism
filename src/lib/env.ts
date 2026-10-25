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

  // Photo uploads in the admin panel. Either the one-line CLOUDINARY_URL
  // (cloudinary://API_KEY:API_SECRET@CLOUD_NAME, copied from the Cloudinary
  // dashboard) or the three separate values below.
  CLOUDINARY_URL: optional,
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

// ============================================================
// Cloudinary settings, from CLOUDINARY_URL or the separate values.
// Problems don't stop the app (uploads are optional); they're shown on
// Admin → Settings instead, so a typo is easy to spot and fix.
// ============================================================
export type CloudinaryConfig =
  | { configured: true; cloudName: string; apiKey: string; apiSecret: string; source: "CLOUDINARY_URL" | "separate"; problem: null }
  | { configured: false; problem: string | null };

function resolveCloudinary(): CloudinaryConfig {
  let cloudName = env.CLOUDINARY_CLOUD_NAME;
  let apiKey = env.CLOUDINARY_API_KEY;
  let apiSecret = env.CLOUDINARY_API_SECRET;
  let source: "CLOUDINARY_URL" | "separate" = "separate";

  if (env.CLOUDINARY_URL) {
    const m = env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)$/);
    if (!m) {
      return {
        configured: false,
        problem: "CLOUDINARY_URL should look like cloudinary://API_KEY:API_SECRET@CLOUD_NAME (copy it exactly from the Cloudinary dashboard).",
      };
    }
    [apiKey, apiSecret, cloudName] = [m[1], m[2], m[3]];
    source = "CLOUDINARY_URL";
  }

  const missing = [
    !cloudName && "cloud name",
    !apiKey && "API key",
    !apiSecret && "API secret",
  ].filter(Boolean) as string[];
  if (missing.length === 3) return { configured: false, problem: null }; // simply not set up
  if (missing.length > 0) return { configured: false, problem: `Cloudinary is half set up: the ${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} missing.` };

  const placeholder = /^(your[-_ ]|\.\.\.|<|xxx|changeme)/i;
  if ([cloudName, apiKey, apiSecret].some((v) => placeholder.test(v!))) {
    return { configured: false, problem: "A Cloudinary value still has placeholder text (like \"your-cloud-name\" or \"...\"). Paste your real values." };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName!)) {
    return { configured: false, problem: `The cloud name "${cloudName}" has spaces or symbols in it. Use the exact cloud name from your Cloudinary dashboard.` };
  }
  if (!/^\d+$/.test(apiKey!)) {
    return { configured: false, problem: "The Cloudinary API key should be digits only. You may have swapped the key and the secret." };
  }
  return { configured: true, cloudName: cloudName!, apiKey: apiKey!, apiSecret: apiSecret!, source, problem: null };
}

export const cloudinary = resolveCloudinary();

/** Which optional integrations are configured. */
export const features = {
  google: Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
  payments: Boolean(env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD),
  email: Boolean(env.RESEND_API_KEY),
  uploads: cloudinary.configured,
};
