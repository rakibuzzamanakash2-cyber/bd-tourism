import type { Metadata } from "next";
import { Inter, Instrument_Serif, Hind_Siliguri } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { auth } from "@/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  style: ["normal", "italic"],
});

const hindSiliguri = Hind_Siliguri({
  weight: ["400", "500"],
  subsets: ["bengali"],
  variable: "--font-hind",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bangladesh, guided.",
    template: "%s · Bangladesh Tourism",
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
        <SessionProvider session={session}>
          {children}
          <Toaster position="bottom-right" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
