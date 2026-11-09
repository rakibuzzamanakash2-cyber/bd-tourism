import { env } from "@/lib/env";
// ============================================================
// SSLCommerz API wrapper
// Docs: https://developer.sslcommerz.com/doc/v4/
// ============================================================

const HOST = { sandbox: "https://sandbox.sslcommerz.com", live: "https://securepay.sslcommerz.com" } as const;

export type PaymentMode = "sandbox" | "live";

/** Live only when SSLCOMMERZ_LIVE is exactly "true". Everything else is a test. */
export function paymentMode(): PaymentMode {
  return env.SSLCOMMERZ_LIVE === "true" ? "live" : "sandbox";
}

const base = () => HOST[paymentMode()];

/** Where SSLCommerz sends people and payment notices. Worked out from the site address unless set. */
export function callbackUrls() {
  const app = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    success: env.SSLCOMMERZ_SUCCESS_URL || `${app}/api/payments/success`,
    fail: env.SSLCOMMERZ_FAIL_URL || `${app}/api/payments/fail`,
    cancel: env.SSLCOMMERZ_CANCEL_URL || `${app}/api/payments/cancel`,
    ipn: env.SSLCOMMERZ_IPN_URL || `${app}/api/webhooks/sslcommerz`,
  };
}

function credentials() {
  const storeId = env.SSLCOMMERZ_STORE_ID;
  const storePwd = env.SSLCOMMERZ_STORE_PASSWORD;
  return storeId && storePwd ? { storeId, storePwd } : null;
}

// ============================================================
// INITIATE PAYMENT
// ============================================================
export type PayCurrency = "USD" | "BDT";

export type PaymentInitPayload = {
  amount: number;
  currency: PayCurrency;
  tranId: string;
  bookingCode: string;
  packageTitle: string;
  customer: { name: string; email: string; phone: string };
};

export type PaymentInitResult = { success: true; gatewayUrl: string; sessionKey: string } | { success: false; error: string };

