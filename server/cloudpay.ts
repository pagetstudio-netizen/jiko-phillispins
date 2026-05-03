import crypto from "crypto";

export const CLOUDPAY_BANK_CODES: Record<string, string> = {
  "GCash": "gcash",
  "GCash QR": "gcash",
  "PayMaya": "PMP",
  "Maya": "PMP",
  "GoTyme": "GOT",
  "BPI": "bpi",
  "BDO": "Unibank",
  "Metrobank": "mbt",
  "LandBank": "LBOB",
  "Security Bank": "SBC",
  "UnionBank": "UBP",
  "PNB": "PNB",
  "China Bank": "CBC",
  "EastWest": "EWBC",
  "RCBC": "RCBC",
  "UCPB": "UCPB",
  "PSBank": "PSB",
  "ShopeePay": "SP",
  "GrabPay": "GP",
  "Seabank": "SB",
  "Maya Bank": "MYA",
  "Tonik": "TDB",
  "CIMB": "CPI",
};

export function buildSign(params: Record<string, string | number>, secretKey: string): string {
  const sorted = Object.keys(params)
    .filter(k => k !== "sign" && params[k] !== "" && params[k] !== undefined && params[k] !== null)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join("&");
  const stringToSign = `${sorted}&key=${secretKey}`;
  return crypto.createHash("md5").update(stringToSign).digest("hex");
}

export function verifySign(params: Record<string, string | number>, secretKey: string): boolean {
  const expectedSign = buildSign(params, secretKey);
  return params.sign === expectedSign;
}

export interface CloudpayDepositRequest {
  merchant: string;
  payment_type: string;
  amount: number;
  order_id: string;
  bank_code: string;
  callback_url: string;
  return_url: string;
  customer_bank_card_account?: string;
}

export interface CloudpayDepositResponse {
  status: string;
  message: string;
  order_id?: string | number;
  amount?: number;
  redirect_url?: string;
  qrcode_url?: string;
  gcash_qr_url?: string;
  gcashqr?: string;
  merchant_bank_card_account?: string;
}

export interface CloudpayWithdrawalRequest {
  merchant: string;
  total_amount: number;
  callback_url: string;
  order_id: string;
  bank: string;
  bank_card_name: string;
  bank_card_account: string;
  bank_card_remark: string;
}

export interface CloudpayWithdrawalResponse {
  status: string;
  message: string;
}

export interface CloudpayQueryResponse {
  order_id?: string | number;
  amount?: number;
  status?: number;
  message?: string;
}

export async function initiateDeposit(
  apiDomain: string,
  merchantId: string,
  secretKey: string,
  params: CloudpayDepositRequest
): Promise<CloudpayDepositResponse> {
  const payload: Record<string, string | number> = {
    merchant: params.merchant,
    payment_type: params.payment_type,
    amount: params.amount,
    order_id: params.order_id,
    bank_code: params.bank_code,
    callback_url: params.callback_url,
    return_url: params.return_url,
  };

  if (params.customer_bank_card_account) {
    payload.customer_bank_card_account = params.customer_bank_card_account;
  }

  payload.sign = buildSign(payload, secretKey);

  const url = `https://${apiDomain}/api/transfer`;
  console.log("[cloudpay] deposit request to", url, JSON.stringify({ ...payload, sign: "***" }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)]))).toString(),
  });

  const result = await response.json() as CloudpayDepositResponse;
  console.log("[cloudpay] deposit response:", JSON.stringify(result));
  return result;
}

export async function initiateWithdrawal(
  apiDomain: string,
  merchantId: string,
  secretKey: string,
  params: CloudpayWithdrawalRequest
): Promise<CloudpayWithdrawalResponse> {
  const payload: Record<string, string | number> = {
    merchant: params.merchant,
    total_amount: params.total_amount,
    callback_url: params.callback_url,
    order_id: params.order_id,
    bank: params.bank,
    bank_card_name: params.bank_card_name,
    bank_card_account: params.bank_card_account,
    bank_card_remark: params.bank_card_remark,
  };

  payload.sign = buildSign(payload, secretKey);

  const url = `https://${apiDomain}/api/daifu`;
  console.log("[cloudpay] withdrawal request to", url, JSON.stringify({ ...payload, sign: "***" }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)]))).toString(),
  });

  const result = await response.json() as CloudpayWithdrawalResponse;
  console.log("[cloudpay] withdrawal response:", JSON.stringify(result));
  return result;
}

export async function queryTransaction(
  apiDomain: string,
  merchantId: string,
  secretKey: string,
  orderId: string
): Promise<CloudpayQueryResponse> {
  const payload: Record<string, string | number> = {
    merchant: merchantId,
    order_id: orderId,
  };

  payload.sign = buildSign(payload, secretKey);

  const url = `https://${apiDomain}/api/query`;
  console.log("[cloudpay] query request:", orderId);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)]))).toString(),
  });

  const result = await response.json() as CloudpayQueryResponse;
  console.log("[cloudpay] query response:", JSON.stringify(result));
  return result;
}

export function mapCloudpayStatus(status: number | undefined): "pending" | "approved" | "rejected" {
  if (status === 5) return "approved";
  if (status === 3 || status === 0) return "rejected";
  return "pending";
}

export function getBankCode(paymentMethod: string): string {
  return CLOUDPAY_BANK_CODES[paymentMethod] || "gcash";
}
