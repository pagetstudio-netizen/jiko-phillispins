import { useQuery } from "@tanstack/react-query";

export function useAdminCurrency() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const rate = parseFloat(settings?.phpToFcfaRate || "10");
  const currency = settings?.adminCurrency || "PHP";

  const formatAmount = (fcfaAmount: number): string => {
    const converted = fcfaAmount / rate;
    return `${converted.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
  };

  return { formatAmount, currency, rate };
}
