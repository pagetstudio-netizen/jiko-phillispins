export const ELIGIBLE_COUNTRIES = [
  { code: "CM", name: "Cameroun", flag: "CM", currency: "XAF", phonePrefix: "237", paymentMethods: ["Orange Money", "MTN Mobile Money"] },
  { code: "BF", name: "Burkina Faso", flag: "BF", currency: "XOF", phonePrefix: "226", paymentMethods: ["Orange Money", "Moov Money"] },
  { code: "TG", name: "Togo", flag: "TG", currency: "XOF", phonePrefix: "228", paymentMethods: ["Moov Money", "Mixx by Yas"] },
  { code: "BJ", name: "Bénin", flag: "BJ", currency: "XOF", phonePrefix: "229", paymentMethods: ["Celtis", "Moov Money", "MTN", "Momo"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "CI", currency: "XOF", phonePrefix: "225", paymentMethods: ["Wave", "MTN", "Orange Money", "Moov Money"] },
  { code: "CG", name: "Congo Brazzaville", flag: "CG", currency: "XAF", phonePrefix: "242", paymentMethods: ["MTN Mobile Money"] },
  { code: "CD", name: "RDC", flag: "CD", currency: "CDF", phonePrefix: "243", paymentMethods: ["Airtel Money"] },
  { code: "SN", name: "Sénégal", flag: "SN", currency: "XOF", phonePrefix: "221", paymentMethods: ["Wave", "Orange Money", "Free Money"] },
  { code: "ML", name: "Mali", flag: "ML", currency: "XOF", phonePrefix: "223", paymentMethods: ["Orange Money", "Moov Money"] },
  { code: "NE", name: "Niger", flag: "NE", currency: "XOF", phonePrefix: "227", paymentMethods: ["Moov Money", "Airtel Money"] },
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
  return `${amount.toLocaleString()} FCFA`;
}

export function formatAmount(amount: number): string {
  return `${amount.toLocaleString()}`;
}
