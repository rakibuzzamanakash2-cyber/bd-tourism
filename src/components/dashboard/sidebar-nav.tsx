"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  Calendar,
  CalendarDays,
  ClipboardList,
  Compass,
  IdCard,
  LayoutDashboard,
  User,
} from "lucide-react";
import { guideText } from "@/lib/i18n/guide";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/dashboard/saved", label: "Saved", icon: BookMarked },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const applicationItem = { href: "/dashboard/application", label: "Application", icon: ClipboardList, exact: false };

/** Guides get their own section; its labels follow their chosen language. */
export type NavOptions = { showApplication?: boolean; guideLang?: "en" | "bn" | null };
const guideItems = (lang: "en" | "bn") => {
  const t = guideText[lang].nav;
  return [
    { href: "/dashboard/guide", label: t.trips, icon: Compass, exact: false },
    { href: "/dashboard/guide/availability", label: t.availability, icon: CalendarDays, exact: true },
    { href: "/dashboard/guide/profile", label: t.profile, icon: IdCard, exact: true },
  ];
};
const itemsFor = ({ showApplication, guideLang }: NavOptions) => [
  ...(guideLang ? guideItems(guideLang) : []),
  ...items,
  ...(showApplication ? [applicationItem] : []),
];
// "Trips" (/dashboard/guide) shouldn't light up on its sub-pages that have their own item
const guideOwnPages = ["/dashboard/guide/availability", "/dashboard/guide/profile"];

function isActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  if (href === "/dashboard/guide" && guideOwnPages.includes(pathname)) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

// ============================================================
// MOBILE — horizontal tab strip (visible below lg)
// ============================================================
export function DashboardTabs(opts: NavOptions) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-16 z-30 border-b border-forest-900/10 bg-paper-warm/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ul className="flex gap-2 overflow-x-auto py-1">
          {itemsFor(opts).map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors",
                    active
                      ? "border-forest-900 font-medium text-forest-900"
                      : "border-transparent text-ink-soft hover:text-forest-900",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

// ============================================================
// DESKTOP — vertical sidebar (visible from lg)
// ============================================================
export function DashboardSidebar(opts: NavOptions) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-32">
        <p className="eyebrow mb-4 text-forest-700">Account</p>
        <nav>
          <ul className="space-y-1">
            {itemsFor(opts).map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-forest-900 text-paper"
                        : "text-ink-soft hover:bg-forest-100 hover:text-forest-900",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
