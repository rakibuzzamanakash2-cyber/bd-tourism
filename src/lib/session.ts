import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Returns the signed-in user, or redirects to the login page.
 *
 * Use this in every protected page. Next.js renders a layout and its page at
 * the same time, so a redirect in the layout does NOT stop the page from
 * running — each page has to check for itself.
 */
export async function requireUser(callbackUrl = "/dashboard") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session.user;
}

/**
 * Returns the signed-in admin, or hides the page.
 *
 * The role is checked against the database on every call (not just the login
 * token), so removing someone's admin access works immediately. Non-admins
 * get a normal 404, so the admin area doesn't reveal that it exists.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin")}`);
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user || user.role !== "ADMIN") notFound();
  return user;
}

/** Same check for server actions: returns the admin or null (never redirects). */
export async function getAdminOrNull() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  return user?.role === "ADMIN" ? user : null;
}

/**
 * Returns the signed-in guide and their profile (null while it's being set
 * up), or hides the page. Role is read from the database, like admins.
 */
export async function requireGuide(callbackUrl = "/dashboard/guide") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, guideProfile: true },
  });
  if (!user || user.role !== "GUIDE") notFound();
  return { user, profile: user.guideProfile };
}
