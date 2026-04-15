import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2 } from "lucide-react";
import historyIcon from "@assets/5708960_1774829436660-C3SIos42_1775833646464.png";
import walletIcon from "@assets/20260410_193054_1775850084890.png";
import jinkoBg from "@assets/15502488526db98c02ac135d0ac0e262d31dee111d_1775833317804.jpg";
import { Link, useLocation } from "wouter";
import { useUserCurrency } from "@/lib/useUserCurrency";

const GREEN = "#3db51d";

interface WalletData {
  id: number;
  userId: number;
  accountName: string;
  accountNumber: string;
  paymentMethod: string;
  country: string;
  isDefault: boolean;
}

interface UserProduct {
  id: number;
  status: string;
}

export default function WithdrawalPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  useEffect(() => { document.title = "Withdrawal | Jinko Solar"; }, []);
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number | "">("");
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [, navigate] = useLocation();

  const { fmt, symbol, fromFcfa, toFcfa } = useUserCurrency();

  const minWithdrawalFcfa = 120;
  const minWithdrawal = fromFcfa(minWithdrawalFcfa);

  const { data: withdrawalSettings } = useQuery<{
    withdrawalFees: number;
    withdrawalStartHour: number;
    withdrawalEndHour: number;
  }>({
    queryKey: ["/api/settings/withdrawal"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const withdrawalFee = withdrawalSettings?.withdrawalFees ?? 17;
  const withdrawalStartHour = withdrawalSettings?.withdrawalStartHour ?? 8;
  const withdrawalEndHour = withdrawalSettings?.withdrawalEndHour ?? 17;

  const amountAfterFees = amount
    ? Math.floor(Number(amount) * (1 - withdrawalFee / 100))
    : 0;

  const currentHour = new Date().getHours();
  const isWithinWithdrawalHours =
    currentHour >= withdrawalStartHour && currentHour < withdrawalEndHour;

  const { data: wallets = [], isLoading: walletsLoading } = useQuery<WalletData[]>({
    queryKey: ["/api/wallets"],
    refetchOnWindowFocus: true,
  });

  const { data: userProducts = [] } = useQuery<UserProduct[]>({
    queryKey: ["/api/user/products"],
  });

  const hasActiveProduct = userProducts.some((p) => p.status === "active");
  const hasWallets = wallets.length > 0;

  useEffect(() => {
    const savedWalletId = localStorage.getItem("selectedWalletId");
    if (savedWalletId && wallets.length > 0) {
      const wallet = wallets.find((w) => w.id === parseInt(savedWalletId));
      if (wallet) setSelectedWallet(wallet);
      localStorage.removeItem("selectedWalletId");
    }
  }, [wallets]);

  useEffect(() => {
    if (!selectedWallet && wallets.length > 0) {
      const defaultWallet = wallets.find((w) => w.isDefault);
      if (defaultWallet) setSelectedWallet(defaultWallet);
    }
  }, [wallets, selectedWallet]);

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; walletId: number }) => {
      const res = await apiRequest("POST", "/api/withdrawals", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request submitted", description: "Your withdrawal request has been sent." });
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      setAmount("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!isWithinWithdrawalHours) {
      toast({
        title: "Withdrawal hours",
        description: `Withdrawals are available from ${withdrawalStartHour}:00 to ${withdrawalEndHour}:00`,
        variant: "destructive",
      });
      return;
    }
    if (!hasActiveProduct) {
      toast({
        title: "Product required",
        description: "You must have an active product to make a withdrawal",
        variant: "destructive",
      });
      return;
    }
    if (!amount || amount < minWithdrawal) {
      toast({
        title: "Invalid amount",
        description: `Minimum withdrawal is ${fmt(minWithdrawalFcfa)}`,
        variant: "destructive",
      });
      return;
    }
    if (!selectedWallet) {
      toast({
        title: "Wallet required",
        description: "Please select a payment account",
        variant: "destructive",
      });
      return;
    }
    withdrawMutation.mutate({ amount: toFcfa(amount as number), walletId: selectedWallet.id });
  };

  if (walletsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: GREEN }}>
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) return null;

  const balance = parseFloat(user?.balance || "0");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f5f5f5", overflowX: "hidden" }}>

      <div style={{ backgroundImage: `url(${jinkoBg})`, backgroundSize: "cover", backgroundPosition: "center", paddingBottom: 32 }}>

        <div className="flex items-center justify-between px-4 pt-10 pb-4">
          <Link href="/account">
            <button data-testid="button-back">
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-white">Withdrawal</h1>
          <Link href="/withdrawal-history">
            <button data-testid="button-history">
              <img src={historyIcon} alt="History" style={{ width: 26, height: 26, objectFit: "contain" }} />
            </button>
          </Link>
        </div>

        <div className="bg-white shadow-lg overflow-hidden" style={{ marginLeft: 16, marginRight: 0, borderRadius: "24px 0 0 24px" }}>

          <div className="flex items-center justify-between px-5 py-5" style={{ background: "#e8f8e0" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: GREEN }}>Account Balance</p>
              <p className="text-4xl font-extrabold mt-1 leading-tight" style={{ color: GREEN }} data-testid="text-balance">
                {fmt(balance)}
              </p>
            </div>
            <img src={walletIcon} alt="Wallet" style={{ width: 80, height: 80, objectFit: "contain" }} />
          </div>

          <div className="px-5 pt-4 pb-5">
            <p className="text-sm mb-3" style={{ color: GREEN }}>Please enter the withdrawal amount</p>

            <div className="flex items-center rounded-xl px-4 py-3 border" style={{ borderColor: "#e5e7eb" }}>
              <span className="text-gray-400 font-semibold mr-2">{symbol}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                placeholder="amount"
                className="flex-1 text-lg text-gray-600 outline-none bg-transparent"
                data-testid="input-withdrawal-amount"
              />
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span>Amount received: {symbol}{amountAfterFees.toLocaleString()}</span>
              <span>Fee: {withdrawalFee.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4">
        <button
          onClick={() => navigate(hasWallets ? "/wallet?from=withdrawal" : "/wallet")}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-white font-semibold text-sm shadow"
          style={{ background: GREEN }}
          data-testid="button-select-wallet"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="4" width="20" height="14" rx="3" stroke="white" strokeWidth="1.8" />
            <rect x="1" y="8" width="20" height="3" fill="white" />
            <rect x="4" y="13" width="6" height="2" rx="1" fill="white" />
          </svg>
          <span className="flex-1 text-left">
            {selectedWallet
              ? `${selectedWallet.accountName} · ${selectedWallet.accountNumber}`
              : "Choose your wallet"}
          </span>
          <span className="text-white text-lg font-bold">›</span>
        </button>
      </div>

      {!isWithinWithdrawalHours && (
        <div className="mx-4 mt-3 bg-white rounded-2xl px-4 py-3 text-sm" style={{ color: GREEN }}>
          ⏰ Withdrawal hours: {withdrawalStartHour}:00 – {withdrawalEndHour}:00 (Currently closed)
        </div>
      )}
      {!hasActiveProduct && (
        <div className="mx-4 mt-3 bg-white rounded-2xl px-4 py-3 text-sm" style={{ color: GREEN }}>
          ⚠️ You must have an active product to make a withdrawal.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 4 }}>
        <button
          onClick={handleSubmit}
          disabled={withdrawMutation.isPending || !amount || !selectedWallet || !hasActiveProduct}
          data-testid="button-submit-withdrawal"
          style={{
            width: 220,
            height: 50,
            borderRadius: 999,
            background: GREEN,
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(61,181,29,0.35)",
            opacity: (withdrawMutation.isPending || !amount || !selectedWallet || !hasActiveProduct) ? 0.4 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {withdrawMutation.isPending ? (
            <>
              <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
              Sending...
            </>
          ) : (
            "Withdraw Now"
          )}
        </button>
      </div>

      <div className="flex-1 bg-gray-50 mt-4 px-5 pt-5 pb-10 space-y-4">
        <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
          💳 Withdrawal Instructions:
        </p>
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <div className="flex gap-2 items-start">
            <span className="mt-0.5 font-bold" style={{ color: "#1565C0" }}>◆</span>
            <p><span className="font-bold">Minimum withdrawal amount:</span> {fmt(minWithdrawalFcfa)}</p>
          </div>
          <div className="flex gap-2 items-start">
            <span className="mt-0.5 font-bold" style={{ color: "#1565C0" }}>◆</span>
            <p><span className="font-bold">Withdrawals available anytime</span>, with no limit on time, amount, or frequency</p>
          </div>
          <div className="flex gap-2 items-start">
            <span className="mt-0.5 font-bold" style={{ color: "#1565C0" }}>◆</span>
            <p><span className="font-bold">Withdrawal fee:</span> {withdrawalFee}% per transaction</p>
          </div>
          <div className="flex gap-2 items-start">
            <span className="mt-0.5 font-bold" style={{ color: "#1565C0" }}>◆</span>
            <p><span className="font-bold">Processing time:</span> usually within 2 hours, up to 24h in exceptional cases</p>
          </div>
          <div className="flex gap-2 items-start">
            <span className="mt-0.5 font-bold" style={{ color: "#1565C0" }}>◆</span>
            <p>If the withdrawal fails, check that your wallet information is correct and resubmit the request.</p>
          </div>
          <div className="flex gap-2 items-start">
            <span className="mt-0.5 font-bold" style={{ color: "#1565C0" }}>◆</span>
            <p>Make your first deposit and activate a Jinko Solar product to unlock the withdrawal feature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
