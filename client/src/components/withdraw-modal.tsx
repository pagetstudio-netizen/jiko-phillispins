import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, getCountryByCode } from "@/lib/countries";
import { Loader2, AlertCircle, Clock, Wallet } from "lucide-react";
import type { WithdrawalWallet } from "@shared/schema";

const withdrawSchema = z.object({
  amount: z.string().min(1, "Montant requis"),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ open, onClose }: WithdrawModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const { data: wallets } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
    enabled: open,
  });

  const { data: withdrawalSettings } = useQuery<{ 
    withdrawalFees: number; 
    withdrawalStartHour: number;
    withdrawalEndHour: number;
    maxWithdrawalsPerDay: number;
  }>({
    queryKey: ["/api/settings/withdrawal"],
    enabled: open,
  });

  const form = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: "",
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawForm) => {
      const response = await apiRequest("POST", "/api/withdrawals", {
        amount: parseInt(data.amount),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      refreshUser();
      toast({ title: "Demande envoyée!", description: "Votre retrait est en attente de validation." });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!user) return null;

  const balance = parseFloat(user.balance || "0");
  const defaultWallet = wallets?.find(w => w.isDefault);
  const fees = withdrawalSettings?.withdrawalFees || 15;
  const startHour = withdrawalSettings?.withdrawalStartHour || 8;
  const endHour = withdrawalSettings?.withdrawalEndHour || 17;
  const country = getCountryByCode(user.country);

  const amount = parseInt(form.watch("amount") || "0");
  const feeAmount = Math.round(amount * fees / 100);
  const netAmount = amount - feeAmount;

  const canWithdraw = user.hasDeposited && user.hasActiveProduct && !user.isWithdrawalBlocked && defaultWallet;
  const actualStartHour = startHour;
  const actualEndHour = endHour;

  const currentHour = new Date().getHours();
  const isWithinHours = currentHour >= actualStartHour && currentHour < actualEndHour;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Withdrawal</DialogTitle>
          <DialogDescription>
            Minimum: {formatCurrency(120, user.country)} | Fees: {fees}%
          </DialogDescription>
        </DialogHeader>

        {!canWithdraw ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Withdrawal not available</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {!user.hasDeposited && <li>- Make a deposit first</li>}
                  {!user.hasActiveProduct && <li>- Purchase a product</li>}
                  {!defaultWallet && <li>- Register a withdrawal wallet</li>}
                  {user.isWithdrawalBlocked && <li>- Your withdrawal is blocked</li>}
                  {user.mustInviteToWithdraw && <li>- Invite someone who invests</li>}
                </ul>
              </div>
            </div>
          </div>
        ) : !isWithinHours ? (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Outside withdrawal hours</p>
                <p className="text-muted-foreground mt-1">
                  Withdrawals are available from {actualStartHour}:00 to {actualEndHour}:00
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => withdrawMutation.mutate(data))} className="space-y-4">
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Withdrawal Wallet</span>
                </div>
                <p className="font-medium text-foreground">{defaultWallet?.accountName}</p>
                <p className="text-sm text-muted-foreground">{defaultWallet?.accountNumber} - {defaultWallet?.paymentMethod}</p>
              </div>

              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(balance, user.country)}</p>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Withdraw</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="Minimum ₱120"
                        data-testid="input-withdraw-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {amount >= 120 && (
                <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground">{formatCurrency(amount, user.country)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees ({fees}%)</span>
                    <span className="text-destructive">-{formatCurrency(feeAmount, user.country)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium text-foreground">Net to receive</span>
                    <span className="font-bold text-primary">{formatCurrency(netAmount, user.country)}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={withdrawMutation.isPending || amount < 120 || amount > balance}
                data-testid="button-submit-withdraw"
              >
                {withdrawMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Request Withdrawal"
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
