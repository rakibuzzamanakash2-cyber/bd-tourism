import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

// The picture that shows up when someone pastes a DeltaWay link into
// WhatsApp, Messenger or Facebook. Pages with a photo of their own (a
// district, a place, a tour) use that photo instead; this is the fallback
// for every page that has none.
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FOREST = "#1B3D2F";
const DEEP = "#0F251C";
const PAPER = "#FAF8F1";
const CLAY = "#C47B5C";

// The same delta mark as icon.svg, inlined so the card needs no network.
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="${PAPER}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"><path d="M50 83V57"/><path d="M50 57Q50 42 27 26"/><path d="M50 57V20"/><path d="M50 57Q50 42 73 26"/></g></svg>`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${FOREST} 0%, ${DEEP} 100%)`,
          padding: 80,
          color: PAPER,
        }}
      >
        <img src={`data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`} width={132} height={132} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, letterSpacing: -2, lineHeight: 1 }}>{site.name}</div>
          <div style={{ fontSize: 44, color: "#D4E0C6", marginTop: 18 }}>{site.tagline}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 28, color: "#B2C79E" }}>
          <div style={{ width: 64, height: 5, background: CLAY, borderRadius: 3 }} />
          <div style={{ display: "flex" }}>Tours · Local guides · Homestays · Permits handled</div>
        </div>
      </div>
    ),
    size,
  );
}
