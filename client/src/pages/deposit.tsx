import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, Loader2, DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { apiRequest } from "@/lib/queryClient";
import heroImg from "@assets/Liberer-le-potentiel-de-lintelligence-artificielle-dans-la-rob_1779519826156.png";
import historyIcon from "@assets/5708960_1774829436660-C3SIos42_1775833646464.png";
import mayaLogo from "@assets/2206757_1777781237200.jpg";
import gcashLogo from "@assets/Screenshot_20260415-140919_1777781311304.png";

const PRESET_AMOUNTS_FCFA = [5000, 15000, 35000, 70000];

function EiffageLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <span style={{ color: "white", fontWeight: 900, fontSize: 28, letterSpacing: 1, fontFamily: "sans-serif" }}>EIFFAGE</span>
    </div>
  );
}

export default function DepositPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { document.title = "Recharge | EIFFAGE"; }, []);
  const { fmt, fromFcfa, toFcfa } = useUserCurrency();

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount]     = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("mobile_money");

  const { data: platformSettings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const minDepositFcfa = parseInt(platformSettings?.minDeposit || "500");

  const getAmountFcfa = (): number => {
    if (selectedPreset !== null) return selectedPreset;
    const raw = parseFloat(customAmount);
    if (!isNaN(raw) && raw > 0) return toFcfa(raw);
    return 0;
  };

  const cloudpayMutation = useMutation({
    mutationFn: async ({ amtFcfa, method }: { amtFcfa: number; method: string }) => {
      const response = await apiRequest("POST", "/api/cloudpay/deposit", { amount: amtFcfa, paymentMethod: method });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || "CloudPay error"); }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    },
    onError: (err: any) => {
      alert(err.message || "Payment service unavailable. Please try again later.");
    },
  });

  const handleConfirm = () => {
    const amtFcfa = getAmountFcfa();
    if (!amtFcfa || amtFcfa < minDepositFcfa) {
      alert(`Minimum deposit: ${fmt(minDepositFcfa)}`);
      return;
    }
    cloudpayMutation.mutate({ amtFcfa, method: selectedMethod });
  };

  if (!user) return null;

  const METHODS = [
    {
      key: "mobile_money",
      label: "Mobile Money",
      logo: <img src={gcashLogo} alt="Mobile Money" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />,
    },
    {
      key: "wave",
      label: "Wave",
      logo: <img src={mayaLogo} alt="Wave" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#111111", display: "flex", flexDirection: "column" }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: `linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.55) 100%), url(${heroImg}) center/cover no-repeat`,
        paddingTop: 44,
        paddingBottom: 24,
        position: "relative",
      }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", marginBottom: 12 }}>
          <button onClick={() => navigate("/")} data-testid="button-back" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
            <ChevronLeft style={{ width: 26, height: 26, color: "white" }} />
          </button>
          <div style={{ flex: 1 }} />
          <Link href="/deposit-orders">
            <button data-testid="button-history" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
              <img src={historyIcon} alt="History" style={{ width: 24, height: 24, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </button>
          </Link>
        </div>

        {/* EIFFAGE Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <EiffageLogo />
        </div>
        <p style={{ color: "white", fontWeight: 800, fontSize: 16, textAlign: "center", letterSpacing: 4, margin: 0 }}>
          RECHARGE
        </p>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, padding: "14px 12px 100px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* ── PRESET AMOUNTS ── */}
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "16px 14px" }}>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}>
            Select deposit amount
          </p>
          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.15)", marginBottom: 14 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {PRESET_AMOUNTS_FCFA.map((fcfa) => {
              const isSelected = selectedPreset === fcfa;
              return (
                <button
                  key={fcfa}
                  onClick={() => { setSelectedPreset(fcfa); setCustomAmount(""); }}
                  data-testid={`button-preset-${fcfa}`}
                  style={{
                    background: isSelected ? "#2a2a2a" : "#0d0d0d",
                    border: isSelected ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "14px 6px",
                    color: isSelected ? "#f59e0b" : "white",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {fmt(fcfa)}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CUSTOM AMOUNT ── */}
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "16px 14px" }}>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 10 }}>Enter a custom amount</p>
          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.15)", marginBottom: 14 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1.5px solid rgba(255,255,255,0.18)", paddingBottom: 10 }}>
            <DollarSign style={{ width: 22, height: 22, color: "#9ca3af", flexShrink: 0 }} />
            <input
              type="number"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null); }}
              placeholder="Enter amount"
              data-testid="input-deposit-amount"
              style={{
                flex: 1, fontSize: 15, color: "white", background: "transparent",
                border: "none", outline: "none",
              }}
            />
          </div>
        </div>

        {/* ── PAYMENT METHOD ── */}
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "16px 14px" }}>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 14 }}>Payment method</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {METHODS.map((m) => {
              const isSelected = selectedMethod === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedMethod(m.key)}
                  data-testid={`button-method-${m.key.toLowerCase()}`}
                  style={{
                    background: isSelected ? "#1e3a5f" : "#0d0d0d",
                    border: `2px solid ${isSelected ? "#3b82f6" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 12,
                    padding: "16px 10px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    transition: "all 0.15s",
                  }}
                >
                  {m.logo}
                  <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CONFIRM BUTTON ── */}
        <button
          onClick={handleConfirm}
          disabled={cloudpayMutation.isPending}
          data-testid="button-submit-deposit"
          style={{
            width: "100%", height: 54,
            background: "#0d0d0d",
            border: "1.5px solid #f59e0b",
            borderRadius: 12,
            color: "white",
            fontWeight: 700,
            fontSize: 17,
            cursor: cloudpayMutation.isPending ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: cloudpayMutation.isPending ? 0.7 : 1,
          }}
        >
          {cloudpayMutation.isPending
            ? <><Loader2 style={{ width: 20, height: 20 }} className="animate-spin" /> Processing...</>
            : "Confirm"
          }
        </button>

        {/* ── HELP LINK ── */}
        <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center" }}>
          Payment issue?{" "}
          <Link href="/service">
            <span style={{ color: "#f59e0b", cursor: "pointer", textDecoration: "underline" }}>Click here</span>
          </Link>
        </p>

        {/* ── INSTRUCTIONS ── */}
        <div style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            `1. The minimum deposit amount is ${fmt(minDepositFcfa)}. Deposits below this amount will not be credited.`,
            "2. Please use your most recent account number for each deposit to avoid using expired account information.",
            "3. Please carefully read and follow the instructions on the payment platform.",
            "4. If your deposit is not credited immediately after the transfer, please upload your payment information on the deposit page or contact official customer support for assistance.",
          ].map((text, i) => (
            <p key={i} style={{ margin: 0 }}>{text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
