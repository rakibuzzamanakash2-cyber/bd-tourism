import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Lets people add DeltaWay to a phone home screen, and tells the browser
// what colour to paint its own chrome around the page.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} · ${site.tagline}`,
    short_name: site.name,
    description:
      "Small-group tours, verified local guides and homestays across Bangladesh. Restricted-area permits handled.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F1",
    theme_color: "#1B3D2F",
    categories: ["travel", "tourism"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/deltaway-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/deltaway-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
