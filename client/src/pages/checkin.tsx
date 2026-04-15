import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2, Gift } from "lucide-react";
import { Link } from "wouter";
import robotGift from "@assets/file_00000000168c7246a166e7a2da1eb7ba_1773319220043.png";

interface BonusStatus {
  canClaim: boolean;
  hoursRemaining: number;
  totalBonusClaimed: number;
  daysPointed: number;
}

export default function CheckinPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  useEffect(() => { document.title = "Daily Check-in | Jinko Solar"; }, []);

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
      toast({ title: "Bonus received!", description: "₱5 added to your balance" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const totalBonusClaimed = bonusStatus?.totalBonusClaimed || 0;
  const daysPointed = bonusStatus?.daysPointed || 0;

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="flex-1 overflow-y-auto pb-24">

        <header className="flex items-center px-4 py-3 bg-white border-b border-gray-100">
          <Link href="/">
            <button className="p-1" data-testid="button-back">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          </Link>
          <h1 className="flex-1 text-center text-base font-semibold text-gray-800 pr-7">Daily Check-in</h1>
        </header>

        <div className="flex justify-center mt-6 mb-[-56px] relative z-10">
          <img
            src={robotGift}
            alt="Gift"
            className="w-36 h-36 object-contain drop-shadow-lg"
            style={{ mixBlendMode: "multiply" }}
          />
        </div>

        <div className="mx-4">
          <div className="bg-[#3db51d] rounded-3xl pt-16 pb-6 px-5 shadow-lg">
            <h2 className="text-white text-2xl font-bold text-center">Daily Check-in</h2>
            <p className="text-white/80 text-sm text-center mt-1 mb-5">
              Activate your daily rewards
            </p>

            <div className="flex items-stretch gap-0">
              <div className="flex-1 flex flex-col items-center gap-1 border-r border-white/30 pr-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-1">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <p className="text-white text-xl font-bold">₱5</p>
                <p className="text-white/75 text-xs text-center">Today's reward</p>
              </div>

              <div className="flex-1 flex flex-col items-center gap-1 pl-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-1">
                  <span className="text-white font-bold text-base">$</span>
                </div>
                <p className="text-white text-xl font-bold">{daysPointed}</p>
                <p className="text-white/75 text-xs text-center">Consecutive days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-5 px-6 text-center">
            <p className="text-[#3db51d] text-2xl font-bold">₱{totalBonusClaimed}</p>
            <p className="text-gray-500 text-sm mt-1">Total bonuses claimed</p>
          </div>
        </div>

        <div className="mx-4 mt-5">
          {bonusStatus?.canClaim ? (
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="w-full py-4 rounded-full text-white font-bold text-lg shadow-md disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #3db51d, #2a8d13)" }}
              data-testid="button-pointer"
            >
              {claimMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Claim Daily Bonus"
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-4 rounded-full font-bold text-lg"
              style={{ background: "#e0e0e0", color: "#9e9e9e" }}
              data-testid="button-pointer-disabled"
            >
              Come back in {bonusStatus?.hoursRemaining || 0}h
            </button>
          )}
        </div>

        <div className="mx-4 mt-5 space-y-1.5">
          <p className="text-gray-400 text-xs">1. Daily login reward: ₱5</p>
          <p className="text-gray-400 text-xs">2. Log in once per day to accumulate points.</p>
        </div>

      </div>
    </div>
  );
}
