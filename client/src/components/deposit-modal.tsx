import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getPaymentMethodsForCountry, formatCurrency } from "@/lib/countries";
import { Loader2, ExternalLink } from "lucide-react";
import type { PaymentChannel } from "@shared/schema";

const depositSchema = z.object({
  amount: z.string().min(1, "Montant requis"),
  accountName: z.string().optional().default(""),
  accountNumber: z.string().optional().default(""),
  paymentMethod: z.string().min(2, "Moyen de paiement requis"),
  paymentChannelId: z.string().min(1, "Canal de recharge requis"),
});

type DepositForm = z.infer<typeof depositSchema>;

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DepositModal({ open, onClose }: DepositModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"amount" | "details" | "cloudpay-result">("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [cloudpayResult, setCloudpayResult] = useState<{
    redirectUrl?: string | null;
    qrcodeUrl?: string | null;
    bankAccount?: string | null;
    depositId?: number;
  } | null>(null);

  const { data: channels } = useQuery<PaymentChannel[]>({
    queryKey: ["/api/payment-channels"],
    enabled: open,
  });

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
      accountName: "",
      accountNumber: "",
      paymentMethod: "",
      paymentChannelId: "",
    },
  });

  const selectedChannelId = form.watch("paymentChannelId");
  const selectedChannel = (channels as any[])?.find((c: any) => c.id.toString() === selectedChannelId);
  const isCloudpayChannel = selectedChannel?.gateway === "cloudpay";

  const depositMutation = useMutation({
    mutationFn: async (data: DepositForm) => {
      const channelId = parseInt(data.paymentChannelId);
      const channel = (channels as any[])?.find((c: any) => c.id === channelId);

      if (channel?.gateway === "cloudpay") {
        const response = await apiRequest("POST", "/api/cloudpay/deposit", {
          amount: parseInt(data.amount),
          paymentMethod: data.paymentMethod,
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || "Erreur CloudPay");
        }
        return { ...(await response.json()), gateway: "cloudpay" };
      }

      const response = await apiRequest("POST", "/api/deposits", {
        amount: parseInt(data.amount),
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        country: user!.country,
        paymentMethod: data.paymentMethod,
        paymentChannelId: channelId,
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      refreshUser();
      if (data.gateway === "cloudpay") {
        setCloudpayResult({
          redirectUrl: data.redirectUrl,
          qrcodeUrl: data.qrcodeUrl,
          bankAccount: data.bankAccount,
          depositId: data.depositId,
        });
        setStep("cloudpay-result");
        return;
      }
      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      }
      toast({ title: "Demande envoyée!", description: "Votre dépôt est en attente de validation." });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setStep("amount");
    setSelectedAmount(null);
    form.reset();
    onClose();
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    form.setValue("amount", amount.toString());
    setStep("details");
  };

  const handleCustomAmount = () => {
    const amount = parseInt(form.getValues("amount"));
    if (amount >= 300) {
      setSelectedAmount(amount);
      setStep("details");
    } else {
      toast({ title: "Invalid amount", description: "Minimum deposit is ₱300", variant: "destructive" });
    }
  };

  if (!user) return null;

  const paymentMethods = getPaymentMethodsForCountry(user.country);
  const activeChannels = channels?.filter(c => c.isActive) || [];
  const presetAmounts = [300, 500, 1000, 2000, 5000, 10000];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "amount" ? "Deposit" : step === "cloudpay-result" ? "Complete Payment" : "Payment Information"}
          </DialogTitle>
        </DialogHeader>

        {step === "cloudpay-result" && cloudpayResult ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm font-semibold text-green-800 mb-1">Payment initiated via CloudPay</p>
              <p className="text-xs text-green-700">Complete the payment to credit your account automatically.</p>
            </div>

            {cloudpayResult.qrcodeUrl && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Scan QR Code to Pay</p>
                <img
                  src={cloudpayResult.qrcodeUrl}
                  alt="Payment QR Code"
                  className="mx-auto max-w-[200px] rounded-lg border"
                  data-testid="img-cloudpay-qr"
                />
              </div>
            )}

            {cloudpayResult.bankAccount && (
              <div className="bg-secondary rounded-lg p-3 text-sm">
                <p className="text-muted-foreground mb-1">Transfer to Account</p>
                <p className="font-mono font-bold text-foreground">{cloudpayResult.bankAccount}</p>
              </div>
            )}

            {cloudpayResult.redirectUrl && (
              <Button
                className="w-full"
                onClick={() => window.open(cloudpayResult.redirectUrl!, "_blank")}
                data-testid="button-cloudpay-redirect"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Payment Page
              </Button>
            )}

            <Button variant="outline" className="w-full" onClick={handleClose} data-testid="button-cloudpay-done">
              Done — I've completed the payment
            </Button>
          </div>
        ) : step === "amount" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Minimum: {formatCurrency(300, user.country)}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => handleAmountSelect(amount)}
                  data-testid={`button-amount-${amount}`}
                >
                  {formatCurrency(amount, user.country)}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Custom amount"
                value={form.watch("amount")}
                onChange={(e) => form.setValue("amount", e.target.value)}
                data-testid="input-custom-amount"
              />
              <Button onClick={handleCustomAmount} data-testid="button-custom-amount">
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => depositMutation.mutate(data))} className="space-y-4">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedAmount || 0, user.country)}
                </p>
              </div>

              <FormField
                control={form.control}
                name="paymentChannelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Channel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-channel">
                          <SelectValue placeholder="Choose a channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id.toString()}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isCloudpayChannel && (
                <>
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your full name" data-testid="input-account-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="Your number" data-testid="input-account-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {isCloudpayChannel && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  Payment will be processed automatically. You will receive a QR code or redirect link to complete the transaction.
                </div>
              )}

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep("amount")} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={depositMutation.isPending} data-testid="button-submit-deposit">
                  {depositMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
