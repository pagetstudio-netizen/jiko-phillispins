import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import historyIcon from "@assets/20260409_133235_1775847886254.png";
import { useUserCurrency } from "@/lib/useUserCurrency";

interface Deposit {
  id: number;
  amount: string;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  approved: { label: "Successful", color: "#3db51d" },
  pending:  { label: "Pending",    color: "#f97316" },
  rejected: { label: "Rejected",   color: "#ef4444" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function DepositOrdersPage() {
  useEffect(() => { document.title = "Deposit History | Jinko Solar"; }, []);
  const { user } = useAuth();
  const { fmt } = useUserCurrency();

  const { data: deposits = [], isLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>

      <header style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: "white", borderBottom: "1px solid #e5e7eb" }}>
        <Link href="/account">
          <button style={{ padding: 4, marginRight: 8, background: "transparent", border: "none", cursor: "pointer" }} data-testid="button-back">
            <ChevronLeft size={22} color="#3db51d" />
          </button>
        </Link>
        <h1 style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#111827", paddingRight: 30 }}>
          Deposit History
        </h1>
      </header>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))
        ) : deposits.length === 0 ? (
          <EmptyState message="No deposits yet" />
        ) : (
          deposits.map((d) => {
            const cfg = STATUS_CONFIG[d.status] || { label: d.status, color: "#6b7280" };

            return (
              <div
                key={d.id}
                style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0", display: "flex", alignItems: "stretch" }}
                data-testid={`card-deposit-${d.id}`}
              >
                <div style={{ width: 76, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 10, background: "#f9fafb" }}>
                  <img
                    src={historyIcon}
                    alt="Deposit"
                    style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 12 }}
                  />
                </div>

                <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Deposit</span>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>
                      {fmt(parseFloat(d.amount))}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{formatDate(d.createdAt)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
