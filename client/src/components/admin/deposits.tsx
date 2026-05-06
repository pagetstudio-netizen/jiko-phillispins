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
import { Check, X, Ban, Search, Loader2 } from "lucide-react";
import type { Deposit } from "@shared/schema";

interface DepositWithUser extends Deposit {
  user: {
    id: number;
    fullName: string;
    phone: string;
    country: string;
    isPromoter: boolean;
  };
}

export default function AdminDeposits() {
  const { toast } = useToast();
  const { formatAmount } = useAdminCurrency();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const { data: allDeposits, isLoading } = useQuery<DepositWithUser[]>({
    queryKey: ["/api/admin/deposits"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/deposits?status=all`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch deposits");
      return res.json();
    },
  });

  const deposits = allDeposits?.filter(d =>
    statusFilter === "all" ? true : d.status === statusFilter
  );

  const processMutation = useMutation({
    mutationFn: async ({ id, action, ban }: { id: number; action: "approve" | "reject"; ban?: boolean }) => {
      const response = await apiRequest("POST", `/api/admin/deposits/${id}/${action}`, { ban });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Deposit processed!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredDeposits = deposits?.filter(d =>
    d.accountNumber.includes(filter) ||
    d.user.phone.includes(filter) ||
    d.user.fullName.toLowerCase().includes(filter.toLowerCase())
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
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(status)}
          >
            {status === "all" ? "All" : status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Rejected"}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40" />)
        ) : filteredDeposits.length > 0 ? (
          filteredDeposits.map((deposit) => (
            <Card key={deposit.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{deposit.user.fullName}</p>
                      {deposit.user.isPromoter && <Badge className="text-xs">Promoter</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{deposit.user.phone}</p>
                  </div>
                  <Badge variant={deposit.status === "pending" ? "secondary" : deposit.status === "approved" ? "default" : "destructive"}>
                    {deposit.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium text-foreground">{formatAmount(deposit.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-medium text-foreground">{deposit.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sent to</p>
                    <p className="font-medium text-foreground">{deposit.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sender Number</p>
                    <p className="font-medium text-foreground">{(deposit as any).senderNumber || "—"}</p>
                  </div>
                  {(deposit as any).soleaspayOrderId && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Order ID (CloudPay)</p>
                      <p className="font-mono text-xs font-medium text-foreground break-all select-all bg-muted/40 rounded px-2 py-1 mt-0.5">{(deposit as any).soleaspayOrderId}</p>
                    </div>
                  )}
                  {(deposit as any).ashtechpayReference && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Référence AshtechPay</p>
                      <p className="font-mono text-xs font-medium text-foreground break-all select-all bg-muted/40 rounded px-2 py-1 mt-0.5">{(deposit as any).ashtechpayReference}</p>
                    </div>
                  )}
                  {(deposit as any).ashtechpayTransactionId && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Transaction ID AshtechPay</p>
                      <p className="font-mono text-xs font-medium text-foreground break-all select-all bg-muted/40 rounded px-2 py-1 mt-0.5">{(deposit as any).ashtechpayTransactionId}</p>
                    </div>
                  )}
                  {(deposit as any).soleaspayReference && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Référence Soleaspay</p>
                      <p className="font-mono text-xs font-medium text-foreground break-all select-all bg-muted/40 rounded px-2 py-1 mt-0.5">{(deposit as any).soleaspayReference}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Date & Time</p>
                    <p className="font-medium text-foreground">
                      {new Date(deposit.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })} at {new Date(deposit.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                {(deposit as any).screenshotData && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Payment Screenshot</p>
                    <a href={(deposit as any).screenshotData} target="_blank" rel="noopener noreferrer">
                      <img
                        src={(deposit as any).screenshotData}
                        alt="Payment proof"
                        className="w-full max-h-64 object-contain rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">Tap image to open full size</p>
                  </div>
                )}

                {deposit.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => processMutation.mutate({ id: deposit.id, action: "approve" })}
                      disabled={processMutation.isPending}
                    >
                      {processMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Approve</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => processMutation.mutate({ id: deposit.id, action: "reject" })}
                      disabled={processMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => processMutation.mutate({ id: deposit.id, action: "reject", ban: true })}
                      disabled={processMutation.isPending}
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No deposits found
          </div>
        )}
      </div>
    </div>
  );
}
