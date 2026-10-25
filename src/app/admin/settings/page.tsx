import { CheckCircle2, CircleDashed, AlertTriangle } from "lucide-react";
import { TestCloudinaryButton } from "@/components/admin/test-connection";
import { AdminPageHeader } from "@/components/admin/ui";
import { cloudinary, env, features } from "@/lib/env";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Settings" };

type State = "on" | "off" | "problem";

/** Shows the last 4 characters only, so keys never appear on screen. */
const mask = (v?: string) => (v ? `••••${v.slice(-4)}` : "—");

export default async function AdminSettingsPage() {
  await requireAdmin();

  const items: { name: string; purpose: string; state: State; detail: string; extra?: React.ReactNode }[] = [
    {
      name: "Photo uploads (Cloudinary)",
      purpose: "The Upload button in tour and destination forms.",
      state: cloudinary.configured ? "on" : cloudinary.problem ? "problem" : "off",
      detail: cloudinary.configured
        ? `Cloud "${cloudinary.cloudName}", API key ${mask(cloudinary.apiKey)} (from ${cloudinary.source === "CLOUDINARY_URL" ? "CLOUDINARY_URL" : "the three CLOUDINARY_ values"}).`
        : (cloudinary.problem ?? "Not set up. Add CLOUDINARY_URL to .env, then restart. Until then, paste photo links."),
      extra: cloudinary.configured || cloudinary.problem ? <TestCloudinaryButton /> : undefined,
    },
    {
      name: "Email (Resend)",
      purpose: "Receipts, confirmations, password resets and team notifications.",
      state: features.email ? "on" : "off",
      detail: features.email
        ? `Sending from ${env.EMAIL_FROM ?? "onboarding@resend.dev (Resend's test sender)"}; team emails go to ${env.ADMIN_EMAIL ?? "the site email"}.`
        : "Not set up. Emails are skipped; password-reset links print in the terminal.",
    },
    {
      name: "Payments (SSLCommerz)",
      purpose: "Online card and mobile-banking payments.",
      state: features.payments ? "on" : "off",
      detail: features.payments
        ? `${env.SSLCOMMERZ_SANDBOX === "true" ? "Sandbox (test) mode" : "LIVE mode"}, store ${mask(env.SSLCOMMERZ_STORE_ID)}.${env.SSLCOMMERZ_IPN_URL ? "" : " ⚠ SSLCOMMERZ_IPN_URL is empty, so payments won't be confirmed."}`
        : "Not set up. The Pay button says payments aren't configured; you can still record bKash/bank/cash payments by hand.",
    },
    {
      name: "Google sign-in",
      purpose: "The \"Continue with Google\" button.",
      state: features.google ? "on" : "off",
      detail: features.google ? `Client ID ${mask(env.AUTH_GOOGLE_ID)}.` : "Not set up. The button is hidden; email sign-in still works.",
    },
    {
      name: "Scheduled jobs",
      purpose: "Nightly expiry of unpaid bookings on Vercel.",
      state: env.CRON_SECRET ? "on" : "off",
      detail: env.CRON_SECRET
        ? "CRON_SECRET is set."
        : "CRON_SECRET not set. Fine on your PC (unpaid bookings still expire when opened); set it before deploying.",
    },
  ];

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Settings"
        description="Which outside services are connected. Values come from the .env file; after changing it, restart the app."
      />
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.name} className="rounded-lg border border-forest-900/10 p-5">
            <div className="flex items-start gap-3">
              <StateIcon state={i.state} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{i.name}</p>
                  <span className="text-xs uppercase tracking-wider text-ink-mute">
                    {i.state === "on" ? "Set up" : i.state === "problem" ? "Needs fixing" : "Off"}
                  </span>
                </div>
                <p className="text-xs text-ink-mute">{i.purpose}</p>
                <p className={`text-sm ${i.state === "problem" ? "text-clay-700" : "text-ink-soft"}`}>{i.detail}</p>
                {i.extra}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StateIcon({ state }: { state: State }) {
  if (state === "on") return <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-forest-700" aria-hidden />;
  if (state === "problem") return <AlertTriangle className="mt-0.5 size-5 shrink-0 text-clay-600" aria-hidden />;
  return <CircleDashed className="mt-0.5 size-5 shrink-0 text-ink-mute" aria-hidden />;
}
