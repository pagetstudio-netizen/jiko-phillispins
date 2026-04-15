export const COUNTRIES = [
  { code: "PH", name: "Philippines", flag: "PH", currency: "PHP", paymentMethods: ["GCash", "Maya"] },
];

export const ELIGIBLE_COUNTRIES = [
  { code: "PH", name: "Philippines", flag: "PH", currency: "PHP", phonePrefix: "63", paymentMethods: ["GCash", "Maya"] },
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
