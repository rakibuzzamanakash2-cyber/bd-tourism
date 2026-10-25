import { headers } from "next/headers";

// Shown on sign-up / sign-in when someone arrives from an invite link.
// Bilingual on purpose: we don't know yet which language they read best.
const ROLE = { GUIDE: ["a guide", "গাইড"], HOST: ["a homestay host", "হোমস্টে হোস্ট"] } as const;

// In-app browsers (Facebook, Messenger, Instagram, Android WebViews) block
// Google sign-in, so point people to email + password there.
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|; wv\)/i;

export async function InviteBanner({ kind, google }: { kind: "GUIDE" | "HOST"; google: boolean }) {
  const ua = (await headers()).get("user-agent") ?? "";
  const [en, bn] = ROLE[kind];
  return (
    <div role="status" className="mt-6 space-y-1 rounded-md border border-forest-700/20 bg-forest-100 px-4 py-3 text-sm text-forest-900">
      <p className="font-medium">You&rsquo;re invited to apply as {en}.</p>
      <p>First create your account (or sign in). Your application form opens straight after.</p>
      <p className="font-bengali">আপনাকে {bn} হিসেবে আবেদনের আমন্ত্রণ জানানো হয়েছে। আগে অ্যাকাউন্ট খুলুন, তারপরই আবেদন ফর্ম খুলবে।</p>
      {google && IN_APP.test(ua) && (
        <p className="pt-1 text-xs text-ink-soft">
          Google sign-in doesn&rsquo;t work inside this app&rsquo;s browser. Use email and password below, or open the link in Chrome or Safari.
        </p>
      )}
    </div>
  );
}
