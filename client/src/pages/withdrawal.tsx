import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2, DollarSign, ChevronRight, Info } from "lucide-react";
import heroBg from "@assets/roboter-pyhsikalische-ki-Xpert.Digital-png_1779519826292.png";
import historyIcon from "@assets/5708960_1774829436660-C3SIos42_1775833646464.png";
import bankCardIcon from "@assets/mine-mod-bankcard-CLOhqwHj_1779464171572.png";
import { Link, useLocation } from "wouter";
import { useUserCurrency } from "@/lib/useUserCurrency";

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
  useEffect(() => { document.title = "Retrait | EIFFAGE"; }, []);
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>("");
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [, navigate] = useLocation();
  const { fmt, symbol, fromFcfa, toFcfa } = useUserCurrency();

  const { data: withdrawalSettings } = useQuery<{
    withdrawalFees: number;
    withdrawalStartHour: number;
    withdrawalEndHour: number;
    minWithdrawal: number;
  }>({
    queryKey: ["/api/settings/withdrawal"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: platformSettings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const withdrawalFee = withdrawalSettings?.withdrawalFees ?? 0;
  const withdrawalStartHour = withdrawalSettings?.withdrawalStartHour ?? 9;
  const withdrawalEndHour = withdrawalSettings?.withdrawalEndHour ?? 18;
  const minWithdrawalFcfa = parseInt(platformSettings?.minWithdrawal || "100");

  const numAmount = parseFloat(amount) || 0;
  const amountAfterFees = numAmount > 0 ? Math.floor(numAmount * (1 - withdrawalFee / 100)) : 0;

  const currentHour = new Date().getHours();
  const isWithinWithdrawalHours = currentHour >= withdrawalStartHour && currentHour < withdrawalEndHour;

  const { data: wallets = [], isLoading: walletsLoading } = useQuery<WalletData[]>({
    queryKey: ["/api/wallets"],
    refetchOnWindowFocus: true,
  });

  const { data: userProducts = [] } = useQuery<UserProduct[]>({
    queryKey: ["/api/user/products"],
  });

  const hasActiveProduct = userProducts.some((p) => p.status === "active");

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
      toast({ title: "Withdrawal hours", description: `Withdrawals available from ${withdrawalStartHour}h to ${withdrawalEndHour}h`, variant: "destructive" });
      return;
    }
    if (!hasActiveProduct) {
      toast({ title: "Product required", description: "You must have an active product to withdraw", variant: "destructive" });
      return;
    }
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum < fromFcfa(minWithdrawalFcfa)) {
      toast({ title: "Invalid amount", description: `Minimum amount: ${fmt(minWithdrawalFcfa)}`, variant: "destructive" });
      return;
    }
    if (!selectedWallet) {
      toast({ title: "Wallet required", description: "Please select a payment account", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate({ amount: toFcfa(amtNum), walletId: selectedWallet.id });
  };

  if (walletsLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#111111" }}>
        <Loader2 style={{ width: 32, height: 32, color: "#f59e0b" }} className="animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const balance = parseFloat(user?.balance || "0");

  return (
    <div style={{ minHeight: "100vh", background: "#111111", display: "flex", flexDirection: "column" }}>

      {/* ── HERO HEADER ── */}
      <div style={{ position: "relative" }}>
        <img
          src={heroBg}
          alt=""
          style={{ width: "100%", height: 200, objectFit: "cover", objectPosition: "center", display: "block" }}
        />
        {/* gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.70) 100%)" }} />

        {/* top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "44px 16px 0" }}>
          <Link href="/account">
            <button data-testid="button-back" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
              <ChevronLeft style={{ width: 26, height: 26, color: "white" }} />
            </button>
          </Link>
          <span style={{ color: "white", fontWeight: 700, fontSize: 17 }}>Withdrawal</span>
          <Link href="/withdrawal-history">
            <button data-testid="button-history" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
              <img src={historyIcon} alt="History" style={{ width: 24, height: 24, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </button>
          </Link>
        </div>

        {/* Balance */}
        <div style={{ position: "absolute", bottom: 14, left: 16 }}>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: 500 }}>Balance </span>
          <span style={{ color: "white", fontSize: 32, fontWeight: 900, letterSpacing: -0.5 }} data-testid="text-balance">
            {fromFcfa(balance).toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, padding: "14px 12px 100px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* ── BANK CARD SELECTOR ── */}
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "16px 14px" }}>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 10 }}>Select a payment account</p>
          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.15)", marginBottom: 14 }} />
          <button
            onClick={() => navigate(wallets.length > 0 ? "/wallet?from=withdrawal" : "/wallet")}
            data-testid="button-select-wallet"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
            }}>
              <img src={bankCardIcon} alt="Card" style={{ width: 30, height: 30, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </div>
            <span style={{
              flex: 1,
              color: selectedWallet ? "white" : "#6b7280",
              fontSize: 14,
              textAlign: "left",
            }}>
              {selectedWallet
                ? `${selectedWallet.accountName} · ${selectedWallet.accountNumber}`
                : "Please select a payment account"}
            </span>
            <ChevronRight style={{ width: 18, height: 18, color: "#6b7280", flexShrink: 0 }} />
          </button>
        </div>

        {/* ── AMOUNT INPUT ── */}
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "16px 14px" }}>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 10 }}>Withdrawal amount</p>
          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.15)", marginBottom: 14 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1.5px solid rgba(255,255,255,0.18)", paddingBottom: 10 }}>
            <DollarSign style={{ width: 22, height: 22, color: "#9ca3af", flexShrink: 0 }} />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter withdrawal amount"
              data-testid="input-withdrawal-amount"
              style={{ flex: 1, fontSize: 15, color: "white", background: "transparent", border: "none", outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 13 }}>
            <span style={{ color: "#9ca3af" }}>
              Amount received: <span style={{ color: "white" }}>{symbol}{amountAfterFees.toLocaleString()}</span>
            </span>
            <span style={{ color: "#9ca3af" }}>
              Fees: <span style={{ color: "white" }}>{withdrawalFee}%</span>
            </span>
          </div>
        </div>

        {/* ── WARNINGS ── */}
        {!isWithinWithdrawalHours && (
          <div style={{ background: "#1a1a1a", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#f59e0b", display: "flex", gap: 8, alignItems: "center" }}>
            <span>⏰</span>
            <span>Withdrawals available from {withdrawalStartHour}h to {withdrawalEndHour}h (currently closed)</span>
          </div>
        )}
        {!hasActiveProduct && (
          <div style={{ background: "#1a1a1a", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#f59e0b", display: "flex", gap: 8, alignItems: "center" }}>
            <span>⚠️</span>
            <span>You must have an active product to make a withdrawal.</span>
          </div>
        )}

        {/* ── CONFIRM BUTTON ── */}
        <button
          onClick={handleSubmit}
          disabled={withdrawMutation.isPending}
          data-testid="button-submit-withdrawal"
          style={{
            width: "100%", height: 54,
            background: "#0d0d0d",
            border: "1.5px solid #f59e0b",
            borderRadius: 12,
            color: "white",
            fontWeight: 700,
            fontSize: 17,
            cursor: withdrawMutation.isPending ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: withdrawMutation.isPending ? 0.7 : 1,
          }}
        >
          {withdrawMutation.isPending
            ? <><Loader2 style={{ width: 20, height: 20 }} className="animate-spin" /> Processing...</>
            : "Confirm"
          }
        </button>

        {/* ── IMPORTANT INFO ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Info style={{ width: 14, height: 14, color: "white" }} />
            </div>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Important information:</span>
          </div>
          <div style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              `1. Minimum withdrawal amount: ${fmt(minWithdrawalFcfa)}.`,
              `2. Withdrawal fee: ${withdrawalFee}% of the withdrawn amount.`,
              `3. You can make withdrawals at any time. Withdrawals are processed within 4 to 24 hours.`,
              `4. To protect the interests of the platform and its members, you must have at least one active product to enable the withdrawal function.`,
            ].map((text, i) => (
              <p key={i} style={{ margin: 0 }}>{text}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
