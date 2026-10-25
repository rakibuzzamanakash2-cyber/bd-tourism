import { redirect } from "next/navigation";
import { auth } from "@/auth";

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
