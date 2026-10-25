import Link from "next/link";
import type { Metadata } from "next";
import { AdminSidebar, AdminTabs } from "@/components/admin/admin-nav";
import { signOutAction } from "@/lib/actions/auth";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · DeltaWay" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const newMessages = await db.contactMessage.count({ where: { status: "NEW" } });

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 h-14 border-b border-forest-900/10 bg-forest-950 text-paper">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-display text-xl">DeltaWay</span>
            <span className="rounded bg-paper/15 px-2 py-0.5 text-xs uppercase tracking-wider">Admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-paper/70 sm:inline">{admin.email}</span>
            <Link href="/" className="text-paper/85 hover:text-paper">
              View site
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="text-paper/85 hover:text-paper">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <AdminTabs newMessages={newMessages} />
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[200px_1fr] lg:gap-10 lg:py-10">
        <AdminSidebar newMessages={newMessages} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
