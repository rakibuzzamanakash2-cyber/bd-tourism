import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-forest-950 text-paper">
          <Image
            src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=2000&q=85"
            alt=""
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950 via-forest-950/80 to-transparent" />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="font-bengali text-lg text-forest-300">
                খুঁজে পাওয়া যায়নি
              </p>
              <p className="eyebrow mt-4 text-forest-300">404 · Not found</p>
              <h1 className="mt-6 font-display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">
                You&rsquo;ve wandered off{" "}
                <em className="italic text-forest-200">the map.</em>
              </h1>
              <p className="mt-8 max-w-lg text-lg leading-relaxed text-paper/85">
                The page you&rsquo;re looking for doesn&rsquo;t exist &mdash;
                or hasn&rsquo;t been mapped yet. Head back to the start, or
                start browsing.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-full bg-paper px-6 text-forest-950 hover:bg-paper-warm",
                  )}
                >
                  Back to home
                </Link>
                <Link
                  href="/destinations"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "ghost" }),
                    "rounded-full border border-paper/40 px-6 text-paper hover:bg-paper/10 hover:text-paper",
                  )}
                >
                  Browse destinations
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
