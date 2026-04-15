import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronLeft, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

function maskPhone(phone: string): string {
  if (phone.length <= 5) return phone;
  const first2 = phone.slice(0, 2);
  const last3 = phone.slice(-3);
  const masked = "*".repeat(Math.max(phone.length - 5, 3));
  return `${first2}${masked}${last3}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const h = date.getHours();
  const hours12 = h % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${month}/${day}/${year} ${hours12}:${minutes}:${seconds} ${ampm}`;
}

export default function TeamDetailsPage() {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const { fmt } = useUserCurrency();

  const { data: team, isLoading } = useQuery<TeamDetails>({
    queryKey: ["/api/team/details"],
  });

  const getLevelMembers = (): TeamMember[] => {
    if (!team) return [];
    switch (activeLevel) {
      case 1: return team.level1;
      case 2: return team.level2;
      case 3: return team.level3;
    }
  };

  const levels = [
    { num: 1 as const, total: team?.totalLevel1Invested || 0, count: team?.level1?.length || 0, label: "Niveau 1" },
    { num: 2 as const, total: team?.totalLevel2Invested || 0, count: team?.level2?.length || 0, label: "Niveau 2" },
    { num: 3 as const, total: team?.totalLevel3Invested || 0, count: team?.level3?.length || 0, label: "Niveau 3" },
  ];

  const members = getLevelMembers();
  const totalAllMembers = (team?.level1?.length || 0) + (team?.level2?.length || 0) + (team?.level3?.length || 0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Red header */}
      <div className="relative px-4 pt-4 pb-8" style={{ background: "linear-gradient(135deg, #3db51d 0%, #2a8d13 100%)" }}>
        <div className="flex items-center mb-4">
          <Link href="/">
            <button className="p-1.5 bg-white/20 rounded-full" data-testid="button-back-team">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <h1 className="flex-1 text-center text-base font-bold text-white pr-8" data-testid="text-page-title">
            Mon équipe
          </h1>
        </div>

        {/* Total members badge */}
        <div className="flex items-center justify-center gap-2">
          <div className="bg-white/20 rounded-full px-5 py-1.5 flex items-center gap-2">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">{totalAllMembers} membre(s) au total</span>
          </div>
        </div>
      </div>

      {/* Level tabs — overlapping the red header */}
      <div className="mx-4 -mt-5 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex">
          {levels.map((level) => (
            <button
              key={level.num}
              onClick={() => setActiveLevel(level.num)}
              className={`flex-1 py-3 text-center transition-colors relative`}
              data-testid={`tab-level-${level.num}`}
            >
              {activeLevel === level.num && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: "#3db51d" }} />
              )}
              <p className={`text-sm font-bold ${activeLevel === level.num ? "text-[#3db51d]" : "text-gray-400"}`}>
                {level.count}
              </p>
              <p className={`text-[11px] mt-0.5 ${activeLevel === level.num ? "text-[#3db51d]" : "text-gray-400"}`}>
                {level.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Investment totals for active level */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Total investi — Niveau {activeLevel}</p>
            <p className="text-base font-black mt-0.5" style={{ color: "#3db51d" }}>
              {fmt(levels[activeLevel - 1].total)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fff0f2" }}>
            <Users className="w-5 h-5" style={{ color: "#3db51d" }} />
          </div>
        </div>
      </div>

      {/* Members list */}
      <div className="mx-4 mt-3 mb-6 flex-1">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-14 px-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#fff0f2" }}>
                <Users className="w-7 h-7" style={{ color: "#3db51d" }} />
              </div>
              <p className="text-gray-500 text-sm font-medium">Aucun membre au niveau {activeLevel}</p>
              <p className="text-gray-400 text-xs mt-1">Invitez des amis pour agrandir votre équipe</p>
            </div>
          ) : (
            <div>
              {/* List header */}
              <div className="flex items-center px-4 py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 flex-1">Membre</span>
                <span className="text-xs text-gray-400">Investi</span>
              </div>

              {members.map((member, idx) => (
                <div
                  key={member.id}
                  className={`flex items-center px-4 py-3 gap-3 ${idx < members.length - 1 ? "border-b border-gray-50" : ""}`}
                  data-testid={`team-member-${member.id}`}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #3db51d, #2a8d13)" }}
                  >
                    <span className="text-white text-sm font-bold">
                      {member.phone.slice(0, 1).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800" data-testid={`text-member-phone-${member.id}`}>
                      {maskPhone(member.phone)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(member.createdAt)}</p>
                  </div>

                  {/* Invested amount */}
                  <p
                    className="text-sm font-bold shrink-0"
                    style={{ color: "#3db51d" }}
                    data-testid={`text-member-invested-${member.id}`}
                  >
                    {fmt(member.totalInvested)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
