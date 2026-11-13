import { redirect } from "next/navigation";
import { isDivision } from "@/lib/district-shared";

type Props = { searchParams: Promise<{ division?: string }> };

// The districts list now lives inside Destinations, as its "Districts" view.
// Old links and bookmarks land there. (Each district keeps its own page.)
export default async function DistrictsPage({ searchParams }: Props) {
  const { division } = await searchParams;
  redirect(`/destinations?view=districts${isDivision(division) ? `&division=${division}` : ""}`);
}
