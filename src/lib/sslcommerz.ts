// ============================================================
// SSLCommerz API wrapper
// Docs: https://developer.sslcommerz.com/doc/v4/
// ============================================================

const SANDBOX_INIT_URL =
  "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
const LIVE_INIT_URL =
  "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

const SANDBOX_VALIDATE_URL =
  "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";
const LIVE_VALIDATE_URL =
  "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

function isSandbox() {
  return process.env.SSLCOMMERZ_SANDBOX === "true";
}

// ============================================================
// INITIATE PAYMENT
// ============================================================

export type PaymentInitPayload = {
  amountUSD: number;
  tranId: string;
  bookingCode: string;
  packageTitle: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
};

export type PaymentInitResult =
  | { success: true; gatewayUrl: string; sessionKey: string }
  | { success: false; error: string };

export async function initiatePayment(
  payload: PaymentInitPayload,
): Promise<PaymentInitResult> {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePwd = process.env.SSLCOMMERZ_STORE_PASSWORD;

  if (!storeId || !storePwd) {
    return {
      success: false,
      error: "SSLCommerz not configured. Missing store credentials.",
    };
  }

  const formData = new URLSearchParams();
  formData.append("store_id", storeId);
  formData.append("store_passwd", storePwd);
  formData.append("total_amount", payload.amountUSD.toFixed(2));
  formData.append("currency", "USD");
  formData.append("tran_id", payload.tranId);

  formData.append("success_url", process.env.SSLCOMMERZ_SUCCESS_URL ?? "");
  formData.append("fail_url", process.env.SSLCOMMERZ_FAIL_URL ?? "");
  formData.append("cancel_url", process.env.SSLCOMMERZ_CANCEL_URL ?? "");
  formData.append("ipn_url", process.env.SSLCOMMERZ_IPN_URL ?? "");

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

  formData.append(
    "product_name",
    `${payload.packageTitle} (${payload.bookingCode})`,
  );
  formData.append("product_category", "Tourism");
  formData.append("product_profile", "general");

  const url = isSandbox() ? SANDBOX_INIT_URL : LIVE_INIT_URL;

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = await res.json();

    if (data.status === "SUCCESS" && data.GatewayPageURL) {
      return {
        success: true,
        gatewayUrl: data.GatewayPageURL as string,
        sessionKey: data.sessionkey as string,
      };
    }

    return {
      success: false,
      error:
        data.failedreason ||
        data.error ||
        "Payment initiation failed. Please try again.",
    };
  } catch (err) {
    console.error("SSLCommerz init error:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Network error contacting SSLCommerz.",
    };
  }
}

// ============================================================
// VALIDATE PAYMENT
// Called from IPN webhook to authoritatively confirm a transaction
// ============================================================

export type PaymentValidationResult = {
  valid: boolean;
  status?: string;
  tranId?: string;
  amount?: number;
  currency?: string;
  /** Amount in the currency the order was created in (e.g. USD). */
  currencyAmount?: number;
  /** Currency the order was created in (e.g. "USD"). */
  currencyType?: string;
  raw?: Record<string, unknown>;
};

export async function validatePayment(
  valId: string,
): Promise<PaymentValidationResult> {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePwd = process.env.SSLCOMMERZ_STORE_PASSWORD;

  if (!storeId || !storePwd) {
    return { valid: false };
  }

  const url = isSandbox() ? SANDBOX_VALIDATE_URL : LIVE_VALIDATE_URL;
  const params = new URLSearchParams({
    val_id: valId,
    store_id: storeId,
    store_passwd: storePwd,
    format: "json",
  });

  try {
    const res = await fetch(`${url}?${params.toString()}`);
    const data = await res.json();

    const isValid = data.status === "VALID" || data.status === "VALIDATED";
    return {
      valid: isValid,
      status: data.status,
      tranId: data.tran_id,
      amount: data.amount ? parseFloat(data.amount) : undefined,
      currency: data.currency,
      currencyAmount: data.currency_amount
        ? parseFloat(data.currency_amount)
        : undefined,
      currencyType: data.currency_type,
      raw: data,
    };
  } catch (err) {
    console.error("SSLCommerz validate error:", err);
    return { valid: false };
  }
}
