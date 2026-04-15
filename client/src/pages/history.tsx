import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Loader2, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Deposit {
  id: number;
  userId: number;
  amount: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  soleaspayReference?: string;
  soleaspayOrderId?: string;
  omnipayReference?: string;
  omnipayId?: string;
}

interface Withdrawal {
  id: number;
  userId: number;
  amount: string;
  netAmount: string;
  status: string;
  createdAt: string;
}

export default function HistoryPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"deposits" | "withdrawals">("deposits");
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const { fmt } = useUserCurrency();

  const { data: deposits = [], isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/history"],
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "Successful";
      case "rejected":
        return "Rejected";
      case "processing":
        return "Processing";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "text-green-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-[#FF9800]";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) + " " + date.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getReference = (deposit: Deposit) => {
    if (deposit.omnipayReference) return deposit.omnipayReference;
    if (deposit.omnipayId) return deposit.omnipayId;
    if (deposit.soleaspayReference) return deposit.soleaspayReference;
    if (deposit.soleaspayOrderId) return deposit.soleaspayOrderId;
    return `DEP${deposit.id.toString().padStart(10, "0")}`;
  };

  const isPendingDeposit = (deposit: Deposit) => {
    return (deposit.status === "pending" || deposit.status === "processing") &&
      (deposit.soleaspayReference || deposit.soleaspayOrderId || deposit.omnipayId || deposit.omnipayReference);
  };

  const handleVerify = async (depositId: number) => {
    setVerifyingId(depositId);
    try {
      const res = await fetch(`/api/deposits/${depositId}/verify`, { credentials: "include" });
      const data = await res.json();

      if (data.status === "approved") {
        toast({ title: "Payment confirmed", description: "Your account has been credited" });
        refreshUser();
        queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      } else if (data.status === "rejected") {
        toast({ title: "Payment failed", description: "The payment was rejected", variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      } else {
        toast({ title: "Processing", description: "The payment is still awaiting confirmation" });
      }
    } catch {
      toast({ title: "Error", description: "Unable to verify the payment", variant: "destructive" });
    } finally {
      setVerifyingId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-full bg-white">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Link href="/account">
          <button className="p-2" data-testid="button-back">
            <ArrowLeft className="w-5 h-5 text-[#3db51d]" />
          </button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">History</h1>
        <div className="w-9" />
      </header>

      <div className="flex bg-white mx-4 mt-3 rounded-full border border-gray-200 p-1">
        <button
          onClick={() => setActiveTab("deposits")}
          className={`flex-1 py-2.5 text-center font-medium text-sm rounded-full transition-colors ${
            activeTab === "deposits" ? "bg-[#3db51d] text-white" : "text-gray-500"
          }`}
          data-testid="tab-deposits"
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowDownToLine className="w-4 h-4" />
            Deposits
          </div>
        </button>
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`flex-1 py-2.5 text-center font-medium text-sm rounded-full transition-colors ${
            activeTab === "withdrawals" ? "bg-[#3db51d] text-white" : "text-gray-500"
          }`}
          data-testid="tab-withdrawals"
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowUpFromLine className="w-4 h-4" />
            Withdrawals
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {activeTab === "deposits" && (
          <div className="space-y-3">
            {depositsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#3db51d]" />
              </div>
            ) : deposits.length === 0 ? (
              <EmptyState message="No deposits yet" />
            ) : (
              deposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="bg-[#f8f9fa] rounded-xl border border-gray-200 shadow-sm p-4"
                  data-testid={`deposit-item-${deposit.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-bold text-gray-800">{getReference(deposit)}</p>
                    <span className={`text-sm font-bold ${getStatusColor(deposit.status)}`}>
                      {getStatusText(deposit.status)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-20">Amount</span>
                      <span className="text-sm text-gray-800 font-semibold">: {fmt(parseFloat(deposit.amount))}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-20">Received</span>
                      <span className="text-sm text-gray-800 font-semibold">
                        : {deposit.status === "approved" ? fmt(parseFloat(deposit.amount)) : "0"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-20">Date</span>
                      <span className="text-sm text-gray-800 font-semibold">: {formatDate(deposit.createdAt)}</span>
                    </div>
                  </div>

                  {isPendingDeposit(deposit) && (
                    <button
                      onClick={() => handleVerify(deposit.id)}
                      disabled={verifyingId === deposit.id}
                      className="mt-3 w-full py-2 bg-[#3db51d] text-white text-xs font-semibold rounded-full flex items-center justify-center gap-2 disabled:opacity-50"
                      data-testid={`button-verify-${deposit.id}`}
                    >
                      {verifyingId === deposit.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Verify transaction
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "withdrawals" && (
          <div className="space-y-3">
            {withdrawalsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#3db51d]" />
              </div>
            ) : withdrawals.length === 0 ? (
              <EmptyState message="No withdrawals yet" />
            ) : (
              withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="bg-[#f8f9fa] rounded-xl border border-gray-200 shadow-sm p-4"
                  data-testid={`withdrawal-item-${withdrawal.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-bold text-gray-800">WIT{withdrawal.id.toString().padStart(10, "0")}</p>
                    <span className={`text-sm font-bold ${getStatusColor(withdrawal.status)}`}>
                      {getStatusText(withdrawal.status)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-20">Amount</span>
                      <span className="text-sm text-gray-800 font-semibold">: {fmt(parseFloat(withdrawal.amount))}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-20">Received</span>
                      <span className="text-sm text-gray-800 font-semibold">
                        : {withdrawal.status === "approved" ? fmt(parseFloat(withdrawal.netAmount)) : "0"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-20">Date</span>
                      <span className="text-sm text-gray-800 font-semibold">: {formatDate(withdrawal.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
