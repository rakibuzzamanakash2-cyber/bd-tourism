import Link from "next/link";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/destinations", label: "Destinations" },
      { href: "/packages", label: "Tours" },
      { href: "/experiences", label: "Homestays" },
      { href: "/permits", label: "Restricted areas" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/become-a-guide", label: "Become a guide" },
      { href: "/become-a-host", label: "Host tourists" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help center" },
      { href: "/safety", label: "Traveler safety" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-32 bg-forest-950 text-paper">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 md:grid-cols-6">
          <div className="md:col-span-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-paper">
                <span className="font-display text-sm leading-none text-forest-950">
                  DW
                </span>
              </div>
              <span className="font-display text-2xl leading-none">
                DeltaWay
              </span>
              <span className="font-bengali text-lg text-forest-300">
                বাংলাদেশ
              </span>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-forest-200">
              Small-group tours, verified guides, and homestays across
              Bangladesh&rsquo;s most remarkable places. Restricted-area
              permits handled for you.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="eyebrow text-forest-300">{col.title}</h4>
              <ul className="mt-5 space-y-3 text-sm text-forest-100">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-forest-800 pt-8 text-xs text-forest-300 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} DeltaWay. Made in Dhaka.
          </p>
          <p className="font-bengali text-forest-200">
            সুন্দর বাংলাদেশে স্বাগতম
          </p>
        </div>
      </div>
    </footer>
  );
}
