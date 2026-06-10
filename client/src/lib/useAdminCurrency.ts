export function useAdminCurrency() {
  const formatAmount = (fcfaAmount: number): string => {
    return `${fcfaAmount.toLocaleString("fr-FR")} FCFA`;
  };

  const currency = "FCFA";
  const rate = 1;

  return { formatAmount, currency, rate };
}
