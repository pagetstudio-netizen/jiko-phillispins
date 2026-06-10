import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { useLang } from "@/lib/i18n";

interface Deposit {
  id: number;
  amount: string;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

interface Withdrawal {
  id: number;
  amount: string;
  netAmount?: string;
  status: string;
  createdAt: string;
}

const STATUS_FR: Record<string, string> = {
  approved: "Réussi",
  pending:  "En attente",
  rejected: "Rejeté",
};
const STATUS_EN: Record<string, string> = {
  approved: "Successful",
  pending:  "Pending",
  rejected: "Rejected",
};
const STATUS_COLOR: Record<string, string> = {
  approved: "#3db51d",
  pending:  "#f97316",
  rejected: "#ef4444",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const DARK_CARD = "#1a1a1a";
const BORDER    = "#2a2a2a";
const GREEN     = "#3db51d";

export default function DepositOrdersPage() {
  const { fmt } = useUserCurrency();
  const { lang } = useLang();
  const fr = lang === "fr";
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const defaultTab = params.get("tab") === "withdrawal" ? "withdrawal" : "deposit";
  const [activeTab, setActiveTab] = useState<"deposit" | "withdrawal">(defaultTab as any);

  useEffect(() => { document.title = "Historique | EIFFAGE"; }, []);

  const { data: deposits = [], isLoading: loadingDeposits } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
  });

  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/history"],
  });

  const isLoading = activeTab === "deposit" ? loadingDeposits : loadingWithdrawals;

  const statusLabel = (status: string) =>
    fr ? (STATUS_FR[status] || status) : (STATUS_EN[status] || status);

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 0", paddingTop: 48 }}>
        <button
          data-testid="button-back"
          onClick={() => window.history.length > 1 ? window.history.back() : navigate("/account")}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}
        >
          <ChevronLeft style={{ width: 24, height: 24, color: "#fff" }} />
        </button>
        <h1 style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 17, color: "#fff", marginRight: 32 }}>
          {fr ? "Détails du solde" : "Balance details"}
        </h1>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", margin: "16px 0 0", borderBottom: `1px solid ${BORDER}` }}>
        {([
          { key: "withdrawal", label: fr ? "Relevé de retrait" : "Withdrawal statement" },
          { key: "deposit",    label: fr ? "Ordre de dépôt"    : "Deposit orders" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            data-testid={`tab-${tab.key}`}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "12px 8px",
              fontSize: 14,
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? "#fff" : "#666",
              position: "relative",
            }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div style={{
                position: "absolute",
                bottom: -1,
                left: "50%",
                transform: "translateX(-50%)",
                width: 40,
                height: 3,
                borderRadius: 2,
                background: "#3a7bd5",
              }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "12px 12px 80px", display: "flex", flexDirection: "column", gap: 10 }}>

        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ background: DARK_CARD, borderRadius: 12, height: 68, opacity: 0.4 }} />
          ))
        ) : activeTab === "deposit" ? (

          deposits.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555", marginTop: 48, fontSize: 14 }}>
              {fr ? "Plus de données" : "No data"}
            </p>
          ) : (
            <>
              {deposits.map((d) => (
                <div
                  key={d.id}
                  data-testid={`card-deposit-${d.id}`}
                  style={{
                    background: DARK_CARD,
                    borderRadius: 10,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: GREEN }}>
                      {fr ? "Ordre de dépôt" : "Deposit order"}
                    </div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      {formatDate(d.createdAt)}
                    </div>
                    <div style={{ fontSize: 11, color: STATUS_COLOR[d.status] || "#888", marginTop: 3, fontWeight: 600 }}>
                      {statusLabel(d.status)}
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: GREEN }}>
                    +{fmt(parseFloat(d.amount))}
                  </div>
                </div>
              ))}
              <p style={{ textAlign: "center", color: "#444", fontSize: 13, marginTop: 8 }}>
                {fr ? "Plus de données" : "No more data"}
              </p>
            </>
          )

        ) : (

          withdrawals.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555", marginTop: 48, fontSize: 14 }}>
              {fr ? "Plus de données" : "No data"}
            </p>
          ) : (
            <>
              {withdrawals.map((w) => {
                const displayAmt = parseFloat(w.netAmount || w.amount);
                return (
                  <div
                    key={w.id}
                    data-testid={`card-withdrawal-${w.id}`}
                    style={{
                      background: DARK_CARD,
                      borderRadius: 10,
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: GREEN }}>
                        {fr ? "Relevé de retrait" : "Withdrawal"}
                      </div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                        {formatDate(w.createdAt)}
                      </div>
                      <div style={{ fontSize: 11, color: STATUS_COLOR[w.status] || "#888", marginTop: 3, fontWeight: 600 }}>
                        {statusLabel(w.status)}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>
                      -{fmt(displayAmt)}
                    </div>
                  </div>
                );
              })}
              <p style={{ textAlign: "center", color: "#444", fontSize: 13, marginTop: 8 }}>
                {fr ? "Plus de données" : "No more data"}
              </p>
            </>
          )

        )}
      </div>
    </div>
  );
}
