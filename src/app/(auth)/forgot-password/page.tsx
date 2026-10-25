import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata = {
  title: "Forgot password",
  description: "Reset the password for your Bangladesh Tourism account.",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">Password reset</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        Forgot your password?
      </h1>
      <p className="mt-3 text-ink-soft">
        Enter the email you signed up with and we&rsquo;ll send you a link to
        choose a new one. Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-forest-800 underline underline-offset-4 hover:text-forest-700"
        >
          Sign in
        </Link>
      </p>
      <div className="mt-10">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
