import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { X, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import popupCharacters from "@assets/20260415_134352_1776260827812.png";
import popupTelegramBtn from "@assets/20260411_144546_1775920729992.png";
import popupCloseBtn from "@assets/20260411_144711_1775920729969.png";

import heroImg from "@assets/20260408_191813_1775675938233.jpg";
import rdBgImg from "@assets/file_0000000031a4720a8ef3e1dff767bc42_1779479835636.png";
import buildingImg from "@assets/file_00000000dc987243b80751c21ba23b22_1779479769826.png";

import robotBonus   from "@assets/file_00000000aac471f49ed3613abb850ef5_1779479769787.png";
import robotMission from "@assets/file_0000000031a4720a8ef3e1dff767bc42_1779479769721.png";

import iconDeposit  from "@assets/recharge-icon-BZHWSjQZ_(1)_1779463427355.png";
import iconWithdraw from "@assets/withdraw-icon-DFsum39V_(1)_1779463427337.png";
import iconGift     from "@assets/téléchargement_(66)_1779463427239.png";
import iconHelp     from "@assets/téléchargement_(67)_1779463427299.png";
import iconBell     from "@assets/téléchargement_(65)_1779463427321.png";

const TICKER_TEXT =
  "★★★★★73 recharged 35,000 ★★★★★★3765 recharged 15,000 ★★★★★8829 recharged 30,000 ★★★★★★1234 recharged 10,000 ★★★★★5678 recharged 50,000 ★★★★★9012 recharged 8,000 ★★★★★★3456 recharged 25,000 ★★★★7890 recharged 12,000 ★★★★★★";

function NioArcLogo() {
  return (
    <svg width="90" height="68" viewBox="0 0 90 68" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 64 C6 38 20 7 45 7 C70 7 84 38 84 64" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M20 64 C20 46 30 23 45 23 C60 23 70 46 70 64" stroke="white" strokeWidth="5.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const RD_STATS = [
  { value: "7",       label: "Countries",      orange: false },
  { value: "11,000+", label: "R&D Engineers",  orange: true  },
  { value: "12",      label: "Tech Domains",   orange: false },
  { value: "9300+",   label: "Patents",        orange: true  },
];

const ACTIONS = [
  { icon: iconDeposit,  label: "Dépôt",   path: "/deposit"    },
  { icon: iconWithdraw, label: "Retrait",  path: "/withdrawal" },
  { icon: iconGift,     label: "Cadeau",   path: "__gift__"    },
  { icon: iconHelp,     label: "Aide",     path: "/service"    },
];

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  useEffect(() => { document.title = "Home | Noviqra Ai"; }, []);

  const [showPopup, setShowPopup]           = useState(true);
  const [showGiftModal, setShowGiftModal]   = useState(false);
  const [giftCode, setGiftCode]             = useState("");

  const { data: platformSettings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const { fmt } = useUserCurrency();

  const claimMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/gift-codes/claim", { code });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Erreur"); }
      return res.json();
    },
    onSuccess: (data) => {
      setGiftCode(""); setShowGiftModal(false);
      toast({ title: "Félicitations!", description: data.message });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  if (!user) return <div style={{ minHeight: "100vh", backgroundColor: "#111111" }} />;

  const balance       = parseFloat(user.balance       || "0");
  const totalEarnings = parseFloat((user as any).totalEarnings || "0");

  const handleAction = (path: string) => {
    if (path === "__gift__") navigate("/gift-code");
    else navigate(path);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#111111", paddingBottom: 80 }}>

      {/* ── POPUP ── */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.82)" }}
          onClick={() => setShowPopup(false)}
        >
          <div
            style={{ width: "92vw", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={popupCharacters} alt="Bienvenue" style={{ width: "100%", borderRadius: 20 }} data-testid="img-popup" />
            <a
              href={platformSettings?.groupLink || "https://t.me/+R9SFSGneBkg3NTFh"}
              target="_blank" rel="noopener noreferrer"
              data-testid="button-popup-telegram"
              style={{ width: "90%", display: "block" }}
            >
              <img src={popupTelegramBtn} alt="Telegram Group" style={{ width: "100%", borderRadius: 50 }} />
            </a>
            <button
              onClick={() => setShowPopup(false)}
              data-testid="button-popup-close"
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, width: 64, height: 64 }}
            >
              <img src={popupCloseBtn} alt="Fermer" style={{ width: "100%", height: "100%" }} />
            </button>
          </div>
        </div>
      )}

      {/* ── HERO + ACCOUNT CARD ── */}
      <div
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 100%), url(${heroImg}) center/cover no-repeat`,
          paddingTop: 44,
          paddingBottom: 0,
        }}
      >
        {/* Arc logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <NioArcLogo />
        </div>

        {/* Dark account card */}
        <div style={{ margin: "0 10px", borderRadius: "18px 18px 0 0", background: "rgba(12,12,12,0.93)", padding: "18px 14px 14px" }}>

          <p style={{ color: "white", fontWeight: 700, fontSize: 17, textAlign: "center", marginBottom: 14 }}>Mon compte</p>

          {/* Balance + Cumul */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Solde",  value: fmt(balance)       },
              { label: "Cumul",  value: fmt(totalEarnings) },
            ].map((card) => (
              <div
                key={card.label}
                data-testid={`card-${card.label.toLowerCase()}`}
                style={{ background: "#0a0a0a", border: "1.5px solid #f59e0b", borderRadius: 10, padding: "14px 10px" }}
              >
                <p style={{ color: "white", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{card.value}</p>
                <p style={{ color: "#9ca3af", fontSize: 12 }}>{card.label}</p>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              onClick={() => navigate("/checkin")}
              data-testid="button-bonus-quotidien"
              style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: 130, border: "none", cursor: "pointer", padding: 0 }}
            >
              <img src={robotBonus} alt="Bonus quotidien" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.10) 55%)" }} />
              <p style={{ position: "absolute", bottom: 10, left: 10, right: 4, color: "white", fontWeight: 700, fontSize: 12, textAlign: "left", lineHeight: 1.3 }}>
                Bonus quotidien &gt;
              </p>
            </button>

            <button
              onClick={() => navigate("/tasks")}
              data-testid="button-centre-missions"
              style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: 130, border: "none", cursor: "pointer", padding: 0 }}
            >
              <img src={robotMission} alt="Centre de missions" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.10) 55%)" }} />
              <p style={{ position: "absolute", bottom: 10, left: 10, right: 4, color: "white", fontWeight: 700, fontSize: 12, textAlign: "left", lineHeight: 1.3 }}>
                Centre de missions &gt;
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION TICKER ── */}
      <div style={{ background: "#1a1a1a", display: "flex", alignItems: "center", overflow: "hidden", padding: "9px 0", gap: 0 }}>
        <div style={{ flexShrink: 0, padding: "0 10px 0 14px" }}>
          <img src={iconBell} alt="notification" style={{ width: 20, height: 20, objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              animation: "noviqra-ticker 32s linear infinite",
              color: "#d1d5db",
              fontSize: 12.5,
            }}
          >
            {TICKER_TEXT}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{TICKER_TEXT}
          </div>
        </div>
      </div>

      {/* ── 4 ACTION BUTTONS ── */}
      <div style={{ margin: "10px 10px 0" }}>
        <div style={{ background: "#1a1a1a", borderRadius: 16, padding: "18px 6px" }}>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleAction(action.path)}
                data-testid={`button-action-${action.label.toLowerCase().replace(/é/g, "e")}`}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", flex: 1 }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(255,255,255,0.09)",
                  border: "1.5px solid rgba(255,255,255,0.13)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <img src={action.icon} alt={action.label} style={{ width: 27, height: 27, objectFit: "contain" }} />
                </div>
                <span style={{ color: "white", fontSize: 11.5, fontWeight: 600 }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── R&D STATS ── */}
      <div style={{ margin: "10px 10px 0" }}>
        <div
          style={{
            borderRadius: 16,
            padding: "20px 14px",
            background: `linear-gradient(rgba(0,0,0,0.68), rgba(0,0,0,0.68)), url(${rdBgImg}) center/cover no-repeat`,
          }}
        >
          <p style={{ color: "white", fontWeight: 700, fontSize: 14, textAlign: "center", marginBottom: 18 }}>
            R&amp;D Technology Achievements &amp; Patents
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {RD_STATS.map((stat) => (
              <div key={stat.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span style={{ color: stat.orange ? "#f59e0b" : "white", fontWeight: 800, fontSize: 17 }}>{stat.value}</span>
                <span style={{ color: "#9ca3af", fontSize: 9, textAlign: "center", lineHeight: 1.3 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NOVIQRA AI BANNER ── */}
      <div style={{ margin: "10px 10px 0", borderRadius: 16, overflow: "hidden" }}>
        <div
          style={{
            height: 155,
            background: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.60)), url(${buildingImg}) center/cover no-repeat`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 6,
          }}
        >
          <p style={{ color: "white", fontWeight: 900, fontSize: 26, textAlign: "center", lineHeight: 1.2, textShadow: "0 2px 10px rgba(0,0,0,0.6)", margin: 0 }}>
            Noviqra Ai
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500, fontSize: 13, textAlign: "center", textShadow: "0 1px 6px rgba(0,0,0,0.5)", margin: 0 }}>
            Intelligent Automation. Limitless Solutions.
          </p>
        </div>
      </div>

      {/* ── GIFT CODE MODAL ── */}
      {showGiftModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.60)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGiftModal(false); }}
        >
          <div className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl" style={{ background: "#3db51d" }}>
            <div className="flex justify-end px-4 pt-4">
              <button onClick={() => setShowGiftModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(0,0,0,0.15)" }} data-testid="button-close-gift">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="px-6 pb-2 pt-1">
              <h2 className="text-white font-extrabold text-2xl italic leading-tight">Receive<br />Free Money</h2>
            </div>
            <div className="flex justify-center py-4">
              <span style={{ fontSize: 52 }}>💰</span>
            </div>
            <div className="px-6 pb-4">
              <input
                type="text"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                placeholder="Your bonus code"
                className="w-full px-4 py-3.5 rounded-xl text-center font-mono tracking-widest text-gray-800 text-sm outline-none"
                style={{ borderWidth: 2.5, borderStyle: "solid", borderColor: giftCode ? "#1a5c0a" : "white", background: "white" }}
                data-testid="input-gift-code-modal"
              />
            </div>
            <div className="px-6 pb-5">
              <button
                onClick={() => {
                  if (!giftCode.trim()) { toast({ title: "Error", description: "Please enter a code", variant: "destructive" }); return; }
                  claimMutation.mutate(giftCode.trim());
                }}
                disabled={claimMutation.isPending}
                className="w-full py-4 rounded-xl font-extrabold text-sm tracking-widest flex items-center justify-center gap-2"
                style={{ background: "#111827", color: "#f59e0b" }}
                data-testid="button-confirm-gift"
              >
                {claimMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin text-yellow-400" /> : "CONFIRM"}
              </button>
            </div>
            <div className="mx-5 mb-5 rounded-2xl p-4 space-y-2" style={{ background: "rgba(0,0,0,0.15)" }}>
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">💡</span>
                <p className="text-white text-xs font-medium leading-relaxed">
                  <span className="font-bold">Cash Rewards!</span><br />
                  Enter the bonus code to receive a random amount! Up to {fmt(1000)}!
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">💡</span>
                <p className="text-white text-xs leading-relaxed">
                  Bonus codes are published on the official Telegram channel every day at 11:30 and 18:00.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
