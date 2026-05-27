import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { useQuery } from "@tanstack/react-query";

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function RulesModal({ open, onClose }: RulesModalProps) {
  const { fmt } = useUserCurrency();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const minDeposit = parseInt(settings?.minDeposit || "500");
  const minWithdrawal = parseInt(settings?.minWithdrawal || "100");
  const withdrawalFees = settings?.withdrawalFees || "0";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Platform Rules</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm text-muted-foreground">
            <section>
              <h4 className="font-medium text-foreground mb-2">1. Deposits</h4>
              <ul className="space-y-1">
                <li>- Minimum amount: {fmt(minDeposit)}</li>
                <li>- Deposits are processed as quickly as possible</li>
                <li>- Ensure payment information is correct</li>
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">2. Withdrawals</h4>
              <ul className="space-y-1">
                <li>- Minimum amount: {fmt(minWithdrawal)}</li>
                <li>- Withdrawal fee: {withdrawalFees}%</li>
                <li>- Hours: 9am - 6pm</li>
                <li>- Maximum 2 withdrawals per day</li>
                <li>- An active product is required to withdraw</li>
                <li>- A withdrawal wallet must be registered</li>
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">3. Products</h4>
              <ul className="space-y-1">
                <li>- Standard cycle: 80 days</li>
                <li>- Automatic daily earnings</li>
                <li>- Earnings credited 24h after purchase</li>
                <li>- Free product: claim {fmt(5)}/day</li>
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">4. Referral</h4>
              <ul className="space-y-1">
                <li>- Level 1: 20% commission</li>
                <li>- Level 2: 3% commission</li>
                <li>- Level 3: 2% commission</li>
                <li>- Commissions on product purchases</li>
              </ul>
            </section>

            <section>
              <h4 className="font-medium text-foreground mb-2">5. Sign-up Bonus</h4>
              <p>Each new member receives a {fmt(500)} bonus upon registration.</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
