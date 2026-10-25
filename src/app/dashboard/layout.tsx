import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/site-header";
import {
  DashboardSidebar,
  DashboardTabs,
} from "@/components/dashboard/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const hasApplication =
    (await db.partnerApplication.count({ where: { userId: session.user.id } })) > 0;

  return (
    <>
      <SiteHeader />
      <DashboardTabs showApplication={hasApplication} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-16">
          <DashboardSidebar showApplication={hasApplication} />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}
