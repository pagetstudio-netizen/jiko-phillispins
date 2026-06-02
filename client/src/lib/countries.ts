export const ELIGIBLE_COUNTRIES = [
  { code: "PH", name: "Philippines", flag: "PH", currency: "PHP", phonePrefix: "63", paymentMethods: ["GCash", "Maya"] },
] as const;

export type CountryCode = typeof ELIGIBLE_COUNTRIES[number]["code"];

export const COUNTRIES = ELIGIBLE_COUNTRIES;

export function getCountryByCode(code: string) {
  return ELIGIBLE_COUNTRIES.find(c => c.code === code);
}

export function getPaymentMethodsForCountry(code: string): string[] {
  const country = getCountryByCode(code);
  return country ? [...country.paymentMethods] : [];
}

export function formatCurrency(amount: number, _countryCode?: string): string {
  return `₱${amount.toLocaleString()}`;
}

export function formatAmount(amount: number): string {
  return `${amount.toLocaleString()}`;
}
