import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { useLang } from "@/lib/i18n";

interface BonusStatus {
  canClaim: boolean;
  hoursRemaining: number;
  totalBonusClaimed: number;
  daysPointed: number;
}

const DAILY_BONUS = 5;

function EiffageArc() {
  return (
    <svg width="56" height="44" viewBox="0 0 90 68" fill="none">
      <path d="M6 64 C6 38 20 7 45 7 C70 7 84 38 84 64" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M20 64 C20 46 30 23 45 23 C60 23 70 46 70 64" stroke="white" strokeWidth="5.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function CheckinPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fmt } = useUserCurrency();
  const { lang } = useLang();
  const fr = lang === "fr";
  const [, navigate] = useLocation();

  useEffect(() => { document.title = "Bonus Quotidien | EIFFAGE"; }, []);

  const { data: bonusStatus } = useQuery<BonusStatus>({
    queryKey: ["/api/daily-bonus-status"],
    refetchInterval: 60000,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/claim-daily-bonus", {});
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: fr ? "Pointage effectué avec succès" : "Check-in successful!", description: `+${fmt(DAILY_BONUS)}` });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const totalBonusClaimed = bonusStatus?.totalBonusClaimed || 0;
  const daysPointed       = bonusStatus?.daysPointed || 0;
  const canClaim          = bonusStatus?.canClaim ?? true;
  const hoursLeft         = bonusStatus?.hoursRemaining || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", display: "flex", flexDirection: "column", paddingBottom: 48 }}>

      {/* Back button */}
      <div style={{ padding: "44px 16px 0" }}>
        <button
          data-testid="button-back"
          onClick={() => window.history.length > 1 ? window.history.back() : navigate("/")}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
        >
          <ChevronLeft style={{ width: 28, height: 28, color: "#fff" }} />
        </button>
      </div>

      {/* ── Circle with total bonus ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
        <div style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "#1a1a1a",
          border: "3px solid #c87941",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}>
          <EiffageArc />
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
            {fmt(totalBonusClaimed)}
          </div>
        </div>

        {/* Bonus cumulé pill */}
        <div style={{
          marginTop: 14,
          background: "linear-gradient(135deg, #d4976a, #c07040)",
          borderRadius: 24,
          padding: "8px 40px",
          fontSize: 15,
          fontWeight: 600,
          color: "#fff",
        }}>
          {fr ? "Bonus cumulé" : "Total bonus"}
        </div>
      </div>

      {/* Consecutive days text */}
      <p style={{ textAlign: "center", color: "#fff", fontSize: 15, marginTop: 20, fontWeight: 400 }}>
        {fr
          ? `Vous avez pointé ${daysPointed} jours consécutifs`
          : `You have checked in ${daysPointed} consecutive days`}
      </p>

      {/* Stats row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        margin: "24px 32px 0",
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{daysPointed}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{fr ? "Jours" : "Days"}</div>
        </div>
        <div style={{ width: 1, height: 48, background: "#333" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{fmt(totalBonusClaimed)}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{fr ? "Récompenses" : "Rewards"}</div>
        </div>
      </div>

      {/* Pointer button */}
      <div style={{ margin: "28px 20px 0" }}>
        {canClaim ? (
          <button
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
            data-testid="button-pointer"
            style={{
              width: "100%",
              height: 52,
              borderRadius: 26,
              background: "#111",
              border: "1.5px solid #c87941",
              color: "#fff",
              fontWeight: 700,
              fontSize: 17,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: claimMutation.isPending ? 0.7 : 1,
            }}
          >
            {claimMutation.isPending ? (
              <Loader2 style={{ width: 20, height: 20 }} className="animate-spin" />
            ) : (fr ? "Pointer" : "Check In")}
          </button>
        ) : (
          <button
            disabled
            data-testid="button-pointer-disabled"
            style={{
              width: "100%",
              height: 52,
              borderRadius: 26,
              background: "#1a1a1a",
              border: "1.5px solid #333",
              color: "#555",
              fontWeight: 700,
              fontSize: 16,
              cursor: "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {fr ? `Revenez dans ${hoursLeft}h` : `Come back in ${hoursLeft}h`}
          </button>
        )}
      </div>

      {/* Conseils utiles */}
      <div style={{
        margin: "24px 20px 0",
        background: "#1a1a1a",
        borderRadius: 12,
        padding: "16px 18px",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
          {fr ? "Conseils utiles" : "Useful tips"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            `1. Daily login reward: ${fmt(DAILY_BONUS)}.`,
            "2. Log in once per day to accumulate bonuses.",
            "3. Log in again after midnight each day.",
          ].map((tip, i) => (
            <p key={i} style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.5 }}>{tip}</p>
          ))}
        </div>
      </div>

    </div>
  );
}
