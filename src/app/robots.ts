import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const BASE = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing private or personal, and nothing behind a sign-in, should
        // be crawled. /i/ are one-time invite links.
        disallow: ["/admin", "/api/", "/dashboard", "/book", "/apply", "/invite", "/i/", "/login", "/signup", "/reset-password"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
