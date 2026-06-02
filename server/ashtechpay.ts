const BASE_URL = "https://ashtechpay.top";

export const ASHTECH_CURRENCIES: Record<string, string> = {
  PH: "PHP",
};

export const ASHTECH_OPERATORS: Record<string, string[]> = {
  PH: ["GCash", "Maya"],
};

export type AshtechFlowType = "ussd_push" | "otp_sms" | "otp_ussd" | "wave";

export interface AshtechInitiateResult {
  flow: AshtechFlowType;
  transactionId: string;
  waveUrl?: string;
  ussdCode?: string;
  status: string;
  amount: number;
  creditedAmount: number;
}

export interface AshtechPaymentParams {
  amount: number;
  currency: string;
  phone: string;
  operator: string;
  country_code: string;
  reference?: string;
  otp?: string;
  notify_url?: string;
}

export async function initiatePayment(
  apiKey: string,
  params: AshtechPaymentParams
): Promise<{ httpStatus: number; data: any }> {
  const res = await fetch(`${BASE_URL}/v1/collect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  return { httpStatus: res.status, data };
}

export async function getTransactionStatus(
  apiKey: string,
  transactionId: string
): Promise<any> {
  const res = await fetch(`${BASE_URL}/v1/transaction/${transactionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return res.json();
}

export async function getCountries(apiKey: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/v1/countries`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export function detectFlow(httpStatus: number, data: any): AshtechFlowType | null {
  // OTP required (can be 400 or 200)
  if (data.error === "otp_required" || data.otp_required === true) {
    return data.ussd_code ? "otp_ussd" : "otp_sms";
  }
  // Wave flow
  if (data.flow === "wave" || data.wave_url) return "wave";
  // USSD push — accept 200, 201, 202
  if ([200, 201, 202].includes(httpStatus)) return "ussd_push";
  // Explicit OTP from 400
  if (httpStatus === 400 && (data.error === "otp_required" || data.otp_required)) {
    return data.ussd_code ? "otp_ussd" : "otp_sms";
  }
  return null;
}
