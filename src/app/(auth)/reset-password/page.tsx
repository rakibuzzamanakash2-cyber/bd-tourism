import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata = {
  title: "Choose a new password",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const tokenValue = typeof token === "string" ? token : "";

  return (
    <div>
      <p className="eyebrow mb-4 text-forest-700">Password reset</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        Choose a new password.
      </h1>
      {tokenValue ? (
        <div className="mt-10">
          <ResetPasswordForm token={tokenValue} />
        </div>
      ) : (
        <p className="mt-6 text-ink-soft">
          This link is missing its reset code. Please open the link from your
          email again, or{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-forest-800 underline underline-offset-4"
          >
            request a new one
          </Link>
          .
        </p>
      )}
    </div>
  );
}
