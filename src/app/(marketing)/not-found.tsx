import { NotFoundContent } from "@/components/layout/not-found-content";

/**
 * Shown when a page in this section calls notFound() — an unknown district
 * slug, a tour that was taken down, /plan with nothing to plan.
 *
 * Without this file, Next reaches for the root app/not-found.tsx, which
 * brings its own header, footer and <main> and renders them a second time
 * inside this section's layout.
 */
export default function MarketingNotFound() {
  return <NotFoundContent />;
}
