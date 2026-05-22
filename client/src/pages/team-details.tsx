import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useUserCurrency } from "@/lib/useUserCurrency";

interface TeamMember {
  id: number;
  fullName: string;
  phone: string;
  country: string;
  createdAt: string;
  totalInvested: number;
}

interface TeamDetails {
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
  totalLevel1Invested: number;
  totalLevel2Invested: number;
  totalLevel3Invested: number;
}

export default function TeamDetailsPage() {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [, navigate] = useLocation();
  const { fmt } = useUserCurrency();

  const { data: team } = useQuery<TeamDetails>({
    queryKey: ["/api/team/details"],
  });

  const getCount = (level: 1 | 2 | 3) => {
    if (!team) return 0;
    return level === 1 ? team.level1.length : level === 2 ? team.level2.length : team.level3.length;
  };

  const getInvested = (level: 1 | 2 | 3) => {
    if (!team) return 0;
    return level === 1 ? team.totalLevel1Invested : level === 2 ? team.totalLevel2Invested : team.totalLevel3Invested;
  };

  const membersCount = getCount(activeLevel);
  const invested = getInvested(activeLevel);

  const tabs: { num: 1 | 2 | 3; label: string }[] = [
    { num: 1, label: "Lv1" },
    { num: 2, label: "Lv2" },
    { num: 3, label: "Lv3" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 12px", gap: 16 }}>
        <button
          onClick={() => navigate("/team")}
          data-testid="button-back-team"
          style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
        >
          <ChevronLeft size={24} color="#fff" />
        </button>
        <h1 style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }} data-testid="text-page-title">
          Historique d equipe
        </h1>
        <div style={{ width: 32 }} />
      </div>

      {/* Level tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", margin: "0 0 16px" }}>
        {tabs.map((tab) => (
          <button
            key={tab.num}
            onClick={() => setActiveLevel(tab.num)}
            data-testid={`tab-level-${tab.num}`}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: activeLevel === tab.num ? "#fff" : "#555",
              fontWeight: activeLevel === tab.num ? 700 : 400,
              fontSize: 15,
              padding: "12px 0",
              cursor: "pointer",
              borderBottom: activeLevel === tab.num ? "2px solid #fff" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats card */}
      <div style={{ margin: "0 16px 16px" }}>
        <div style={{ background: "#111", borderRadius: 12, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: "20px 16px", textAlign: "center", borderRight: "1px solid #222" }}>
            <p style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>Membres de l equipe</p>
            <p style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: 0 }} data-testid="text-members-count">
              {membersCount}
            </p>
          </div>
          <div style={{ flex: 1, padding: "20px 16px", textAlign: "center" }}>
            <p style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>Recharge de l equipe</p>
            <p style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: 0 }} data-testid="text-recharge-amount">
              {fmt(invested)}
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {membersCount === 0 && (
        <div style={{ textAlign: "center", paddingTop: 40, color: "#555", fontSize: 14 }}>
          Plus de donnees
        </div>
      )}

    </div>
  );
}
