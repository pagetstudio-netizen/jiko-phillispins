import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import jinkoBg from "@assets/15502488526db98c02ac135d0ac0e262d31dee111d_1775833317804.jpg";
import historyIcon from "@assets/5708960_1774829436660-C3SIos42_1775833646464.png";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { apiRequest } from "@/lib/queryClient";
import mayaLogo from "@assets/2206757_1777781237200.jpg";
import gcashLogo from "@assets/Screenshot_20260415-140919_1777781311304.png";

const GREEN = "#3db51d";

const METHODS = [
  {
    key: "GCash" as const,
    label: "GCash",
    bg: "#0070E0",
    textColor: "white",
    logo: (
      <img src={gcashLogo} alt="GCash" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
    ),
  },
  {
    key: "Maya" as const,
    label: "Maya",
    bg: "#00AC4F",
    textColor: "white",
    logo: (
      <img src={mayaLogo} alt="Maya" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
    ),
  },
];

export default function DepositPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { document.title = "Deposit | Noviqra Ai"; }, []);
  const { fmt, fromFcfa, toFcfa } = useUserCurrency();

  const [amount, setAmount] = useState<number | "">("");
  const [pendingMethod, setPendingMethod] = useState<"GCash" | "Maya" | null>(null);

  const { data: platformSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const minDepositFcfa = parseInt(platformSettings?.minDeposit || "3000");
  const minDeposit = fromFcfa(minDepositFcfa);

  const cloudpayMutation = useMutation({
    mutationFn: async ({ amtFcfa, method }: { amtFcfa: number; method: "GCash" | "Maya" }) => {
      const response = await apiRequest("POST", "/api/cloudpay/deposit", {
        amount: amtFcfa,
        paymentMethod: method,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "CloudPay error");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
    },
    onError: (err: any) => {
      setPendingMethod(null);
      alert(err.message || "Payment service unavailable. Please try again later.");
    },
    onSettled: () => {
      setPendingMethod(null);
    },
  });

  const handleMethodClick = (method: "GCash" | "Maya") => {
    const amt = typeof amount === "number" ? amount : 0;
    if (!amt || amt < minDeposit) {
      alert(`Minimum deposit: ${fmt(minDepositFcfa)}`);
      return;
    }
    setPendingMethod(method);
    cloudpayMutation.mutate({ amtFcfa: toFcfa(amt), method });
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f5f5", overflowX: "hidden" }}>

      {/* Header with background */}
      <div style={{ backgroundImage: `url(${jinkoBg})`, backgroundSize: "cover", backgroundPosition: "center", paddingBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 16px 16px" }}>
          <button onClick={() => navigate("/")} data-testid="button-back" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
            <ChevronLeft style={{ width: 24, height: 24, color: "white" }} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0 }}>Deposit</h1>
          <Link href="/deposit-orders">
            <button data-testid="button-history" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
              <img src={historyIcon} alt="History" style={{ width: 26, height: 26, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </button>
          </Link>
        </div>

        {/* White card: method selector + amount input */}
        <div style={{ width: "calc(100% - 16px)", marginLeft: 16, boxSizing: "border-box" as const, background: "white", borderRadius: "24px 0 0 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.10)", padding: "20px 16px" }}>
          <p style={{ fontSize: 12, color: GREEN, marginBottom: 14, fontWeight: 600 }}>
            Minimum deposit: {fmt(minDepositFcfa)}
          </p>

          {/* GCash / Maya logos */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            {METHODS.map((m) => {
              const isSelected = pendingMethod === m.key || (!pendingMethod && m.key === "GCash");
              return (
                <button
                  key={m.key}
                  onClick={() => setPendingMethod(m.key)}
                  data-testid={`button-method-${m.key.toLowerCase()}`}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    border: `2px solid ${isSelected ? m.bg : "#e5e7eb"}`,
                    background: isSelected ? `${m.bg}12` : "white",
                    cursor: "pointer",
                    padding: "14px 10px",
                    display: "flex",
                    flexDirection: "column" as const,
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  {m.logo}
                  <span style={{ fontSize: 14, fontWeight: 700, color: m.bg }}>{m.label}</span>
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: 13, color: GREEN, margin: "0 0 8px 0" }}>Enter amount</p>
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px" }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder={minDeposit.toLocaleString()}
              data-testid="input-deposit-amount"
              style={{ flex: 1, fontSize: 16, color: "#111827", border: "none", outline: "none", background: "transparent" }}
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, background: "#f5f5f5", padding: "20px 16px 40px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Deposit Now button */}
        <button
          onClick={() => handleMethodClick(pendingMethod ?? "GCash")}
          disabled={cloudpayMutation.isPending}
          data-testid="button-submit-deposit"
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            background: cloudpayMutation.isPending ? "#9ca3af" : GREEN,
            color: "white",
            fontWeight: 700,
            fontSize: 16,
            border: "none",
            cursor: cloudpayMutation.isPending ? "not-allowed" : "pointer",
            boxShadow: cloudpayMutation.isPending ? "none" : "0 4px 12px rgba(61,181,29,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {cloudpayMutation.isPending ? (
            <><Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} /> Processing...</>
          ) : "Deposit Now"}
        </button>

        {/* Instructions */}
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 12 }}>
            💳 Deposit Instructions:
          </p>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {[
              { bold: "Minimum deposit amount:", text: ` ${fmt(minDepositFcfa)}` },
              { bold: "Carefully verify your account information", text: " when making a transfer to avoid payment errors" },
              { bold: "Each order has its own payment information", text: "; do not reuse previous information for a second payment" },
              { bold: "After a successful transfer", text: ", please wait 10 to 30 minutes. If the amount is not credited, contact customer service." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#1565C0", fontWeight: 700, fontSize: 14, marginTop: 1, flexShrink: 0 }}>◆</span>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>{item.bold}</span>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
