// Static fallback (used until API data loads)
export const ELIGIBLE_COUNTRIES = [
  { code: "CM", name: "Cameroun",          flag: "CM", currency: "XAF", phonePrefix: "237", paymentMethods: ["Orange Money", "MTN Mobile Money"] },
  { code: "BF", name: "Burkina Faso",       flag: "BF", currency: "XOF", phonePrefix: "226", paymentMethods: ["Orange Money", "Moov Money"] },
  { code: "TG", name: "Togo",               flag: "TG", currency: "XOF", phonePrefix: "228", paymentMethods: ["Moov Money", "Mixx by Yas"] },
  { code: "BJ", name: "Benin",              flag: "BJ", currency: "XOF", phonePrefix: "229", paymentMethods: ["MTN Mobile Money", "Moov Money", "Celtis"] },
  { code: "CI", name: "Cote d'Ivoire",      flag: "CI", currency: "XOF", phonePrefix: "225", paymentMethods: ["Wave", "MTN Mobile Money", "Orange Money", "Moov Money"] },
  { code: "CG", name: "Congo Brazzaville",  flag: "CG", currency: "XAF", phonePrefix: "242", paymentMethods: ["MTN Mobile Money"] },
  { code: "CD", name: "RDC",                flag: "CD", currency: "CDF", phonePrefix: "243", paymentMethods: ["Airtel Money"] },
] as const;

export type CountryCode = typeof ELIGIBLE_COUNTRIES[number]["code"];
export const COUNTRIES = ELIGIBLE_COUNTRIES;

export type DynamicCountry = {
  id: number;
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
  isActive: boolean;
  operators: { id: number; countryCode: string; operatorName: string; isActive: boolean }[];
};

export function getCountryByCode(code: string) {
  return ELIGIBLE_COUNTRIES.find(c => c.code === code);
}

export function getPaymentMethodsForCountry(code: string, dynamic?: DynamicCountry[]): string[] {
  if (dynamic && dynamic.length > 0) {
    const c = dynamic.find(d => d.code === code);
    return c ? c.operators.map(o => o.operatorName) : [];
  }
  const country = getCountryByCode(code);
  return country ? [...country.paymentMethods] : [];
}

export function formatCurrency(amount: number, _countryCode?: string): string {
  return `${amount.toLocaleString()} FCFA`;
}

export function formatAmount(amount: number): string {
  return `${amount.toLocaleString()}`;
}
