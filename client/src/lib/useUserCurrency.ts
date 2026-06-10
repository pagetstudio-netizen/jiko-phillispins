export function useUserCurrency() {
  const fmt = (amount: number): string => {
    return `${amount.toLocaleString("fr-FR")} FCFA`;
  };

  const symbol = "FCFA";
  const isPhp = false;
  const rate = 1;

  const toFcfa = (userAmount: number): number => Math.round(userAmount);
  const fromFcfa = (fcfaAmount: number): number => fcfaAmount;

  return { fmt, symbol, isPhp, rate, toFcfa, fromFcfa };
}
