import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await auth();

  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    include: { touristProfile: true },
  });

  if (!user) notFound();

  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">Profile</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        Your details.
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
        Basic details we&rsquo;ll need when handling permits, guides, and
        homestay matching. Everything is optional except your name — but the
        more we have, the smoother booking gets.
      </p>

      <div className="mt-12 max-w-2xl">
        <ProfileForm
          user={{ name: user.name, email: user.email }}
          profile={user.touristProfile}
        />
      </div>
    </div>
  );
}
