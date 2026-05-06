import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Users, ArrowDownToLine, ArrowUpFromLine, ShoppingCart, Wallet, Clock, TrendingUp, Award, Calendar, RotateCcw, Loader2, AlertTriangle, RefreshCw, CloudCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminCurrency } from "@/lib/useAdminCurrency";

interface DashboardStats {
  totalUsers: number;
  todayUsers: number;
  periodUsers: number;
  totalDeposits: number;
  todayDeposits: number;
  periodDeposits: number;
  pendingDeposits: number;
  pendingDepositsCount: number;
  totalWithdrawals: number;
  todayWithdrawals: number;
  periodWithdrawals: number;
  pendingWithdrawals: number;
  pendingWithdrawalsCount: number;
  usersWithProducts: number;
  totalBalance: number;
  totalEarnings: number;
  totalActiveProducts: number;
  totalCommissions: number;
}

interface AdminDashboardProps {
  isSuperAdmin: boolean;
}

export default function AdminDashboard({ isSuperAdmin }: AdminDashboardProps) {
  const { toast } = useToast();
  const { formatAmount } = useAdminCurrency();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedDates, setAppliedDates] = useState<{start: string, end: string}>({start: "", end: ""});
  const [showResetDialog, setShowResetDialog] = useState(false);

  const queryParams = new URLSearchParams();
  if (appliedDates.start) queryParams.append("startDate", appliedDates.start);
  if (appliedDates.end) queryParams.append("endDate", appliedDates.end);
  const queryString = queryParams.toString();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats", queryString],
    queryFn: async () => {
      const url = queryString ? `/api/admin/stats?${queryString}` : "/api/admin/stats";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const applyDateFilter = () => {
    setAppliedDates({ start: startDate, end: endDate });
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setAppliedDates({ start: "", end: "" });
  };

  const { data: cloudpayBalance, isLoading: isLoadingBalance, refetch: refetchBalance, error: cloudpayError } = useQuery<{ status: string; balance?: number | string; usable_balance?: number | string; frozen_balance?: number | string; message?: string }>({
    queryKey: ["/api/admin/cloudpay/balance"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cloudpay/balance", { credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur");
      }
      return res.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  const resetStatsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/reset-stats");
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Reset failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowResetDialog(false);
      toast({ title: "Statistics reset successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const mainStats = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtitle: `+${stats.todayUsers} today`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/20",
    },
    {
      title: "Active Investors",
      value: stats.usersWithProducts,
      subtitle: `${stats.totalActiveProducts} active products`,
      icon: ShoppingCart,
      color: "text-purple-500",
      bg: "bg-purple-500/20",
    },
  ];

  const depositStats = [
    {
      title: "Total Approved Deposits",
      value: formatAmount(stats.totalDeposits),
      subtitle: `+${formatAmount(stats.todayDeposits)} today`,
      icon: ArrowDownToLine,
      color: "text-green-500",
      bg: "bg-green-500/20",
    },
    {
      title: "Pending Deposits",
      value: formatAmount(stats.pendingDeposits),
      subtitle: `${stats.pendingDepositsCount} request(s)`,
      icon: Clock,
      color: "text-[#2196F3]",
      bg: "bg-blue-500/20",
    },
  ];

  const withdrawalStats = [
    {
      title: "Total Approved Withdrawals",
      value: formatAmount(stats.totalWithdrawals),
      subtitle: `+${formatAmount(stats.todayWithdrawals)} today`,
      icon: ArrowUpFromLine,
      color: "text-green-500",
      bg: "bg-green-500/20",
    },
    {
      title: "Pending Withdrawals",
      value: formatAmount(stats.pendingWithdrawals),
      subtitle: `${stats.pendingWithdrawalsCount} request(s)`,
      icon: Clock,
      color: "text-[#2196F3]",
      bg: "bg-[#2196F3]/20",
    },
  ];

  const financialStats = [
    {
      title: "Total Platform Balance",
      value: formatAmount(stats.totalBalance),
      subtitle: "All users",
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/20",
    },
    {
      title: "Total Earnings Distributed",
      value: formatAmount(stats.totalEarnings),
      subtitle: "Since the beginning",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/20",
    },
    {
      title: "Commissions Paid",
      value: formatAmount(stats.totalCommissions),
      subtitle: "Referrals",
      icon: Award,
      color: "text-indigo-500",
      bg: "bg-indigo-500/20",
    },
  ];

  const periodStats = appliedDates.start || appliedDates.end ? [
    {
      title: "Users (period)",
      value: stats.periodUsers,
      subtitle: `From ${appliedDates.start || "beginning"} to ${appliedDates.end || "today"}`,
      icon: Users,
      color: "text-cyan-500",
      bg: "bg-cyan-500/20",
    },
    {
      title: "Deposits (period)",
      value: formatAmount(stats.periodDeposits),
      subtitle: "Approved in period",
      icon: ArrowDownToLine,
      color: "text-green-600",
      bg: "bg-green-600/20",
    },
    {
      title: "Withdrawals (period)",
      value: formatAmount(stats.periodWithdrawals),
      subtitle: "Approved in period",
      icon: ArrowUpFromLine,
      color: "text-red-600",
      bg: "bg-red-600/20",
    },
  ] : [];

  const StatCard = ({ stat, className = "" }: { stat: { title: string; value: string | number; subtitle: string; icon: any; color: string; bg: string }, className?: string }) => (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{stat.title}</p>
            <p className="text-lg font-bold text-foreground mt-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
          </div>
          <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center flex-shrink-0`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by date</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 min-w-32"
              placeholder="Start date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 min-w-32"
              placeholder="End date"
            />
            <Button onClick={applyDateFilter} size="sm">
              Apply
            </Button>
            {(appliedDates.start || appliedDates.end) && (
              <Button onClick={clearDateFilter} variant="outline" size="sm">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {periodStats.length > 0 && (
        <>
          <p className="text-sm font-medium text-muted-foreground">Period Statistics</p>
          <div className="grid grid-cols-3 gap-3">
            {periodStats.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </div>
        </>
      )}

      <p className="text-sm font-medium text-muted-foreground">Overview</p>
      <div className="grid grid-cols-2 gap-3">
        {mainStats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      <p className="text-sm font-medium text-muted-foreground">Deposits</p>
      <div className="grid grid-cols-2 gap-3">
        {depositStats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      <p className="text-sm font-medium text-muted-foreground">Withdrawals</p>
      <div className="grid grid-cols-2 gap-3">
        {withdrawalStats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      <p className="text-sm font-medium text-muted-foreground">Financials</p>
      <div className="grid grid-cols-1 gap-3">
        {financialStats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Solde CloudPay</p>
        <Button variant="ghost" size="sm" onClick={() => refetchBalance()} disabled={isLoadingBalance}>
          <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <Card className="border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <CloudCog className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              {isLoadingBalance ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-48" />
                </div>
              ) : cloudpayError ? (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CloudPay non configuré</p>
                  <p className="text-xs text-destructive mt-0.5">{(cloudpayError as Error).message}</p>
                </div>
              ) : cloudpayBalance ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Statut:</span>
                    <span className={`text-xs font-medium ${cloudpayBalance.status === "1" || cloudpayBalance.status === "success" ? "text-green-500" : "text-yellow-500"}`}>
                      {cloudpayBalance.status === "1" || cloudpayBalance.status === "success" ? "Connecté" : cloudpayBalance.status}
                    </span>
                  </div>
                  {cloudpayBalance.balance !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Solde total</p>
                      <p className="text-xl font-bold text-foreground">{cloudpayBalance.balance}</p>
                    </div>
                  )}
                  {cloudpayBalance.usable_balance !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Solde disponible</p>
                      <p className="text-lg font-bold text-green-500">{cloudpayBalance.usable_balance}</p>
                    </div>
                  )}
                  {cloudpayBalance.frozen_balance !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Solde gelé</p>
                      <p className="text-sm font-medium text-yellow-500">{cloudpayBalance.frozen_balance}</p>
                    </div>
                  )}
                  {cloudpayBalance.message && (
                    <p className="text-xs text-muted-foreground">{cloudpayBalance.message}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cliquer sur actualiser pour charger le solde</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card className="border-destructive/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Reset Statistics</p>
                  <p className="text-xs text-muted-foreground">Reset all counters to zero</p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowResetDialog(true)}
                data-testid="button-reset-stats"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reset</DialogTitle>
            <DialogDescription>
              This action will reset all statistic counters to zero.
              Real data (deposits, withdrawals, products, accounts) will NOT be deleted.
              Statistics will only show new data after this reset.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => resetStatsMutation.mutate()}
              disabled={resetStatsMutation.isPending}
              data-testid="button-confirm-reset"
            >
              {resetStatsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm Reset"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
