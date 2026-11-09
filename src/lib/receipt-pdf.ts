import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type ReceiptInput = {
  receiptNo: string;
  paidAt: Date;
  traveler: { name: string; email: string };
  booking: { code: string; title: string; kind: "Tour" | "Homestay"; dates: string; people: string };
  lines: { label: string; usd: number }[];
  totalUSD: number;
  paid: { currency: "USD" | "BDT"; amount: number; method: string; reference: string | null };
  refund: { usd: number; bdt: number | null; at: Date | null } | null;
  testMode: boolean;
  site: { name: string; url: string; email: string; whatsapp: string };
};

// The built-in PDF fonts only cover Latin characters: turn accents into plain
// letters and drop anything else (e.g. "José" → "Jose").
const latin = (s: string) =>
  s
    .replace(/\s*→\s*/g, " - ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E -ÿ]/g, "")
    .trim() || "-";

const usd = (n: number) => `USD ${n.toFixed(2)}`;
const bdt = (n: number) => `BDT ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const day = (d: Date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" }).format(d);

const FOREST = rgb(0.106, 0.239, 0.184);
const INK = rgb(0.13, 0.15, 0.14);
const MUTE = rgb(0.42, 0.45, 0.43);
const LINE = rgb(0.85, 0.86, 0.84);

/** A one-page A4 receipt. */
export async function buildReceiptPdf(r: ReceiptInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Receipt ${r.receiptNo}`);
  doc.setAuthor(r.site.name);
  doc.setCreator(r.site.name);
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const L = 56;
  const R = 595.28 - 56;
  let y = 841.89 - 64;

  const text = (s: string, x: number, yy: number, o: { f?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; right?: boolean } = {}) => {
    const f = o.f ?? font;
    const size = o.size ?? 10;
    const t = latin(s);
    const w = f.widthOfTextAtSize(t, size);
    page.drawText(t, { x: o.right ? x - w : x, y: yy, size, font: f, color: o.color ?? INK });
  };
  const rule = (yy: number) => page.drawLine({ start: { x: L, y: yy }, end: { x: R, y: yy }, thickness: 0.6, color: LINE });

  // Header
  text(r.site.name, L, y, { f: bold, size: 22, color: FOREST });
  text("Payment receipt", R, y + 4, { f: bold, size: 14, right: true });
  y -= 18;
  text("Bangladesh, guided.", L, y, { size: 9, color: MUTE });
  text(`No. ${r.receiptNo}`, R, y, { size: 9, color: MUTE, right: true });
  y -= 12;
  text(`Paid ${day(r.paidAt)}`, R, y, { size: 9, color: MUTE, right: true });
  if (r.testMode) {
    y -= 22;
    page.drawRectangle({ x: L, y: y - 6, width: R - L, height: 22, color: rgb(0.98, 0.92, 0.88) });
    text("TEST PAYMENT (SSLCommerz sandbox): no real money was taken.", L + 10, y + 1, { f: bold, size: 9, color: rgb(0.62, 0.27, 0.16) });
  }
  y -= 30;
  rule(y);

  // Who and what
  y -= 24;
  const block = (label: string, lines: string[], x: number, yy: number) => {
    text(label.toUpperCase(), x, yy, { f: bold, size: 8, color: MUTE });
    lines.forEach((l, i) => text(l, x, yy - 15 - i * 13, { size: 10 }));
  };
  block("Billed to", [r.traveler.name, r.traveler.email], L, y);
  block("Booking", [`${r.booking.kind} · ${r.booking.code}`, r.booking.title, r.booking.dates, r.booking.people], 310, y);
  y -= 80;
  rule(y);

  // Lines
  y -= 22;
  text("DESCRIPTION", L, y, { f: bold, size: 8, color: MUTE });
  text("AMOUNT", R, y, { f: bold, size: 8, color: MUTE, right: true });
  for (const line of r.lines) {
    y -= 20;
    text(line.label, L, y);
    text(usd(line.usd), R, y, { right: true });
  }
  y -= 14;
  rule(y);
  y -= 20;
  text("Total", L, y, { f: bold, size: 11 });
  text(usd(r.totalUSD), R, y, { f: bold, size: 11, right: true });
  y -= 18;
  text(
    r.paid.currency === "BDT" ? `Paid in taka: ${bdt(r.paid.amount)}` : `Paid in US dollars: ${usd(r.paid.amount)}`,
    R,
    y,
    { size: 9, color: MUTE, right: true },
  );

  // Payment details
  y -= 34;
  block("Payment", [`Method: ${r.paid.method}`, ...(r.paid.reference ? [`Reference: ${r.paid.reference}`] : [])], L, y);
  if (r.refund) {
    block("Refund", [
      `${usd(r.refund.usd)}${r.refund.bdt ? ` (${bdt(r.refund.bdt)})` : ""}`,
      r.refund.at ? `Sent ${day(r.refund.at)}` : "Owed, to be sent within 7-10 working days",
    ], 310, y);
  }
  y -= 60;
  rule(y);

  footer(page, font, L, R, r);
  return doc.save();
}

function footer(page: PDFPage, font: PDFFont, L: number, R: number, r: ReceiptInput) {
  const lines = [
    "Thank you for travelling with us.",
    `${r.site.url} · ${r.site.email} · WhatsApp ${r.site.whatsapp}`,
    "This receipt was produced automatically and is valid without a signature.",
  ];
  lines.forEach((l, i) => {
    const t = latin(l);
    const size = i === 0 ? 10 : 8;
    const w = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (L + R) / 2 - w / 2, y: 70 - i * 13, size, font, color: i === 0 ? INK : MUTE });
  });
}
