import { Resend } from "resend";
import { env } from "@/lib/env";

// Lazy-initialize so missing API key doesn't crash the build
function getResend() {
  const key = env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

type ReceiptData = {
  to: string;
  travelerName: string;
  bookingCode: string;
  packageTitle: string;
  dateRange: string;
  travelerCount: number;
  amountPaid: number;
  bookingUrl: string;
  hasPermit: boolean;
};

export async function sendPaymentReceipt(
  data: ReceiptData,
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return { success: false, error: "Email service not configured" };
  }

  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";

  try {
    const html = receiptHtml(data);
    const result = await resend.emails.send({
      from,
      to: data.to,
      subject: `Booking confirmed — ${data.bookingCode}`,
      html,
    });

    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return {
        success: false,
        error: result.error.message || "Failed to send email",
      };
    }

    console.log(`[email] Receipt sent to ${data.to} (id: ${result.data?.id})`);
    return { success: true };
  } catch (err) {
    console.error("[email] Exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================
// PASSWORD RESET
// ============================================================
export async function sendPasswordResetEmail(data: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping reset email");
    return { success: false, error: "Email service not configured" };
  }

  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";

  try {
    const result = await resend.emails.send({
      from,
      to: data.to,
      subject: "Reset your password",
      html: `<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:32px 16px; background-color:#FAF8F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1A1D1B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; margin:0 auto; background:#FFFFFF; border-radius:8px;">
    <tr>
      <td style="padding:40px 32px;">
        <h1 style="margin:0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size:28px; font-weight:400;">Reset your password</h1>
        <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#3B4340;">
          Hi ${escapeHtml(data.name)}, we got a request to reset the password for your DeltaWay account. This link works once and expires in 1 hour.
        </p>
        <p style="margin:0 0 24px;">
          <a href="${data.resetUrl}" style="display:inline-block; background:#1B3D2F; color:#FAF8F1; text-decoration:none; padding:14px 28px; border-radius:9999px; font-size:14px; font-weight:500;">Choose a new password</a>
        </p>
        <p style="margin:0; font-size:13px; line-height:1.6; color:#6B7570;">
          If you didn&rsquo;t ask for this, you can ignore this email &mdash; your password won&rsquo;t change.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { success: false, error: result.error.message || "Failed to send email" };
    }
    return { success: true };
  } catch (err) {
    console.error("[email] Exception:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ============================================================
// HTML EMAIL TEMPLATE
// Uses inline styles because email clients ignore <style> and external CSS.
// Table-based layout for compatibility with older clients (Outlook).
// ============================================================
function receiptHtml(d: ReceiptData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Booking confirmed — ${d.bookingCode}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF8F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#1A1D1B; -webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAF8F1;">
  <tr>
    <td style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto; max-width:600px; background:#FAF8F1;">

        <!-- Header -->
        <tr>
          <td style="background:#1B3D2F; padding:24px 32px; border-radius:8px 8px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color:#FAF8F1; font-size:18px; font-weight:500; letter-spacing:-0.01em;">
                  DeltaWay
                </td>
                <td align="right" style="color:#D4E0C6; font-size:11px; letter-spacing:0.15em; text-transform:uppercase;">
                  Booking Receipt
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Main content -->
        <tr>
          <td style="background:#FFFFFF; padding:40px 32px;">
            <p style="margin:0 0 8px; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:#2F6B4F;">
              Payment received
            </p>
            <h1 style="margin:0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size:32px; line-height:1.1; color:#1A1D1B; font-weight:400;">
              You&rsquo;re going to Bangladesh.
            </h1>
            <p style="margin:0 0 32px; font-size:15px; line-height:1.6; color:#3B4340;">
              Hi ${escapeHtml(d.travelerName)}, thank you for your booking. Your payment has been received and your booking is confirmed. Here are the details.
            </p>

            <!-- Booking code -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F1E6; border-radius:8px; margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 6px; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:#6B7570;">
                    Booking code
                  </p>
                  <p style="margin:0; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size:20px; color:#1B3D2F; font-weight:500;">
                    ${d.bookingCode}
                  </p>
                </td>
              </tr>
            </table>

            <!-- Trip details -->
            <p style="margin:0 0 12px; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:#2F6B4F;">
              Your trip
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid rgba(27,61,47,0.1); border-radius:8px; margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px; border-bottom:1px solid rgba(27,61,47,0.08);">
                  <p style="margin:0 0 4px; font-size:12px; color:#6B7570;">Tour</p>
                  <p style="margin:0; font-size:16px; color:#1A1D1B; font-weight:500;">${escapeHtml(d.packageTitle)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px; border-bottom:1px solid rgba(27,61,47,0.08);">
                  <p style="margin:0 0 4px; font-size:12px; color:#6B7570;">Dates</p>
                  <p style="margin:0; font-size:15px; color:#1A1D1B;">${escapeHtml(d.dateRange)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px; font-size:12px; color:#6B7570;">Travelers</p>
                  <p style="margin:0; font-size:15px; color:#1A1D1B;">${d.travelerCount} ${d.travelerCount === 1 ? "traveler" : "travelers"}</p>
                </td>
              </tr>
            </table>

            <!-- Amount paid -->
            <p style="margin:0 0 12px; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:#2F6B4F;">
              Amount paid
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F1E6; border-radius:8px; margin-bottom:32px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size:32px; color:#1B3D2F; font-weight:400;">
                    $${d.amountPaid.toFixed(2)} <span style="font-size:16px; color:#6B7570;">USD</span>
                  </p>
                </td>
              </tr>
            </table>

            <!-- What happens next -->
            <p style="margin:0 0 16px; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:#2F6B4F;">
              What happens next
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
              ${nextSteps(d.hasPermit)}
            </table>

            <!-- CTA -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="${d.bookingUrl}" style="display:inline-block; background:#1B3D2F; color:#FAF8F1; text-decoration:none; padding:14px 28px; border-radius:9999px; font-size:14px; font-weight:500;">
                    View booking
                  </a>
                </td>
              </tr>
            </table>

            <!-- Support note -->
            <p style="margin:0 0 8px; font-size:13px; line-height:1.6; color:#6B7570;">
              Questions or need to change something? Reply to this email or contact us at
              <a href="mailto:hello@bangladeshtourism.co" style="color:#2F6B4F; text-decoration:underline;">hello@bangladeshtourism.co</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F5F1E6; padding:24px 32px; text-align:center; border-radius:0 0 8px 8px;">
            <p style="margin:0 0 4px; font-size:12px; color:#3B4340;">
              DeltaWay
            </p>
            <p style="margin:0; font-size:11px; color:#6B7570;">
              Dhanmondi, Dhaka 1209, Bangladesh
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function nextSteps(hasPermit: boolean): string {
  const steps = hasPermit
    ? [
        "We&rsquo;ll start your permit application within 24 hours.",
        "You&rsquo;ll receive an email once your permit is approved (usually 5&ndash;7 working days).",
        "Around 7 days before your trip, we&rsquo;ll send a full brief with your guide&rsquo;s contact details.",
      ]
    : [
        "We&rsquo;ll confirm your booking within 24 hours.",
        "Around 7 days before your trip, we&rsquo;ll send a full brief with your guide&rsquo;s contact details.",
      ];

  return steps
    .map(
      (s) => `
      <tr>
        <td style="padding:12px 0; font-size:14px; line-height:1.6; color:#3B4340; border-bottom:1px solid rgba(27,61,47,0.08);">
          <span style="color:#2F6B4F; margin-right:8px;">&bull;</span> ${s}
        </td>
      </tr>`,
    )
    .join("");
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
