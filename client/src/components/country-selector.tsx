import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { ELIGIBLE_COUNTRIES } from "@/lib/countries";
import type { DynamicCountry } from "@/lib/countries";

interface CountrySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (countryCode: string) => void;
}

export function CountrySelector({ open, onClose, onSelect }: CountrySelectorProps) {
  const { data: dynamic } = useQuery<DynamicCountry[]>({ queryKey: ["/api/countries"] });

  const list = (dynamic && dynamic.length > 0)
    ? dynamic.map(c => ({ code: c.code, name: c.name, phonePrefix: c.phonePrefix }))
    : ELIGIBLE_COUNTRIES.map(c => ({ code: c.code, name: c.name, phonePrefix: c.phonePrefix }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[280px] mx-auto rounded-xl bg-white dark:bg-gray-900 p-0 overflow-hidden border-0">
        <DialogTitle className="text-center text-sm font-semibold py-3 px-4 border-b border-gray-100 dark:border-gray-800">
          Selectionner l'indicatif pays
        </DialogTitle>
        <div className="py-0.5">
          {list.map((country) => (
            <button
              key={country.code}
              onClick={() => { onSelect(country.code); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover-elevate active-elevate-2"
              data-testid={`country-option-${country.code}`}
            >
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{country.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">+{country.phonePrefix}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
