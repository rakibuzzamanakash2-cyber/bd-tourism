// JSON-LD for search engines. Google reads these to show rich results:
// breadcrumbs under a link, a price and star rating next to a tour, and the
// right name and logo for the business itself.
//
// Rule for everything here: only describe what is really on the page. An
// invented rating or price is a manual penalty, not a quick win.
import { env } from "@/lib/env";
import { site } from "@/lib/site";

const BASE = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
export const absolute = (path: string) => (path.startsWith("http") ? path : `${BASE}${path}`);

type Json = Record<string, unknown>;

/** Who we are. Goes on the home page only, so Google has one clear source. */
export function organizationLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${BASE}/#organization`,
    name: site.name,
    url: BASE,
    slogan: site.tagline,
    areaServed: { "@type": "Country", name: "Bangladesh" },
    address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
    telephone: `+${site.whatsappNumber}`,
  };
}

/** The site itself, with the destination search Google can offer directly. */
export function webSiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE}/#website`,
    name: site.name,
    url: BASE,
    publisher: { "@id": `${BASE}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE}/destinations?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** The trail shown under a result: DeltaWay › Districts › Sylhet › Ratargul. */
export function breadcrumbLd(trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absolute(t.path),
    })),
  };
}

export function districtLd(d: {
  slug: string;
  name: string;
  knownFor: string;
  latitude: number;
  longitude: number;
  photo: string | null;
  places: { slug: string; name: string }[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: `${d.name} district`,
    description: d.knownFor,
    url: absolute(`/districts/${d.slug}`),
    ...(d.photo && { image: absolute(d.photo) }),
    geo: { "@type": "GeoCoordinates", latitude: d.latitude, longitude: d.longitude },
    address: { "@type": "PostalAddress", addressRegion: d.name, addressCountry: "BD" },
    containedInPlace: { "@type": "Country", name: "Bangladesh" },
    ...(d.places.length > 0 && {
      includesAttraction: d.places.slice(0, 20).map((p) => ({
        "@type": "TouristAttraction",
        name: p.name,
        url: absolute(`/districts/${d.slug}/${p.slug}`),
      })),
    }),
  };
}

export function placeLd(p: {
  slug: string;
  name: string;
  description: string;
  photo: string | null;
  gallery: string[];
  district: { slug: string; name: string };
}): Json {
  const images = [p.photo, ...p.gallery].filter((u): u is string => Boolean(u)).map(absolute);
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: p.name,
    description: p.description,
    url: absolute(`/districts/${p.district.slug}/${p.slug}`),
    ...(images.length > 0 && { image: images.slice(0, 6) }),
    address: { "@type": "PostalAddress", addressRegion: p.district.name, addressCountry: "BD" },
    containedInPlace: {
      "@type": "TouristDestination",
      name: `${p.district.name} district`,
      url: absolute(`/districts/${p.district.slug}`),
    },
  };
}

export function tourLd(
  t: {
    slug: string;
    title: string;
    summary: string;
    featuredImage: string;
    priceUSD: number;
    itinerary: { dayNumber: number; title: string }[];
  },
  // Only passed through when real published reviews exist
  rating?: { average: number; count: number },
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: t.title,
    description: t.summary,
    url: absolute(`/packages/${t.slug}`),
    image: absolute(t.featuredImage),
    provider: { "@id": `${BASE}/#organization` },
    offers: {
      "@type": "Offer",
      price: t.priceUSD.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absolute(`/packages/${t.slug}`),
    },
    ...(t.itinerary.length > 0 && {
      itinerary: {
        "@type": "ItemList",
        numberOfItems: t.itinerary.length,
        itemListElement: t.itinerary.map((day) => ({
          "@type": "ListItem",
          position: day.dayNumber,
          name: `Day ${day.dayNumber}: ${day.title}`,
        })),
      },
    }),
    ...(rating && rating.count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.average,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}
