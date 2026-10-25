import type { NextConfig } from "next";
import { IMAGE_HOSTS } from "./src/lib/image-hosts";

const isDev = process.env.NODE_ENV !== "production";

// Where images may come from (see src/lib/image-hosts.ts). next/image fetches
// remote photos on the server and serves them from our own domain; Google
// profile pictures are loaded directly by the browser.
const imageHosts = [...IMAGE_HOSTS];

// Content-Security-Policy: what the browser is allowed to load or submit to.
// 'unsafe-inline' for scripts/styles is needed by Next.js's inline bootstrap
// and Tailwind; dev mode also needs 'unsafe-eval' and websockets for reload.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${imageHosts.map((h) => `https://${h}`).join(" ")}`,
  "font-src 'self'",
  // api.cloudinary.com: admin photo uploads go straight from the browser
  `connect-src 'self' https://api.cloudinary.com${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  // Forms post to us, then redirect to Google sign-in or the SSLCommerz page
  "form-action 'self' https://accounts.google.com https://sandbox.sslcommerz.com https://securepay.sslcommerz.com",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Browsers only honour HSTS over HTTPS; never send it from localhost
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https", hostname })),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
