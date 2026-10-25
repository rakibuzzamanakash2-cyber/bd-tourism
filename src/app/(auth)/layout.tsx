import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If already signed in, redirect home
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — form column */}
      <div className="relative flex flex-col bg-paper">
        {/* Top brand strip */}
        <div className="border-b border-forest-900/10 px-6 py-5 sm:px-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-900 text-paper">
              <span className="font-display text-sm leading-none">DW</span>
            </div>
            <span className="font-display text-2xl leading-none">
              DeltaWay
            </span>
            <span className="font-bengali text-lg text-forest-700">
              বাংলাদেশ
            </span>
          </Link>
        </div>

        {/* Form area — centered */}
        <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Bottom link */}
        <div className="border-t border-forest-900/10 px-6 py-5 text-center text-xs text-ink-mute sm:px-10">
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-forest-800"
          >
            ← Back to home
          </Link>
        </div>
      </div>

      {/* Right — brand column (desktop only) */}
      <div className="relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1602800458591-eddda28a498b?w=1800&q=85"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-forest-950/70 via-forest-950/60 to-forest-950/85" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-paper">
          <div />
          <div>
            <p className="font-bengali text-6xl leading-tight text-paper">
              স্বাগতম
            </p>
            <p className="mt-6 font-display text-3xl italic text-paper/85">
              You&rsquo;re one form away from planning a trip most people
              never take.
            </p>
          </div>
          <p className="text-xs text-paper/60">
            Photograph: Sundarbans mangrove waterway
          </p>
        </div>
      </div>
    </div>
  );
}
