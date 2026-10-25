import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";
import { features } from "@/lib/env";

export const metadata = {
  title: "Create an account",
  description:
    "Create your DeltaWay account to book tours, homestays, and permit-included trips.",
};

export default function SignupPage() {
  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">Get started</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        Create an account.
      </h1>
      <p className="mt-3 text-ink-soft">
        Already have one?{" "}
        <Link
          href="/login"
          className="font-medium text-forest-800 underline underline-offset-4 hover:text-forest-700"
        >
          Sign in
        </Link>
      </p>

      {features.google ? (
        <>
          <div className="mt-10">
            <GoogleButton label="Sign up with Google" />
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

      <SignupForm />

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
