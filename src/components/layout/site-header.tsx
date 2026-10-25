"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { LogOut, Menu, ShieldCheck, User } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth";

const nav = [
  { href: "/destinations", label: "Destinations" },
  { href: "/packages", label: "Tours" },
  { href: "/experiences", label: "Homestays" },
  { href: "/permits", label: "Permits" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-900 text-paper">
        <span className="font-display text-sm leading-none">DW</span>
      </div>
      <span className="font-display text-2xl leading-none">DeltaWay</span>
      <span className="hidden font-bengali text-lg text-forest-700 sm:inline">
        বাংলাদেশ
      </span>
    </Link>
  );
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0]?.toUpperCase() ?? "?";
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

function UserMenu() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  const initials = getInitials(session.user.name, session.user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-full bg-forest-900 text-sm font-medium text-paper hover:bg-forest-800 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:ring-offset-2">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? "You"}
            className="size-9 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </DropdownMenuTrigger>
     <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium text-ink">
              {session.user.name ?? "Traveler"}
            </p>
            <p className="truncate text-xs text-ink-mute">
              {session.user.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link
            href="/dashboard"
            className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-forest-100 focus:bg-forest-100"
          >
            <User className="size-4" />
            Dashboard
          </Link>
          {session.user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-forest-100 focus:bg-forest-100"
            >
              <ShieldCheck className="size-4" />
              Admin
            </Link>
          )}
          <DropdownMenuSeparator />
          <form action={signOutAction}>
            <button
              type="submit"
              className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-forest-100 focus:bg-forest-100"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated" && !!session?.user;

  return (
    <header className="sticky top-0 z-50 border-b border-forest-900/10 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Wordmark />

        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-soft transition-colors hover:text-forest-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {isAuthed ? (
            <UserMenu />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-ink-soft transition-colors hover:text-forest-900"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants(),
                  "rounded-full bg-forest-900 px-5 text-paper hover:bg-forest-800",
                )}
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          {isAuthed && <UserMenu />}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-forest-100"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-paper border-forest-900/10">
              <SheetTitle className="px-6 pt-6 font-display text-3xl">
                Menu
              </SheetTitle>
              <nav className="mt-8 flex flex-col gap-1 px-6">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="border-b border-forest-900/10 py-4 font-display text-2xl text-ink transition-colors hover:text-forest-800"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              {!isAuthed && (
                <div className="mt-8 flex flex-col gap-3 px-6">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="text-center text-ink-soft"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className={cn(
                      buttonVariants(),
                      "rounded-full bg-forest-900 text-paper hover:bg-forest-800",
                    )}
                  >
                    Sign up
                  </Link>
                </div>
              )}
              {isAuthed && session?.user && (
                <div className="mt-8 px-6">
                  <p className="eyebrow text-ink-mute">Signed in as</p>
                  <p className="mt-1 font-medium text-ink">
                    {session.user.name ?? "Traveler"}
                  </p>
                  <p className="text-sm text-ink-mute">{session.user.email}</p>
                  <div className="mt-6 flex flex-col gap-1">
                    {[
                      { href: "/dashboard", label: "Dashboard" },
                      { href: "/dashboard/bookings", label: "My bookings" },
                      { href: "/dashboard/saved", label: "Saved" },
                      { href: "/dashboard/profile", label: "Profile" },
                      ...(session.user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="py-2 text-ink-soft hover:text-forest-800"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <form action={signOutAction} className="mt-6">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 text-sm text-clay-700 hover:text-clay-600"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
