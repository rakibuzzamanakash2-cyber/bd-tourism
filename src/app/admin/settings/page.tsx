import { CheckCircle2, CircleDashed, AlertTriangle } from "lucide-react";
import { TestCloudinaryButton } from "@/components/admin/test-connection";
import { AdminPageHeader } from "@/components/admin/ui";
import { cloudinary, env, features } from "@/lib/env";
import { BDT_PER_USD } from "@/lib/booking-utils";
import { encryptionStatus } from "@/lib/crypto";
import { callbackUrls, paymentMode, type PaymentMode } from "@/lib/sslcommerz";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Settings" };

type State = "on" | "off" | "problem";

/** Shows the last 4 characters only, so keys never appear on screen. */
const mask = (v?: string) => (v ? `••••${v.slice(-4)}` : "—");

export default async function AdminSettingsPage() {
  await requireAdmin();

  const mode = paymentMode();
  const enc = encryptionStatus();
  const urls = callbackUrls();
  const isLocal = (u: string) => /^http:\/\/|localhost|127\.0\.0\.1/.test(u);
  const paymentProblems = [
    ...(isLocal(urls.ipn) ? [`The payment notice address (${urls.ipn}) isn't a public https address, so SSLCommerz can't reach it and payments won't be confirmed. Deploy the site, or use a tunnel such as ngrok for testing.`] : []),
    ...(env.SSLCOMMERZ_SANDBOX === "false" && mode !== "live" ? ["SSLCOMMERZ_SANDBOX=false no longer switches to live. Set SSLCOMMERZ_LIVE=true when you're ready for real payments."] : []),
    ...(mode === "live" && isLocal(env.NEXT_PUBLIC_APP_URL) ? ["Live mode is on but NEXT_PUBLIC_APP_URL isn't your public https address."] : []),
  ];

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
      purpose: "Online card and mobile-banking payments, in USD or BDT.",
      state: !features.payments ? "off" : paymentProblems.length ? "problem" : "on",
      detail: !features.payments
        ? "Not set up. Travelers see “pay via WhatsApp” instead, and you record bKash/bank/cash payments by hand on the booking."
        : `${mode === "live" ? "LIVE: real money is taken." : "Sandbox (test) mode: no real money is taken."} Store ${mask(env.SSLCOMMERZ_STORE_ID)}.`,
      extra: features.payments ? <PaymentChecklist mode={mode} problems={paymentProblems} ipn={urls.ipn} /> : undefined,
    },
    {
      name: "Passport encryption",
      purpose: "Passport numbers are encrypted before they're stored, and deleted 90 days after each trip.",
      state: enc.problem ? "problem" : enc.explicit ? "on" : "problem",
      detail: enc.problem
        ? enc.problem
        : enc.explicit
          ? "Using DATA_ENCRYPTION_KEY. Keep a safe copy of it: without it, stored passport numbers can't be read."
          : "Using a key made from AUTH_SECRET. Set DATA_ENCRYPTION_KEY (see .env.example) and never change it afterwards. Numbers saved before then stay readable.",
    },
    {
      name: "Exchange rate",
      purpose: "Used to show prices in both currencies and to work out what someone paying in taka pays.",
      state: "on",
      detail: `৳${BDT_PER_USD} per US dollar${process.env.NEXT_PUBLIC_BDT_PER_USD ? " (from NEXT_PUBLIC_BDT_PER_USD)" : " (default; set NEXT_PUBLIC_BDT_PER_USD to change it, then redeploy)"}.`,
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

function PaymentChecklist({ mode, problems, ipn }: { mode: PaymentMode; problems: string[]; ipn: string }) {
  return (
    <div className="space-y-3 text-sm">
      {problems.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-clay-700">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
      <p className="text-xs text-ink-mute">Payment notices go to <span className="font-mono">{ipn}</span></p>
      {mode === "sandbox" && (
        <details className="rounded-md bg-paper-warm p-3">
          <summary className="cursor-pointer font-medium">Going live, step by step</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-soft">
            <li>Get the trade licence, then apply for a live store at sslcommerz.com (they also ask for a bank account and NID).</li>
            <li>Make sure the site is online at its real https address, and NEXT_PUBLIC_APP_URL is set to it.</li>
            <li>In Vercel, set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD to the live store&rsquo;s values.</li>
            <li>Set SSLCOMMERZ_LIVE=true and redeploy. This page then says LIVE.</li>
            <li>Make one small real payment yourself, check it shows as Paid, then refund it from the booking.</li>
          </ol>
        </details>
      )}
    </div>
  );
}
