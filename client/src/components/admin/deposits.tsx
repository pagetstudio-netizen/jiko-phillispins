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
import { Check, X, Ban, Search, Loader2, Copy, ClipboardCheck } from "lucide-react";
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

function statusLabel(s: string) {
  if (s === "pending") return "En attente";
  if (s === "approved") return "Validé";
  if (s === "rejected") return "Rejeté";
  return s;
}

export default function AdminDeposits() {
  const { toast } = useToast();
  const { formatAmount } = useAdminCurrency();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [copyingId, setCopyingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyCloudpayPayload = async (depositId: number) => {
    setCopyingId(depositId);
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/cloudpay-payload`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur");
      }
      const { payload } = await res.json();
      const text = JSON.stringify(payload, null, 2);
      await navigator.clipboard.writeText(text);
      setCopiedId(depositId);
      toast({ title: "Requête copiée !", description: `Payload CloudPay copié pour ${payload.order_id}` });
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setCopyingId(null);
    }
  };

  const { data: allDeposits, isLoading } = useQuery<DepositWithUser[]>({
    queryKey: ["/api/admin/deposits"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/deposits?status=all`, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur de chargement des recharges");
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
        throw new Error(data.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Recharge traitée !" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
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
            placeholder="Rechercher par numéro ou nom..."
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
            {status === "all" ? "Tous" : status === "pending" ? "En attente" : status === "approved" ? "Validés" : "Rejetés"}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{deposit.user.fullName}</p>
                      {deposit.user.isPromoter && <Badge className="text-xs">Promoteur</Badge>}
                      {(deposit as any).depositType === "semi_auto" && (
                        <Badge className="text-xs bg-red-600 text-white border-red-600 hover:bg-red-600">Paiement Manuel</Badge>
                      )}
                      {(deposit as any).depositType === "auto" && (
                        <Badge className="text-xs bg-blue-600 text-white border-blue-600 hover:bg-blue-600">SendavaPay</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{deposit.user.phone}</p>
                  </div>
                  <Badge variant={deposit.status === "pending" ? "secondary" : deposit.status === "approved" ? "default" : "destructive"}>
                    {statusLabel(deposit.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Montant</p>
                    <p className="font-medium text-foreground">{formatAmount(deposit.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Méthode</p>
                    <p className="font-medium text-foreground">{deposit.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Envoyé à</p>
                    <p className="font-medium text-foreground">{deposit.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">N° expéditeur</p>
                    <p className="font-medium text-foreground">{(deposit as any).senderNumber || "—"}</p>
                  </div>
                  {(deposit as any).destinationNumber && (
                    <div>
                      <p className="text-muted-foreground">Envoyé au numéro</p>
                      <p className="font-medium text-foreground font-mono">{(deposit as any).destinationNumber}</p>
                    </div>
                  )}
                  {(deposit as any).paymentReceivedMessage && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-0.5">Message reçu</p>
                      <p className="text-xs font-medium text-foreground bg-muted/40 rounded px-2 py-1.5 whitespace-pre-wrap">{(deposit as any).paymentReceivedMessage}</p>
                    </div>
                  )}
                  {(deposit as any).sendavapayReference && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Référence SendavaPay</p>
                      <p className="font-mono text-xs font-medium text-foreground break-all select-all bg-muted/40 rounded px-2 py-1 mt-0.5">{(deposit as any).sendavapayReference}</p>
                    </div>
                  )}
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
                    <p className="text-muted-foreground">Date & Heure</p>
                    <p className="font-medium text-foreground">
                      {new Date(deposit.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })} à {new Date(deposit.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                {(deposit as any).soleaspayOrderId && String((deposit as any).soleaspayOrderId).startsWith("CP-") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-blue-500/40 text-blue-500 hover:bg-blue-500/10"
                    onClick={() => copyCloudpayPayload(deposit.id)}
                    disabled={copyingId === deposit.id}
                    data-testid={`button-copy-cloudpay-${deposit.id}`}
                  >
                    {copyingId === deposit.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : copiedId === deposit.id ? (
                      <ClipboardCheck className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copiedId === deposit.id ? "Requête copiée !" : "Copier requête CloudPay"}
                  </Button>
                )}

                {(deposit as any).screenshotData && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Capture d'écran de paiement</p>
                    <a href={(deposit as any).screenshotData} target="_blank" rel="noopener noreferrer">
                      <img
                        src={(deposit as any).screenshotData}
                        alt="Preuve de paiement"
                        className="w-full max-h-64 object-contain rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">Appuyez pour agrandir</p>
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
                      {processMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Valider</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => processMutation.mutate({ id: deposit.id, action: "reject" })}
                      disabled={processMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => processMutation.mutate({ id: deposit.id, action: "reject", ban: true })}
                      disabled={processMutation.isPending}
                      title="Rejeter et bannir"
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
            Aucune recharge trouvée
          </div>
        )}
      </div>
    </div>
  );
}
