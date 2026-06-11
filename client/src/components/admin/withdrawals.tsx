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
import { Check, X, Search, Loader2 } from "lucide-react";
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

function statusLabel(s: string) {
  if (s === "pending") return "En attente";
  if (s === "approved") return "Validé";
  if (s === "rejected") return "Rejeté";
  if (s === "processing") return "En cours";
  return s;
}

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const { formatAmount } = useAdminCurrency();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "processing">("pending");

  const { data: allWithdrawals, isLoading } = useQuery<WithdrawalWithUser[]>({
    queryKey: ["/api/admin/withdrawals"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/withdrawals?status=all`, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur de chargement des retraits");
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
        throw new Error(data.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Retrait traité !" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });


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
            placeholder="Rechercher par numéro ou nom..."
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
            {status === "all" ? "Tous" : status === "pending" ? "En attente" : status === "processing" ? "En cours" : status === "approved" ? "Validés" : "Rejetés"}
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
                      {withdrawal.user.isPromoter && <Badge className="text-xs">Promoteur</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{withdrawal.user.phone}</p>
                    <p className="text-sm text-muted-foreground">Pays : {withdrawal.user.country}</p>
                  </div>
                  <Badge variant={
                    withdrawal.status === "pending" ? "secondary" :
                    withdrawal.status === "processing" ? "secondary" :
                    withdrawal.status === "approved" ? "default" : "destructive"
                  }>
                    {statusLabel(withdrawal.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Montant demandé</p>
                    <p className="font-medium text-foreground">{formatAmount(withdrawal.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Montant net</p>
                    <p className="font-medium text-primary">{formatAmount(withdrawal.netAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frais</p>
                    <p className="font-medium text-destructive">{formatAmount(withdrawal.fees)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Méthode</p>
                    <p className="font-medium text-foreground">{withdrawal.paymentMethod}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Numéro de réception</p>
                    <p className="font-medium text-foreground">{withdrawal.accountNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Nom du bénéficiaire</p>
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
                    <p className="text-muted-foreground">Date & Heure</p>
                    <p className="font-medium text-foreground">
                      {new Date(withdrawal.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })} à {new Date(withdrawal.createdAt).toLocaleTimeString("fr-FR", {
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
                        {processMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Valider</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => processMutation.mutate({ id: withdrawal.id, action: "reject" })}
                        disabled={processMutation.isPending}
                        data-testid={`button-reject-${withdrawal.id}`}
                      >
                        <X className="w-4 h-4 mr-1" /> Rejeter
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucun retrait trouvé
          </div>
        )}
      </div>
    </div>
  );
}
