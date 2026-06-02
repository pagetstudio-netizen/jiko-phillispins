const SOLEASPAY_API_URL = "https://soleaspay.com";

export const SOLEASPAY_SERVICE_MAP: Record<string, Record<string, number>> = {
  PH: {
    "GCash": 60,
    "Maya": 61,
  },
};

export const CURRENCY_MAP: Record<string, string> = {
  PH: "PHP",
};

interface SoleaspayPaymentRequest {
  wallet: string;
  amount: number;
  currency: string;
  order_id: string;
  description: string;
  payer: string;
  payerEmail: string;
  successUrl: string;
  failureUrl: string;
}

interface SoleaspayPaymentResponse {
  success: boolean;
  code?: number;
  status?: string;
  created_at?: string;
  data?: {
    operation: string;
    reference: string;
    external_reference: string;
    transaction_reference: string | null;
    transaction_category: string;
    transaction_channel: string;
    amount: string;
    currency: string;
  };
  message?: string;
}

interface SoleaspayVerifyResponse {
  success: boolean;
  code?: number;
  status?: string;
  created_at?: string;
  data?: {
    operation: string;
    reference: string;
    external_reference: string;
    transaction_reference: string;
    amount: number;
    currency: string;
  };
  message?: string;
}

export function getServiceId(country: string, paymentMethod: string): number | null {
  const countryServices = SOLEASPAY_SERVICE_MAP[country];
  if (!countryServices) return null;
  return countryServices[paymentMethod] || null;
}

export function getCurrency(country: string): string {
  return CURRENCY_MAP[country] || "PHP";
}

export function isSoleaspaySupported(country: string, paymentMethod: string): boolean {
  return getServiceId(country, paymentMethod) !== null;
}

const PHONE_PREFIX_MAP: Record<string, string> = {
  PH: "63",
};

export function formatWallet(phone: string, country: string): string {
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  const prefix = PHONE_PREFIX_MAP[country];
  if (!prefix) return cleaned;
  if (cleaned.startsWith(prefix)) return cleaned;
  if (cleaned.startsWith("0")) return prefix + cleaned.substring(1);
  return prefix + cleaned;
}

export async function initiatePayment(
  apiKey: string,
  wallet: string,
  amount: number,
  country: string,
  paymentMethod: string,
  orderId: string,
  payerName: string,
  payerEmail: string = "customer@noviqra.ai"
): Promise<SoleaspayPaymentResponse> {
  const serviceId = getServiceId(country, paymentMethod);
  if (!serviceId) {
    throw new Error(`Service non supporte pour ${country} - ${paymentMethod}`);
  }

  const currency = getCurrency(country);
  const baseUrl = process.env.APP_URL || `https://polaroidaut.top`;

  const requestBody: SoleaspayPaymentRequest = {
    wallet: formatWallet(wallet, country),
    amount,
    currency,
    order_id: orderId,
    description: `Depot Noviqra Ai #${orderId}`,
    payer: payerName,
    payerEmail,
    successUrl: `${baseUrl}/deposit-success`,
    failureUrl: `${baseUrl}/deposit-failed`,
  };

  const effectiveKey = apiKey || process.env.SOLEASPAY_API_KEY || "";
  console.log("[soleaspay] initiatePayment request:", JSON.stringify(requestBody));

  const response = await fetch(`${SOLEASPAY_API_URL}/api/agent/bills/v3`, {
    method: "POST",
    headers: {
      "x-api-key": effectiveKey,
      "operation": "2",
      "service": serviceId.toString(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json() as SoleaspayPaymentResponse;
  console.log("[soleaspay] initiatePayment response:", JSON.stringify(result));
  return result;
}

export async function verifyPayment(apiKey: string, orderId: string, payId: string): Promise<SoleaspayVerifyResponse> {
  const effectiveKey = apiKey || process.env.SOLEASPAY_API_KEY || "";
  const response = await fetch(
    `${SOLEASPAY_API_URL}/api/agent/verif-pay?orderId=${orderId}&payId=${payId}`,
    {
      method: "GET",
      headers: {
        "x-api-key": effectiveKey,
        "Content-Type": "application/json",
      },
    }
  );

  const result = await response.json() as SoleaspayVerifyResponse;
  return result;
}

export function mapSoleaspayStatus(status: string | undefined): "pending" | "approved" | "rejected" {
  if (!status) return "pending";
  
  const upperStatus = status.toUpperCase();
  
  if (upperStatus === "SUCCESS" || upperStatus === "COMPLETED") {
    return "approved";
  }
  if (upperStatus === "FAILURE" || upperStatus === "FAILED" || upperStatus === "REFUND") {
    return "rejected";
  }
  return "pending";
}
