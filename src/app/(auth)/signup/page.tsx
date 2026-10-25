import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";
import { features } from "@/lib/env";
import { safeCallbackUrl } from "@/lib/utils";
import { InviteBanner } from "@/components/auth/invite-banner";
import { applyPathFor, currentInvite } from "@/lib/invites";

export const metadata = {
  title: "Create an account",
  description:
    "Create your DeltaWay account to book tours, homestays, and permit-included trips.",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SignupPage({ searchParams }: Props) {
  // Arrived from an invite link: say so, fill in what we know, and make
  // sure they land on the form afterwards
  const invite = await currentInvite();
  const asked = safeCallbackUrl((await searchParams).callbackUrl);
  const callbackUrl = invite && asked === "/" ? applyPathFor(invite.kind, invite.language) : asked;
  const withCallback = (path: string) =>
    callbackUrl === "/" ? path : `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">Get started</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        Create an account.
      </h1>
      <p className="mt-3 text-ink-soft">
        Already have one?{" "}
        <Link
          href={withCallback("/login")}
          className="font-medium text-forest-800 underline underline-offset-4 hover:text-forest-700"
        >
          Sign in
        </Link>
      </p>

      {invite && <InviteBanner kind={invite.kind} google={features.google} />}

      {features.google ? (
        <>
          <div className="mt-10">
            <GoogleButton label="Sign up with Google" callbackUrl={callbackUrl} />
          </div>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-forest-900/10" />
            <span className="text-xs uppercase tracking-widest text-ink-mute">
              or
            </span>
            <div className="h-px flex-1 bg-forest-900/10" />
          </div>
        </>
      ) : (
        <div className="mt-10" />
      )}

      <SignupForm callbackUrl={callbackUrl} defaults={invite ? { name: invite.name ?? undefined, email: invite.email ?? undefined } : undefined} />

      <p className="mt-6 text-xs leading-relaxed text-ink-mute">
        By signing up you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
