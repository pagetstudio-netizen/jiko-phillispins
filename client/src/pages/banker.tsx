import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminCurrency } from "@/lib/useAdminCurrency";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check, X, Ban, Search, Loader2, ArrowLeft, LogOut,
  Copy, ClipboardCheck, Send, Filter
} from "lucide-react";
import type { Deposit, Withdrawal } from "@shared/schema";
import { useEffect } from "react";

interface DepositWithUser extends Deposit {
  user: { id: number; fullName: string; phone: string; country: string; isPromoter: boolean };
}
interface WithdrawalWithUser extends Withdrawal {
  user: { id: number; fullName: string; phone: string; country: string; isPromoter: boolean };
}
type CombinedTx = (DepositWithUser & { _type: "deposit" }) | (WithdrawalWithUser & { _type: "withdrawal" });

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " à " + new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    approved: "default", pending: "secondary", rejected: "destructive", processing: "secondary",
  };
  const labels: Record<string, string> = {
    approved: "Validé", pending: "En attente", rejected: "Rejeté", processing: "En cours",
  };
  return <Badge variant={map[status] || "outline"}>{labels[status] || status}</Badge>;
}

export default function BankerPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { formatAmount } = useAdminCurrency();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("deposits");

  useEffect(() => { document.title = "Espace Bankier | EIFFAGE"; }, []);

  if (!user?.isAdmin && !user?.isBanker) return null;

  const isBankerOnly = !user.isAdmin && (user as any).isBanker;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary px-4 py-4 flex items-center gap-4 sticky top-0 z-50">
        {isBankerOnly ? (
          <Button size="icon" variant="ghost" onClick={() => logout()} data-testid="button-logout">
            <LogOut className="w-5 h-5" />
          </Button>
        ) : (
          <Button size="icon" variant="ghost" onClick={() => navigate("/account")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-lg font-bold text-secondary-foreground">Espace Bankier</h1>
          <p className="text-xs text-muted-foreground">Gestion des recharges et retraits</p>
        </div>
      </header>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="deposits" data-testid="tab-deposits">Recharges</TabsTrigger>
            <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">Retraits</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="mt-4">
            <DepositsTab formatAmount={formatAmount} toast={toast} />
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-4">
            <WithdrawalsTab formatAmount={formatAmount} toast={toast} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <HistoryTab formatAmount={formatAmount} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DepositsTab({ formatAmount, toast }: { formatAmount: (n: number) => string; toast: any }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [copyingId, setCopyingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: allDeposits, isLoading } = useQuery<DepositWithUser[]>({
    queryKey: ["/api/admin/deposits"],
    queryFn: async () => {
      const res = await fetch("/api/admin/deposits?status=all", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur chargement");
      return res.json();
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, action, ban }: { id: number; action: "approve" | "reject"; ban?: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/deposits/${id}/${action}`, { ban });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Erreur"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] });
      toast({ title: "Dépôt traité avec succès" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const copyCloudpayPayload = async (id: number) => {
    setCopyingId(id);
    try {
      const res = await fetch(`/api/admin/deposits/${id}/cloudpay-payload`, { credentials: "include" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      const { payload } = await res.json();
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedId(id);
      toast({ title: "Requête CloudPay copiée !" });
      setTimeout(() => setCopiedId(null), 3000);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setCopyingId(null); }
  };

  const filtered = (allDeposits || [])
    .filter(d => statusFilter === "all" || d.status === statusFilter)
    .filter(d =>
      d.accountNumber.includes(search) ||
      d.user.phone.includes(search) ||
      d.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      String(d.id).includes(search) ||
      ((d as any).soleaspayOrderId || "").includes(search) ||
      ((d as any).ashtechpayReference || "").includes(search)
    );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Recherche nom, téléphone, référence..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-deposits"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "Tous" : s === "pending" ? "En attente" : s === "approved" ? "Validés" : "Rejetés"}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} transaction(s)</p>

      <div className="space-y-3">
        {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />) :
          filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucune recharge trouvée</div>
          ) : filtered.map(deposit => (
            <Card key={deposit.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{deposit.user.fullName}</p>
                      {deposit.user.isPromoter && <Badge className="text-xs">Promoteur</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{deposit.user.phone} · {deposit.user.country}</p>
                    <p className="text-xs text-muted-foreground">Ref #{deposit.id}</p>
                  </div>
                  <StatusBadge status={deposit.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Montant</p>
                    <p className="font-bold text-primary text-base">{formatAmount(deposit.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Méthode</p>
                    <p className="font-medium">{deposit.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Envoyé à</p>
                    <p className="font-medium select-all">{deposit.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">N° expéditeur</p>
                    <p className="font-medium">{(deposit as any).senderNumber || "—"}</p>
                  </div>
                  {(deposit as any).soleaspayOrderId && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Order ID</p>
                      <p className="font-mono text-xs select-all bg-muted/40 rounded px-2 py-1 mt-0.5 break-all">
                        {(deposit as any).soleaspayOrderId}
                      </p>
                    </div>
                  )}
                  {(deposit as any).ashtechpayReference && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Référence AshtechPay</p>
                      <p className="font-mono text-xs select-all bg-muted/40 rounded px-2 py-1 mt-0.5 break-all">
                        {(deposit as any).ashtechpayReference}
                      </p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Date</p>
                    <p className="font-medium">{fmtDate(deposit.createdAt)}</p>
                  </div>
                  {deposit.processedAt && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Traité le</p>
                      <p className="font-medium">{fmtDate(deposit.processedAt)}</p>
                    </div>
                  )}
                </div>

                {(deposit as any).soleaspayOrderId && String((deposit as any).soleaspayOrderId).startsWith("CP-") && (
                  <Button size="sm" variant="outline" className="w-full border-blue-500/40 text-blue-500 hover:bg-blue-500/10"
                    onClick={() => copyCloudpayPayload(deposit.id)} disabled={copyingId === deposit.id}>
                    {copyingId === deposit.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
                      copiedId === deposit.id ? <ClipboardCheck className="w-4 h-4 mr-2 text-green-500" /> :
                        <Copy className="w-4 h-4 mr-2" />}
                    {copiedId === deposit.id ? "Copié !" : "Copier requête CloudPay"}
                  </Button>
                )}

                {(deposit as any).screenshotData && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Capture d'écran de paiement</p>
                    <a href={(deposit as any).screenshotData} target="_blank" rel="noopener noreferrer">
                      <img src={(deposit as any).screenshotData} alt="Preuve de paiement"
                        className="w-full max-h-64 object-contain rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity" />
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">Appuyez pour agrandir</p>
                  </div>
                )}

                {deposit.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1"
                      onClick={() => processMutation.mutate({ id: deposit.id, action: "approve" })}
                      disabled={processMutation.isPending}
                      data-testid={`button-approve-${deposit.id}`}>
                      {processMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Valider</>}
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => processMutation.mutate({ id: deposit.id, action: "reject" })}
                      disabled={processMutation.isPending}
                      data-testid={`button-reject-${deposit.id}`}>
                      <X className="w-4 h-4 mr-1" />Rejeter
                    </Button>
                    <Button size="sm" variant="destructive"
                      onClick={() => processMutation.mutate({ id: deposit.id, action: "reject", ban: true })}
                      disabled={processMutation.isPending}
                      data-testid={`button-ban-${deposit.id}`}
                      title="Rejeter et bannir">
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

function WithdrawalsTab({ formatAmount, toast }: { formatAmount: (n: number) => string; toast: any }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "processing">("pending");
  const [sendingCloudpayId, setSendingCloudpayId] = useState<number | null>(null);

  const { data: allWithdrawals, isLoading } = useQuery<WithdrawalWithUser[]>({
    queryKey: ["/api/admin/withdrawals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/withdrawals?status=all", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur chargement");
      return res.json();
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      const res = await apiRequest("POST", `/api/admin/withdrawals/${id}/${action}`, {});
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Erreur"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Retrait traité avec succès" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const sendCloudpay = async (id: number) => {
    setSendingCloudpayId(id);
    try {
      const res = await apiRequest("POST", "/api/cloudpay/withdraw", { withdrawalId: id });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Erreur"); }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Envoyé via CloudPay !", description: "Traitement automatique en cours." });
    } catch (e: any) {
      toast({ title: "Erreur CloudPay", description: e.message, variant: "destructive" });
    } finally { setSendingCloudpayId(null); }
  };

  const filtered = (allWithdrawals || [])
    .filter(w => statusFilter === "all" || w.status === statusFilter)
    .filter(w =>
      w.accountNumber.includes(search) ||
      w.user.phone.includes(search) ||
      w.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      w.accountName.toLowerCase().includes(search.toLowerCase()) ||
      String(w.id).includes(search) ||
      ((w as any).cloudpayOrderId || "").includes(search) ||
      ((w as any).inpayOrderNumber || "").includes(search)
    );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Recherche nom, téléphone, référence..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-withdrawals"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "processing", "approved", "rejected"] as const).map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "Tous" : s === "pending" ? "En attente" : s === "processing" ? "En cours" : s === "approved" ? "Validés" : "Rejetés"}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} transaction(s)</p>

      <div className="space-y-3">
        {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />) :
          filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucun retrait trouvé</div>
          ) : filtered.map(w => (
            <Card key={w.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{w.user.fullName}</p>
                      {w.user.isPromoter && <Badge className="text-xs">Promoteur</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{w.user.phone} · {w.user.country}</p>
                    <p className="text-xs text-muted-foreground">Ref #{w.id}</p>
                  </div>
                  <StatusBadge status={w.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Montant demandé</p>
                    <p className="font-bold text-base">{formatAmount(w.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Montant net</p>
                    <p className="font-bold text-primary text-base">{formatAmount(w.netAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Frais</p>
                    <p className="font-medium text-destructive">{formatAmount(w.fees)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Méthode</p>
                    <p className="font-medium">{w.paymentMethod}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Numéro de réception</p>
                    <p className="font-bold text-base select-all">{w.accountNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Nom du bénéficiaire</p>
                    <p className="font-medium">{w.accountName}</p>
                  </div>
                  {(w as any).cloudpayOrderId && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Order ID (CloudPay)</p>
                      <p className="font-mono text-xs select-all bg-muted/40 rounded px-2 py-1 mt-0.5 break-all">
                        {(w as any).cloudpayOrderId}
                      </p>
                    </div>
                  )}
                  {(w as any).inpayOrderNumber && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Order Number (InPay)</p>
                      <p className="font-mono text-xs select-all bg-muted/40 rounded px-2 py-1 mt-0.5 break-all">
                        {(w as any).inpayOrderNumber}
                      </p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Date de demande</p>
                    <p className="font-medium">{fmtDate(w.createdAt)}</p>
                  </div>
                  {w.processedAt && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Traité le</p>
                      <p className="font-medium">{fmtDate(w.processedAt)}</p>
                    </div>
                  )}
                </div>

                {w.status === "pending" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1"
                        onClick={() => processMutation.mutate({ id: w.id, action: "approve" })}
                        disabled={processMutation.isPending}
                        data-testid={`button-approve-withdrawal-${w.id}`}>
                        {processMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Valider</>}
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => processMutation.mutate({ id: w.id, action: "reject" })}
                        disabled={processMutation.isPending}
                        data-testid={`button-reject-withdrawal-${w.id}`}>
                        <X className="w-4 h-4 mr-1" />Rejeter
                      </Button>
                    </div>
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => sendCloudpay(w.id)}
                      disabled={sendingCloudpayId === w.id}
                      data-testid={`button-cloudpay-${w.id}`}>
                      {sendingCloudpayId === w.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                      Envoyer via CloudPay
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

function HistoryTab({ formatAmount }: { formatAmount: (n: number) => string }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "withdrawal">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const { data: history, isLoading } = useQuery<CombinedTx[]>({
    queryKey: ["/api/banker/history"],
    queryFn: async () => {
      const res = await fetch("/api/banker/history", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur chargement");
      return res.json();
    },
  });

  const filtered = (history || [])
    .filter(tx => typeFilter === "all" || tx._type === typeFilter)
    .filter(tx => statusFilter === "all" || tx.status === statusFilter)
    .filter(tx => {
      const ref = String(tx.id);
      const name = tx.user.fullName.toLowerCase();
      const phone = tx.user.phone;
      const account = tx.accountNumber;
      const q = search.toLowerCase();
      return !q || ref.includes(q) || name.includes(q) || phone.includes(q) || account.includes(q) ||
        ((tx as any).soleaspayOrderId || "").includes(q) ||
        ((tx as any).ashtechpayReference || "").includes(q) ||
        ((tx as any).cloudpayOrderId || "").includes(q) ||
        ((tx as any).inpayOrderNumber || "").includes(q);
    });

  const totalDeposits = filtered.filter(t => t._type === "deposit" && t.status === "approved")
    .reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = filtered.filter(t => t._type === "withdrawal" && t.status === "approved")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Recherche nom, téléphone, référence, n° ordre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-history"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1">
          {(["all", "deposit", "withdrawal"] as const).map(t => (
            <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)}>
              {t === "all" ? "Tous" : t === "deposit" ? "Recharges" : "Retraits"}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "approved", "rejected"] as const).map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? "secondary" : "ghost"} onClick={() => setStatusFilter(s)}>
              {s === "all" ? "Tous statuts" : s === "pending" ? "En attente" : s === "approved" ? "Validé" : "Rejeté"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-secondary rounded-lg p-3 text-center">
          <p className="text-muted-foreground text-xs">Transactions</p>
          <p className="font-bold text-lg">{filtered.length}</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-3 text-center">
          <p className="text-muted-foreground text-xs">Recharges validées</p>
          <p className="font-bold text-green-500">{formatAmount(totalDeposits)}</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-3 text-center">
          <p className="text-muted-foreground text-xs">Retraits validés</p>
          <p className="font-bold text-red-500">{formatAmount(totalWithdrawals)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />) :
          filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucune transaction trouvée</div>
          ) : filtered.map((tx, i) => (
            <Card key={`${tx._type}-${tx.id}-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={tx._type === "deposit" ? "default" : "secondary"} className="text-xs">
                      {tx._type === "deposit" ? "Recharge" : "Retrait"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{tx.id}</span>
                  </div>
                  <StatusBadge status={tx.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{tx.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{tx.user.phone} · {tx.paymentMethod}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-base ${tx._type === "deposit" ? "text-green-500" : "text-red-500"}`}>
                      {tx._type === "deposit" ? "+" : "-"}{formatAmount(tx.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.accountNumber}</p>
                  </div>
                </div>
                {((tx as any).soleaspayOrderId || (tx as any).ashtechpayReference || (tx as any).cloudpayOrderId || (tx as any).inpayOrderNumber) && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono break-all bg-muted/30 rounded px-2 py-1">
                    {(tx as any).soleaspayOrderId || (tx as any).ashtechpayReference || (tx as any).cloudpayOrderId || (tx as any).inpayOrderNumber}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
