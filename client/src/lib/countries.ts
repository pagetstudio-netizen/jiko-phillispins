export const COUNTRIES = [
  { code: "PH", name: "Philippines", flag: "PH", currency: "PHP", paymentMethods: ["GCash", "Maya", "Bank Transfer"] },
  { code: "BJ", name: "Benin", flag: "BJ", currency: "XOF", paymentMethods: ["Moov Money", "MTN"] },
  { code: "CM", name: "Cameroun", flag: "CM", currency: "XAF", paymentMethods: ["Orange Money", "MTN"] },
  { code: "BF", name: "Burkina Faso", flag: "BF", currency: "XOF", paymentMethods: ["Orange Money", "Moov Money"] },
  { code: "CI", name: "Cote d'Ivoire", flag: "CI", currency: "XOF", paymentMethods: ["Wave", "MTN", "Orange Money", "Moov Money"] },
];

export const ELIGIBLE_COUNTRIES = [
  { code: "PH", name: "Philippines", flag: "PH", currency: "PHP", phonePrefix: "63", paymentMethods: ["GCash", "Maya", "Bank Transfer"] },
  { code: "BJ", name: "Benin", flag: "BJ", currency: "XOF", phonePrefix: "229", paymentMethods: ["Moov Money", "MTN"] },
  { code: "CM", name: "Cameroun", flag: "CM", currency: "XAF", phonePrefix: "237", paymentMethods: ["Orange Money", "MTN"] },
  { code: "BF", name: "Burkina Faso", flag: "BF", currency: "XOF", phonePrefix: "226", paymentMethods: ["Orange Money", "Moov Money"] },
  { code: "CI", name: "Cote d'Ivoire", flag: "CI", currency: "XOF", phonePrefix: "225", paymentMethods: ["Wave", "MTN", "Orange Money", "Moov Money"] },
] as const;

export function getCountryByCode(code: string) {
  return ELIGIBLE_COUNTRIES.find(c => c.code === code);
}

export function getPaymentMethodsForCountry(code: string): string[] {
  const country = getCountryByCode(code);
  return country ? [...country.paymentMethods] : [];
}

export function formatCurrency(amount: number, countryCode: string): string {
  const country = getCountryByCode(countryCode);
  const currency = country?.currency || "PHP";
  if (currency === "PHP") {
    return `₱${amount.toLocaleString()}`;
  }
  return `${amount.toLocaleString()} ${currency}`;
}

export function formatAmount(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}
