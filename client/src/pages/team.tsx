import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useUserCurrency } from "@/lib/useUserCurrency";
import heroBg from "@assets/IMG_20260610_064537_635_1781191770166.jpg";
import carLeft from "@assets/IMG_20260610_064536_725_1781191770204.jpg";
import carRight from "@assets/IMG_20260610_064531_480_1781191770226.jpg";

interface TeamStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalCommission: number;
  level1Commission: number;
  level2Commission: number;
  level3Commission: number;
  level1Recharged: number;
}

interface Settings {
  level1Commission: string;
  level2Commission: string;
  level3Commission: string;
  [key: string]: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { fmt } = useUserCurrency();

  useEffect(() => { document.title = "Équipe | EIFFAGE"; }, []);

  const { data: stats } = useQuery<TeamStats>({
    queryKey: ["/api/team/stats"],
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  if (!user) return null;

  const referralCode = user.referralCode || "";
  const referralLink = `${window.location.origin}/register?start=${referralCode}`;
  const totalPersonnes = (stats?.level1Count || 0) + (stats?.level2Count || 0) + (stats?.level3Count || 0);
  const totalRecompenses = stats?.totalCommission || 0;

  const level1Rate = settings?.level1Commission ? `${settings.level1Commission}%` : "36%";
  const level2Rate = settings?.level2Commission ? `${settings.level2Commission}%` : "1%";
  const level3Rate = settings?.level3Commission ? `${settings.level3Commission}%` : "1%";

  const levels = [
    { label: "LV1", rate: level1Rate, count: stats?.level1Count || 0, reward: stats?.level1Commission || 0 },
    { label: "LV2", rate: level2Rate, count: stats?.level2Count || 0, reward: stats?.level2Commission || 0 },
    { label: "LV3", rate: level3Rate, count: stats?.level3Count || 0, reward: stats?.level3Commission || 0 },
  ];

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Code copié !" });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Lien copié !" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingBottom: 80 }}>

      {/* Hero image */}
      <div style={{ position: "relative", width: "100%", height: 200, overflow: "hidden" }}>
        <img
          src={heroBg}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(10,10,10,0.85) 100%)" }} />
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Invitation code */}
        <div style={{ paddingTop: 20, paddingBottom: 16, borderBottom: "1px solid #222" }}>
          <p style={{ color: "#aaa", fontSize: 13, marginBottom: 6 }}>Code d'invitation</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: 1 }} data-testid="text-referral-code">
              {referralCode}
            </span>
            <button
              onClick={copyCode}
              data-testid="button-copy-code"
              style={{ background: "transparent", border: "1.5px solid #fff", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13, padding: "6px 18px", cursor: "pointer", letterSpacing: 1 }}
            >
              COPIER
            </button>
          </div>
        </div>

        {/* Invitation link */}
        <div style={{ paddingTop: 16, paddingBottom: 20, borderBottom: "1px solid #222" }}>
          <p style={{ color: "#aaa", fontSize: 13, marginBottom: 6 }}>Lien d'invitation</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#888", fontSize: 11, flex: 1, wordBreak: "break-all" }} data-testid="text-referral-link">
              {referralLink}
            </span>
            <button
              onClick={copyLink}
              data-testid="button-copy-link"
              style={{ background: "transparent", border: "1.5px solid #fff", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13, padding: "6px 18px", cursor: "pointer", letterSpacing: 1, flexShrink: 0 }}
            >
              COPIER
            </button>
          </div>
        </div>

        {/* LV1/LV2/LV3 table */}
        <div style={{ marginTop: 20, border: "1.5px solid #d97706", borderRadius: 12, overflow: "hidden" }}>
          {levels.map((lv, i) => (
            <div
              key={lv.label}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                alignItems: "center",
                padding: "14px 16px",
                borderBottom: i < levels.length - 1 ? "1px solid #1f1f1f" : "none",
                background: "#111",
              }}
              data-testid={`row-level-${i + 1}`}
            >
              {/* LV label */}
              <div>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>{lv.label}</span>
              </div>

              {/* Commission */}
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 17 }}>{lv.rate}</div>
                <div style={{ color: "#888", fontSize: 11 }}>Commission</div>

              </div>

              {/* Count + Reward */}
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }} data-testid={`text-lv${i+1}-count`}>{lv.count}</div>
                    <div style={{ color: "#888", fontSize: 11 }}>Membres</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }} data-testid={`text-lv${i+1}-reward`}>{fmt(lv.reward)}</div>
                    <div style={{ color: "#888", fontSize: 11 }}>Gains</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>

          {/* Total personnes */}
          <button
            onClick={() => navigate("/team-details?type=persons")}
            data-testid="card-total-personnes"
            style={{ background: "#111", border: "none", borderRadius: 14, padding: "16px 12px", cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <img src={carLeft} alt="" style={{ width: "100%", maxWidth: 130, height: 70, objectFit: "contain", marginBottom: 8 }} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 28, lineHeight: 1 }} data-testid="text-total-personnes">
              {totalPersonnes}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <span style={{ color: "#ccc", fontSize: 13, fontWeight: 500 }}>Total membres</span>
              <ChevronRight size={14} color="#ccc" />
            </div>
          </button>

          {/* Total recompenses */}
          <button
            onClick={() => navigate("/team-details?type=rewards")}
            data-testid="card-total-recompenses"
            style={{ background: "#111", border: "none", borderRadius: 14, padding: "16px 12px", cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <img src={carRight} alt="" style={{ width: "100%", maxWidth: 130, height: 70, objectFit: "contain", marginBottom: 8 }} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 22, lineHeight: 1 }} data-testid="text-total-recompenses">
              {fmt(totalRecompenses)}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <span style={{ color: "#ccc", fontSize: 13, fontWeight: 500 }}>Total gains</span>
              <ChevronRight size={14} color="#ccc" />
            </div>
          </button>

        </div>

        {/* Info text */}
        <div style={{ marginTop: 24, paddingBottom: 16 }}>
          <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
            Lorsqu'un ami que vous invitez s'inscrit et investit, vous recevez immédiatement une commission de {level1Rate} sur son investissement.
          </p>
          <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
            Lorsque les membres de votre équipe de niveau 2 investissent, vous recevez une commission de {level2Rate}.
          </p>
          <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
            Lorsque les membres de votre équipe de niveau 3 investissent, vous recevez également une commission de {level3Rate}.
          </p>
          <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.7 }}>
            Dès que vos filleuls investissent, la commission est immédiatement créditée sur votre compte et vous pouvez la retirer instantanément.
          </p>
        </div>

      </div>
    </div>
  );
}
