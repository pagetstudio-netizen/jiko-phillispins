import crypto from "crypto";

const BASE_URL = "https://sendavapay.com/api";

export function verifyWebhookSignature(payload: object, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
  return expected === signature;
}

export async function createPayment(apiKey: string, params: {
  amount: number;
  currency?: string;
  description?: string;
  externalReference?: string;
  customerPhone?: string;
  customerName?: string;
  redirectUrl?: string;
}): Promise<{ reference: string; paymentUrl: string; status: string }> {
  const res = await fetch(`${BASE_URL}/v1/create-payment`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency || "XOF",
      description: params.description || "Recharge EIFFAGE",
      externalReference: params.externalReference,
      customerPhone: params.customerPhone,
      customerName: params.customerName,
      redirectUrl: params.redirectUrl,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "SendavaPay: échec de création du paiement");
  return data.data;
}

export async function verifyPayment(apiKey: string, reference: string): Promise<{
  reference: string;
  amount: string;
  status: string;
  paymentMethod?: string;
  customerPhone?: string;
}> {
  const res = await fetch(`${BASE_URL}/v1/verify-payment`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reference }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "SendavaPay: vérification échouée");
  return data.data;
}

export function mapSendavapayStatus(status: string): "pending" | "approved" | "rejected" {
  if (status === "completed") return "approved";
  if (status === "failed") return "rejected";
  return "pending";
}
