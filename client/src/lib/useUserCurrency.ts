import { useQuery } from "@tanstack/react-query";

export function useUserCurrency() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const rate = parseFloat(settings?.phpToFcfaRate || "10");
  const isPhp = true;

  const fmt = (fcfaAmount: number): string => {
    const phpAmount = fcfaAmount / rate;
    return `₱${phpAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const symbol = "₱";

  const toFcfa = (userAmount: number): number => Math.round(userAmount * rate);

  const fromFcfa = (fcfaAmount: number): number => fcfaAmount / rate;

  return { fmt, symbol, isPhp, rate, toFcfa, fromFcfa };
}