export async function initiatePayment(payload: PaymentInitPayload): Promise<PaymentInitResult> {
  const creds = credentials();
  if (!creds) return { success: false, error: "SSLCommerz not configured. Missing store credentials." };
  const urls = callbackUrls();

  const formData = new URLSearchParams();
  formData.append("store_id", creds.storeId);
  formData.append("store_passwd", creds.storePwd);
  formData.append("total_amount", payload.amount.toFixed(2));
  formData.append("currency", payload.currency);
  formData.append("tran_id", payload.tranId);
  formData.append("success_url", urls.success);
  formData.append("fail_url", urls.fail);
  formData.append("cancel_url", urls.cancel);
  formData.append("ipn_url", urls.ipn);
  formData.append("cus_name", payload.customer.name);
  formData.append("cus_email", payload.customer.email);
  formData.append("cus_add1", "N/A");
  formData.append("cus_city", "N/A");
  formData.append("cus_country", "Bangladesh");
  formData.append("cus_phone", payload.customer.phone);
  formData.append("shipping_method", "NO");
  formData.append("ship_name", payload.customer.name);
  formData.append("ship_add1", "N/A");
  formData.append("ship_city", "N/A");
  formData.append("ship_country", "Bangladesh");
  formData.append("product_name", `${payload.packageTitle} (${payload.bookingCode})`.slice(0, 250));
  formData.append("product_category", "Tourism");
  formData.append("product_profile", "general");

  try {
    const res = await fetch(`${base()}/gwprocess/v4/api.php`, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await res.json();
    if (data.status === "SUCCESS" && data.GatewayPageURL) {
      return { success: true, gatewayUrl: data.GatewayPageURL as string, sessionKey: data.sessionkey as string };
    }
    return { success: false, error: data.failedreason || data.error || "Payment initiation failed. Please try again." };
  } catch (err) {
    console.error("SSLCommerz init error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network error contacting SSLCommerz." };
  }
}

// ============================================================
// VALIDATE PAYMENT (called from the IPN to confirm a transaction)
// ============================================================
export type PaymentValidationResult = {
  valid: boolean;
  status?: string;
  tranId?: string;
  /** Amount charged, in taka */
  amount?: number;
  currency?: string;
  /** Amount in the currency the order was created in (e.g. USD) */
  currencyAmount?: number;
  /** Currency the order was created in ("USD" or "BDT") */
  currencyType?: string;
  bankTranId?: string;
  /** e.g. "BKASH-BKash", "VISA-Dutch Bangla" */
  cardType?: string;
  raw?: Record<string, unknown>;
};

export async function validatePayment(valId: string): Promise<PaymentValidationResult> {
  const creds = credentials();
  if (!creds) return { valid: false };
  const params = new URLSearchParams({ val_id: valId, store_id: creds.storeId, store_passwd: creds.storePwd, format: "json" });
  try {
    const res = await fetch(`${base()}/validator/api/validationserverAPI.php?${params}`);
    const data = await res.json();
    return {
      valid: data.status === "VALID" || data.status === "VALIDATED",
      status: data.status,
      tranId: data.tran_id,
      amount: data.amount ? parseFloat(data.amount) : undefined,
      currency: data.currency,
      currencyAmount: data.currency_amount ? parseFloat(data.currency_amount) : undefined,
      currencyType: data.currency_type,
      bankTranId: data.bank_tran_id,
      cardType: data.card_type,
      raw: data,
    };
  } catch (err) {
    console.error("SSLCommerz validate error:", err);
    return { valid: false };
  }
}

// ============================================================
// REFUNDS
// SSLCommerz refunds in taka against the original bank transaction.
// ============================================================
export type RefundResult = { ok: true; refundRefId: string; status: string } | { ok: false; error: string };

export async function initiateRefund(input: { bankTranId: string; refundTransId: string; amountBDT: number; remarks: string }): Promise<RefundResult> {
  const creds = credentials();
  if (!creds) return { ok: false, error: "SSLCommerz isn't configured." };
  const params = new URLSearchParams({
    bank_tran_id: input.bankTranId,
    refund_trans_id: input.refundTransId,
    refund_amount: input.amountBDT.toFixed(2),
    refund_remarks: input.remarks.slice(0, 250),
    store_id: creds.storeId,
    store_passwd: creds.storePwd,
    v: "1",
    format: "json",
  });
  try {
    const res = await fetch(`${base()}/validator/api/merchantTransIDvalidationAPI.php?${params}`);
    const data = await res.json();
    if (data.APIConnect !== "DONE") return { ok: false, error: `SSLCommerz didn't accept the request (${data.APIConnect ?? "no answer"}).` };
    if (data.status === "failed" || !data.refund_ref_id) return { ok: false, error: data.errorReason || "SSLCommerz refused the refund." };
    return { ok: true, refundRefId: String(data.refund_ref_id), status: String(data.status) };
  } catch (err) {
    console.error("SSLCommerz refund error:", err);
    return { ok: false, error: "Couldn't reach SSLCommerz. Try again in a minute." };
  }
}

export async function refundStatus(refundRefId: string): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const creds = credentials();
  if (!creds) return { ok: false, error: "SSLCommerz isn't configured." };
  const params = new URLSearchParams({ refund_ref_id: refundRefId, store_id: creds.storeId, store_passwd: creds.storePwd, format: "json" });
  try {
    const res = await fetch(`${base()}/validator/api/merchantTransIDvalidationAPI.php?${params}`);
    const data = await res.json();
    if (data.APIConnect !== "DONE") return { ok: false, error: `SSLCommerz didn't answer (${data.APIConnect ?? "no answer"}).` };
    return { ok: true, status: String(data.status ?? "unknown") };
  } catch {
    return { ok: false, error: "Couldn't reach SSLCommerz. Try again in a minute." };
  }
}
