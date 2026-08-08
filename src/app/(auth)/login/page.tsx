import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your Bangladesh Tourism account.",
};

export default function LoginPage() {
  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">Sign in</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        Welcome back.
      </h1>
      <p className="mt-3 text-ink-soft">
        Don&rsquo;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-forest-800 underline underline-offset-4 hover:text-forest-700"
        >
          Sign up
        </Link>
      </p>

      <div className="mt-10">
        <GoogleButton label="Continue with Google" />
      </div>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-forest-900/10" />
        <span className="text-xs uppercase tracking-widest text-ink-mute">
          or
        </span>
        <div className="h-px flex-1 bg-forest-900/10" />
      </div>

      <LoginForm />
    </div>
  );
}
