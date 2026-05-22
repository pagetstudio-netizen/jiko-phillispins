import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2, Users, Coins } from "lucide-react";
import jinkoBg from "@assets/Jinko-Solars-Brand-Introduction_1775754852895.jpg";
import { useLocation } from "wouter";

interface TeamStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalCommission: number;
  level1Commission: number;
  level2Commission: number;
  level3Commission: number;
}

const GREEN = "#3db51d";
const GREEN_DARK = "#2a8d13";

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  useEffect(() => { document.title = "Team | Noviqra Ai"; }, []);
  const [, navigate] = useLocation();

  const { data: stats } = useQuery<TeamStats>({
    queryKey: ["/api/team/stats"],
  });

  if (!user) return null;

  const referralLink = `${window.location.origin}/register?start=${user.referralCode}`;
  const totalCommission = stats?.totalCommission || 0;
  const totalReferrals =
    (stats?.level1Count || 0) + (stats?.level2Count || 0) + (stats?.level3Count || 0);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link copied!" });
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: "Join Noviqra Ai", url: referralLink });
    } else {
      navigator.clipboard.writeText(referralLink);
      toast({ title: "Link copied!" });
    }
  };

  const levels = [
    { num: 1, rate: "27%", count: stats?.level1Count || 0, commission: stats?.level1Commission || 0 },
    { num: 2, rate: "2%",  count: stats?.level2Count || 0, commission: stats?.level2Commission || 0 },
    { num: 3, rate: "1%",  count: stats?.level3Count || 0, commission: stats?.level3Commission || 0 },
  ];

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-5 space-y-4">

        {/* Referral card */}
        <div className="rounded-2xl overflow-hidden shadow-md" style={{ position: "relative" }}>
          <img
            src={jinkoBg}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 100%)" }} />
          <div className="relative p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-white/70 text-xs font-medium">Referral Link</p>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-xs font-bold"
                style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
                data-testid="button-copy-link"
              >
                <Copy size={11} />
                Copy
              </button>
            </div>

            <p className="font-extrabold text-white text-[17px] leading-snug mb-2">
              Invite your friends and earn<br />free money!
            </p>

            <div className="flex items-end justify-between gap-2">
              <p className="text-white/50 text-[11px] truncate flex-1" data-testid="text-referral-link">
                {referralLink}
              </p>
              <button
                onClick={shareLink}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-xs font-bold flex-shrink-0"
                style={{ background: `linear-gradient(90deg, ${GREEN} 0%, ${GREEN_DARK} 100%)` }}
                data-testid="button-share-link"
              >
                <Share2 size={11} />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* My cashback */}
        <div>
          <h2 className="text-gray-900 font-bold text-base mb-3">My Cashback</h2>

          <div className="grid grid-cols-2 gap-3">
            {/* My referrals */}
            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor: "#1e1e1e",
                backgroundImage: `
                  repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px),
                  repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px)
                `,
              }}
              data-testid="card-filleuls"
            >
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} color={GREEN} />
                <span className="text-gray-400 text-xs font-medium">My Referrals</span>
              </div>
              <p className="text-white text-3xl font-extrabold" data-testid="text-filleuls-count">
                {totalReferrals}
              </p>
            </div>

            {/* Referral bonus */}
            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor: "#1e1e1e",
                backgroundImage: `
                  repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px),
                  repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px)
                `,
              }}
              data-testid="card-bonus"
            >
              <div className="flex items-center gap-2 mb-3">
                <Coins size={16} color={GREEN} />
                <span className="text-gray-400 text-xs font-medium">Referral Bonus</span>
              </div>
              <p className="text-white text-3xl font-extrabold mb-3" data-testid="text-bonus-amount">
                {totalCommission.toFixed(0)}
              </p>
              <button
                onClick={() => navigate("/withdrawal")}
                className="px-4 py-1 rounded-full text-white text-xs font-bold"
                style={{ background: `linear-gradient(90deg, ${GREEN} 0%, ${GREEN_DARK} 100%)` }}
                data-testid="button-retrait-bonus"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Level cards */}
        <div className="space-y-3">
          {levels.map((level) => (
            <div
              key={level.num}
              className="rounded-2xl overflow-hidden flex shadow-md"
              data-testid={`card-level-${level.num}`}
            >
              {/* Left: dark */}
              <div
                className="flex flex-col items-center justify-center py-5 px-4 min-w-[88px]"
                style={{
                  backgroundColor: "#111111",
                  backgroundImage: `
                    repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 8px),
                    repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 8px)
                  `,
                }}
              >
                <span className="text-gray-400 text-[11px] font-semibold mb-1 tracking-wide">
                  Level {level.num}
                </span>
                <span className="font-extrabold text-2xl" style={{ color: GREEN }}>
                  {level.rate}
                </span>
              </div>

              {/* Right: white */}
              <div className="flex-1 bg-white flex flex-col justify-center px-5 py-5 gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Referrals</span>
                  <span className="text-sm font-bold" style={{ color: GREEN }} data-testid={`text-level${level.num}-count`}>
                    {level.count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Deposit commission</span>
                  <span className="text-sm font-bold" style={{ color: GREEN }} data-testid={`text-level${level.num}-commission`}>
                    {level.commission.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
