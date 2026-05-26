export const ELIGIBLE_COUNTRIES = [
  { code: "PH", name: "Philippines",         flag: "PH", currency: "PHP", phonePrefix: "63",  paymentMethods: ["GCash", "Maya"] },
  { code: "BJ", name: "Bénin",               flag: "BJ", currency: "XOF", phonePrefix: "229", paymentMethods: ["Celtis", "Moov Money", "MTN", "Momo"] },
  { code: "CM", name: "Cameroun",             flag: "CM", currency: "XAF", phonePrefix: "237", paymentMethods: ["Orange Money", "MTN"] },
  { code: "TG", name: "Togo",                 flag: "TG", currency: "XOF", phonePrefix: "228", paymentMethods: ["Moov Money", "Mixx by Yas"] },
  { code: "CI", name: "Côte d'Ivoire",        flag: "CI", currency: "XOF", phonePrefix: "225", paymentMethods: ["Wave", "MTN", "Orange Money", "Moov Money"] },
  { code: "BF", name: "Burkina Faso",         flag: "BF", currency: "XOF", phonePrefix: "226", paymentMethods: ["Orange Money", "Moov Money"] },
  { code: "CG", name: "Congo Brazzaville",    flag: "CG", currency: "XAF", phonePrefix: "242", paymentMethods: ["MTN"] },
  { code: "CD", name: "RDC",                  flag: "CD", currency: "CDF", phonePrefix: "243", paymentMethods: ["Airtel Money"] },
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

export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case "PHP": return "₱";
    case "XOF":
    case "XAF": return "FCFA";
    case "CDF": return "FC";
    default: return currency;
  }
}

export function formatCurrency(amount: number, countryCode: string): string {
  const country = getCountryByCode(countryCode);
  const currency = country?.currency || "PHP";
  const symbol = getCurrencySymbol(currency);
  if (currency === "PHP") {
    return `₱${amount.toLocaleString()}`;
  }
  return `${amount.toLocaleString()} ${symbol}`;
}

export function formatAmount(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}
