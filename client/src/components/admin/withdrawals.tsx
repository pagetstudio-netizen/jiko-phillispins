import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminCurrency } from "@/lib/useAdminCurrency";
import { Check, X, Search, Loader2, Send } from "lucide-react";
import type { Withdrawal } from "@shared/schema";

interface WithdrawalWithUser extends Withdrawal {
  user: {
    id: number;
    fullName: string;
    phone: string;
    country: string;
    isPromoter: boolean;
  };
}

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const { formatAmount } = useAdminCurrency();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "processing">("pending");
  const [sendingCloudpayId, setSendingCloudpayId] = useState<number | null>(null);

  const { data: allWithdrawals, isLoading } = useQuery<WithdrawalWithUser[]>({
    queryKey: ["/api/admin/withdrawals"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/withdrawals?status=all`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch withdrawals");
      return res.json();
    },
  });

  const withdrawals = allWithdrawals?.filter(w =>
    statusFilter === "all" ? true : w.status === statusFilter
  );

  const processMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      const response = await apiRequest("POST", `/api/admin/withdrawals/${id}/${action}`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Withdrawal processed!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendCloudpay = async (withdrawalId: number) => {
    setSendingCloudpayId(withdrawalId);
    try {
      const response = await apiRequest("POST", "/api/cloudpay/withdraw", { withdrawalId });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Sent via CloudPay!", description: "Withdrawal is being processed automatically." });
    } catch (err: any) {
      toast({ title: "CloudPay error", description: err.message, variant: "destructive" });
    } finally {
      setSendingCloudpayId(null);
    }
  };

  const filteredWithdrawals = withdrawals?.filter(w =>
    w.accountNumber.includes(filter) ||
    w.user.phone.includes(filter) ||
    w.user.fullName.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by number or name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(["all", "pending", "processing", "approved", "rejected"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(status)}
          >
            {status === "all" ? "All" : status === "pending" ? "Pending" : status === "processing" ? "Processing" : status === "approved" ? "Approved" : "Rejected"}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40" />)
        ) : filteredWithdrawals.length > 0 ? (
          filteredWithdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{withdrawal.user.fullName}</p>
                      {withdrawal.user.isPromoter && <Badge className="text-xs">Promoter</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{withdrawal.user.phone}</p>
                    <p className="text-sm text-muted-foreground">Country: {withdrawal.user.country}</p>
                  </div>
                  <Badge variant={
                    withdrawal.status === "pending" ? "secondary" :
                    withdrawal.status === "processing" ? "secondary" :
                    withdrawal.status === "approved" ? "default" : "destructive"
                  }>
                    {withdrawal.status === "processing" ? "Processing" : withdrawal.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requested Amount</p>
                    <p className="font-medium text-foreground">{formatAmount(withdrawal.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Amount</p>
                    <p className="font-medium text-primary">{formatAmount(withdrawal.netAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fees</p>
                    <p className="font-medium text-destructive">{formatAmount(withdrawal.fees)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-medium text-foreground">{withdrawal.paymentMethod}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Receiving Number</p>
                    <p className="font-medium text-foreground">{withdrawal.accountNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Account Name</p>
                    <p className="font-medium text-foreground">{withdrawal.accountName}</p>
                  </div>
                  {(withdrawal as any).cloudpayOrderId && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Order ID (CloudPay)</p>
                      <p className="font-mono text-xs font-medium text-foreground break-all select-all bg-muted/40 rounded px-2 py-1 mt-0.5">{(withdrawal as any).cloudpayOrderId}</p>
                    </div>
                  )}
                  {(withdrawal as any).inpayOrderNumber && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Order Number (InPay)</p>
                      <p className="font-mono text-xs font-medium text-foreground break-all select-all bg-muted/40 rounded px-2 py-1 mt-0.5">{(withdrawal as any).inpayOrderNumber}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Date & Time</p>
                    <p className="font-medium text-foreground">
                      {new Date(withdrawal.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })} at {new Date(withdrawal.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                {withdrawal.status === "pending" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => processMutation.mutate({ id: withdrawal.id, action: "approve" })}
                        disabled={processMutation.isPending}
                        data-testid={`button-manual-approve-${withdrawal.id}`}
                      >
                        {processMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Approve</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => processMutation.mutate({ id: withdrawal.id, action: "reject" })}
                        disabled={processMutation.isPending}
                        data-testid={`button-reject-${withdrawal.id}`}
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => sendCloudpay(withdrawal.id)}
                      disabled={sendingCloudpayId === withdrawal.id}
                      data-testid={`button-cloudpay-withdraw-${withdrawal.id}`}
                    >
                      {sendingCloudpayId === withdrawal.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Send className="w-4 h-4 mr-1" />
                      )}
                      Send via CloudPay
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No withdrawals found
          </div>
        )}
      </div>
    </div>
  );
}
