import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import jinkoBg from "@assets/15502488526db98c02ac135d0ac0e262d31dee111d_1775833317804.jpg";
import historyIcon from "@assets/5708960_1774829436660-C3SIos42_1775833646464.png";
import { useUserCurrency } from "@/lib/useUserCurrency";

const GREEN = "#3db51d";
const PRESET_AMOUNTS_FCFA = [300, 500, 1000];

export default function DepositPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { document.title = "Deposit | Jinko Solar"; }, []);
  const { fmt, symbol, fromFcfa, toFcfa } = useUserCurrency();
  const [amount, setAmount] = useState<number | "">("");

  const { data: platformSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const MIN_DEPOSIT_FCFA = parseInt(platformSettings?.minDeposit || "300");
  const MIN_DEPOSIT = fromFcfa(MIN_DEPOSIT_FCFA);

  const handleDeposit = () => {
    const amt = typeof amount === "number" ? amount : 0;
    if (!amt || amt < MIN_DEPOSIT) {
      alert(`Minimum deposit amount is ${fmt(MIN_DEPOSIT_FCFA)}`);
      return;
    }
    navigate(`/pay?amount=${toFcfa(amt)}&country=${user?.country || "PH"}`);
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f5f5", overflowX: "hidden" }}>

      <div
        style={{
          backgroundImage: `url(${jinkoBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          paddingBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 16px 16px" }}>
          <button onClick={() => navigate("/")} data-testid="button-back" style={{ padding: 4 }}>
            <ChevronLeft style={{ width: 24, height: 24, color: "white" }} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0 }}>Deposit</h1>
          <Link href="/deposit-orders">
            <button data-testid="button-history" style={{ padding: 4 }}>
              <img src={historyIcon} alt="History" style={{ width: 26, height: 26, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </button>
          </Link>
        </div>

        <div
          style={{
            width: "calc(100% - 16px)",
            marginLeft: 16,
            marginRight: 0,
            boxSizing: "border-box" as const,
            background: "white",
            borderRadius: "24px 0 0 24px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            padding: "20px 16px 20px",
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {PRESET_AMOUNTS_FCFA.map((p) => {
              const displayAmt = fromFcfa(p);
              return (
                <button
                  key={p}
                  onClick={() => setAmount(displayAmt)}
                  data-testid={`button-preset-${p}`}
                  style={{
                    flex: "0 0 auto",
                    height: 36,
                    paddingLeft: 14,
                    paddingRight: 14,
                    borderRadius: 8,
                    border: `1.5px solid ${amount === displayAmt ? GREEN : "#d1d5db"}`,
                    background: amount === displayAmt ? GREEN : "white",
                    color: amount === displayAmt ? "white" : "#374151",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {fmt(p)}
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: 13, color: GREEN, marginBottom: 10, margin: "0 0 10px 0" }}>
            Please enter the deposit amount
          </p>

          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 15, color: "#9ca3af", fontWeight: 600, marginRight: 8 }}>{symbol}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder={MIN_DEPOSIT.toLocaleString()}
              data-testid="input-deposit-amount"
              style={{ flex: 1, fontSize: 16, color: "#6b7280", border: "none", outline: "none", background: "transparent" }}
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, background: "#f5f5f5", padding: "24px 20px 40px" }}>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <button
            onClick={handleDeposit}
            data-testid="button-submit-deposit"
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
            }}
          >
            Deposit Now
          </button>
        </div>

        <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 16 }}>
          💳 Deposit Instructions:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { bold: "Minimum deposit amount:", text: ` ${fmt(MIN_DEPOSIT_FCFA)}` },
            { bold: "Carefully verify your account information", text: " when making a transfer to avoid payment errors" },
            { bold: "Each order has its own payment information", text: "; do not reuse previous information for a second payment" },
            { bold: "After a successful transfer", text: ", please wait 10 to 30 minutes. If the amount is not credited after this time, contact customer service." },
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
  );
}
