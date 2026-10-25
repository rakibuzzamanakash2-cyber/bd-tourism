"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CreditCard,
  FileCheck,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Map,
  MapPin,
  Route,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/permits", label: "Permits", icon: FileCheck },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/tours", label: "Tours", icon: Route },
  { href: "/admin/destinations", label: "Destinations", icon: MapPin },
  { href: "/admin/regions", label: "Regions & types", icon: Map },
  { href: "/admin/waitlist", label: "Waitlist", icon: ListChecks },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const isActive = (pathname: string, href: string, exact = false) =>
  exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

/** Scrollable tab strip, shown on phones and tablets. */
export function AdminTabs({ newMessages }: { newMessages: number }) {
  const pathname = usePathname();
  return (
    <nav className="sticky top-14 z-30 border-b border-forest-900/10 bg-paper-warm/95 backdrop-blur lg:hidden">
      <ul className="flex gap-1 overflow-x-auto px-4">
        {items.map(({ href, label, exact }) => (
          <li key={href} className="shrink-0">
            <Link
              href={href}
              className={cn(
                "inline-block border-b-2 px-3 py-3 text-sm whitespace-nowrap",
                isActive(pathname, href, exact)
                  ? "border-forest-900 font-medium text-forest-900"
                  : "border-transparent text-ink-soft",
              )}
            >
              {label}
              {href === "/admin/messages" &&
                newMessages > 0 &&
                ` (${newMessages})`}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Sidebar, shown on desktop. */
export function AdminSidebar({ newMessages }: { newMessages: number }) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:block">
      <ul className="sticky top-24 space-y-1">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-forest-900 text-paper"
                    : "text-ink-soft hover:bg-forest-100 hover:text-forest-900",
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {href === "/admin/messages" && newMessages > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-2 text-xs",
                      active ? "bg-paper/20" : "bg-clay-600 text-paper",
                    )}
                  >
                    {newMessages}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
