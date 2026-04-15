import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getCountryByCode } from "@/lib/countries";

export function useUserCurrency() {
  const { user } = useAuth();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const country = user ? getCountryByCode(user.country) : null;
  const isPhp = country?.currency === "PHP";
  const rate = parseFloat(settings?.phpToFcfaRate || "10");

  const fmt = (fcfaAmount: number): string => {
    if (isPhp) {
      const phpAmount = fcfaAmount / rate;
      return `₱${phpAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return `${fcfaAmount.toLocaleString()} FCFA`;
  };

  const symbol = isPhp ? "₱" : "FCFA";

  const toFcfa = (userAmount: number): number => isPhp ? Math.round(userAmount * rate) : userAmount;

  const fromFcfa = (fcfaAmount: number): number => isPhp ? fcfaAmount / rate : fcfaAmount;

  return { fmt, symbol, isPhp, rate, toFcfa, fromFcfa };
}
