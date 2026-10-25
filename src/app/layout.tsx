import type { Metadata } from "next";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { auth } from "@/auth";
import "./globals.css";

// Fonts are self-hosted (files in ./fonts, SIL Open Font License) so the build
// never depends on reaching Google Fonts and no visitor data goes to Google.
const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = localFont({
  src: [
    { path: "./fonts/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

const hindSiliguri = localFont({
  src: [
    { path: "./fonts/hind-siliguri-bengali-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/hind-siliguri-bengali-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-hind",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DeltaWay · Bangladesh, guided.",
    template: "%s · DeltaWay",
  },
  description:
    "Small-group tours, verified local guides, and homestays across Bangladesh's most remarkable places — the Sundarbans, the Chittagong Hill Tracts, and the tea gardens of Sylhet. Restricted-area permits handled.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${hindSiliguri.variable}`}
    >
      <body className="min-h-screen">
        {/* SessionProvider only reads `session` once, so after signing in or
            out (a server action + redirect) the header kept showing the old
            state until a full reload. Keying it on the user remounts it with
            the fresh session whenever that changes. */}
        <SessionProvider session={session} key={session?.user?.id ?? "guest"}>
          {children}
          <Toaster position="bottom-right" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
