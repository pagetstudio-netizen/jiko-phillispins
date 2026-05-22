import { useAuth } from "@/lib/auth";
import { SiTelegram } from "react-icons/si";
import { useLocation } from "wouter";
import ContactSheet from "@/components/contact-sheet";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { Loader2, MessageCircleMore, X, Gift } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import iconGratuit from "@assets/20260409_174413_1775756828265.png";
import iconPreuve from "@assets/20260409_174658_1775756828223.png";
import iconRecharger from "@assets/20260409_133235_1775749369916.png";
import iconRetrait from "@assets/20260409_133935_1775749370458.png";
import iconContact from "@assets/20260409_152753_1775749370488.png";
import popupCharacters from "@assets/20260415_134352_1776260827812.png";
import popupTelegramBtn from "@assets/20260411_144546_1775920729992.png";
import popupCloseBtn from "@assets/20260411_144711_1775920729969.png";
import type { Product } from "@shared/schema";

import p1 from "@assets/panneaux-solaires-3d-realiste_625553-173_1775768333512.jpg";
import p2 from "@assets/images_(33)_1775768333811.jpeg";
import p3 from "@assets/panneau-solaire-detoure-min_1775768333844.png";
import p4 from "@assets/panneau-solaire-hybride_1775768333929.jpg";
import p5 from "@assets/images_(30)_1775768333959.jpeg";
import p6 from "@assets/images_(29)_1775768333985.jpeg";
import p7 from "@assets/images_(28)_1775768334009.jpeg";
import p8 from "@assets/images_(26)_1775768334029.jpeg";
import p9 from "@assets/Jinko-solar-panel-535-555W-p-type-1_1775768334052.jpg";
import jinkoLogoText from "@assets/JinkoSolarLOGO_1775671142017.png";
import jinkoLogoSquare from "@assets/jinko-solar-logo-png_seeklogo-265492_1775671142176.png";
import heroImg from "@assets/20260408_191813_1775675938233.jpg";

const productImages: Record<number, string> = { 2: p1, 3: p2, 4: p3, 5: p4, 6: p5, 7: p6, 8: p7, 9: p8, 10: p9 };

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  canClaimFree: boolean;
  ownedCount?: number;
}

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  useEffect(() => { document.title = "Home | Noviqra Ai"; }, []);
  const [showPopup, setShowPopup] = useState(true);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [giftCode, setGiftCode] = useState("");

  const claimMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/gift-codes/claim", { code });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: (data) => {
      refreshUser();
      setGiftCode("");
      setShowGiftModal(false);
      toast({ title: "Congratulations!", description: data.message });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: platformSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithOwnership[]>({
    queryKey: ["/api/products"],
    enabled: !!user,
  });

  useEffect(() => {
    setShowPopup(true);
  }, [location]);

  if (!user) return <div className="min-h-screen bg-gray-100" />;

  const country = getCountryByCode(user.country);
  const currency = country?.currency || "PHP";
  const { fmt } = useUserCurrency();
  const paidProducts = products?.filter(p => !p.isFree) || [];

  const quickActions = [
    { label: "Deposit", img: iconRecharger, onClick: () => navigate("/deposit") },
    { label: "Withdraw", img: iconRetrait, onClick: () => navigate("/withdrawal") },
    { label: "Contact Us", img: iconContact, onClick: () => setShowContactSheet(true) },
    { label: "Free Money", img: iconGratuit, onClick: () => { setGiftCode(""); setShowGiftModal(true); } },
    { label: "Stay Informed", img: iconPreuve, onClick: () => navigate("/info") },
  ];

  return (
    <div className="flex flex-col min-h-full bg-gray-100">

      <ContactSheet open={showContactSheet} onClose={() => setShowContactSheet(false)} />

      {/* Popup */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 animate-in fade-in duration-200"
          onClick={() => setShowPopup(false)}
        >
          {/* Contenu du popup — clic intérieur ne ferme pas */}
          <div
            style={{ width: "92vw", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image principale */}
            <img
              src={popupCharacters}
              alt="Bienvenue"
              style={{ width: "100%", display: "block", borderRadius: 20 }}
              data-testid="img-popup"
            />

            {/* Bouton Télégram Groupe */}
            <a
              href={platformSettings?.groupLink || "https://t.me/+R9SFSGneBkg3NTFh"}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="button-popup-telegram"
              style={{ width: "90%", display: "block" }}
              aria-label="Rejoindre le groupe Telegram"
            >
              <img
                src={popupTelegramBtn}
                alt="Télégram Group"
                style={{ width: "100%", display: "block", borderRadius: 50 }}
              />
            </a>

            {/* Bouton X — ferme le popup */}
            <button
              onClick={() => setShowPopup(false)}
              data-testid="button-popup-close"
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, width: 64, height: 64 }}
              aria-label="Fermer"
            >
              <img src={popupCloseBtn} alt="Fermer" style={{ width: "100%", height: "100%" }} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm">
        <img src={jinkoLogoText} alt="Jinko Solar" className="h-10 w-auto object-contain" data-testid="text-brand-name" />
        <button onClick={() => setShowContactSheet(true)} data-testid="button-service-header" className="p-1">
          <MessageCircleMore className="w-7 h-7 text-gray-700" />
        </button>
      </div>

      {/* Hero Image with overlaid buttons */}
      <div style={{ position: "relative", lineHeight: 0 }}>
        <img
          src={heroImg}
          alt="Jinko Solar"
          style={{ width: "100%", display: "block", height: "auto" }}
          data-testid="img-hero"
        />
        {/* Overlay buttons — 10% from bottom, right half only (avoid solar panel) */}
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "36%",
            right: "3%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <button
            onClick={() => navigate("/deposit")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              paddingLeft: 10,
              paddingRight: 13,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: 999,
              background: "#e53935",
              border: "2px solid rgba(255,255,255,0.45)",
              color: "white",
              fontWeight: 700,
              fontSize: 12,
              boxShadow: "0 3px 8px rgba(0,0,0,0.35)",
              cursor: "pointer",
            }}
            data-testid="button-hero-recharger"
          >
            <img src={iconRecharger} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
            Deposit
          </button>

          <button
            onClick={() => navigate("/withdrawal")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              paddingLeft: 10,
              paddingRight: 13,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: 999,
              background: "rgba(255,255,255,0.92)",
              border: "2px solid rgba(255,255,255,0.7)",
              color: "#3db51d",
              fontWeight: 700,
              fontSize: 12,
              boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
              cursor: "pointer",
            }}
            data-testid="button-hero-retrait"
          >
            <span style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#2a8d13",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <img src={iconRetrait} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
            </span>
            Withdraw
          </button>
        </div>
      </div>

      {/* Green Quick Actions Bar */}
      <div className="px-3 pt-3">
        <div
          className="rounded-2xl px-2 py-4 shadow-sm"
          style={{ background: "linear-gradient(135deg, #3db51d 0%, #2a8d13 100%)" }}
        >
          <div className="flex justify-around items-start">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center gap-1.5 flex-1"
                data-testid={`button-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                  style={{ background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.5)" }}
                >
                  <img
                    src={action.img}
                    alt={action.label}
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <span className="text-white text-[10px] font-semibold text-center leading-tight max-w-[52px]">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="px-3 mt-4 pb-24 space-y-3">
        {productsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#3db51d" }} />
          </div>
        ) : (
          paidProducts.map((product) => {
            const price = Number(product.price);
            const total = Number(product.totalReturn);
            const daily = Number(product.dailyEarnings);
            const taux = price > 0 ? Math.round((total / price) * 100) : 0;
            const imgSrc = productImages[product.id] || p1;
            return (
              <button
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="w-full text-left rounded-2xl overflow-hidden shadow-md"
                style={{ backgroundColor: "#1a1a2e" }}
                data-testid={`card-product-${product.id}`}
              >
                {/* Top row: image + info */}
                <div className="flex gap-3 p-3 pb-2">
                  <div className="w-[110px] h-[110px] rounded-xl overflow-hidden shrink-0">
                    <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <p className="text-white font-bold text-base">{product.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">cycles {product.cycleDays}</p>
                    </div>
                    <div>
                      <span className="text-cyan-400 text-xs font-semibold">Price </span>
                      <span className="font-extrabold text-base" style={{ color: "#f59e0b" }}>
                        {fmt(price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 12px" }} />

                {/* Stats row */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex-1">
                    <p className="text-gray-500 text-[10px] mb-0.5">Daily Income</p>
                    <p className="text-white font-bold text-sm">{fmt(daily)}</p>
                  </div>
                  <div className="w-px h-7" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div className="flex-1 text-center">
                    <p className="text-gray-500 text-[10px] mb-0.5">Total Earnings</p>
                    <p className="text-white font-bold text-sm">{fmt(total)}</p>
                  </div>
                  <div className="w-px h-7" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div className="flex-1 text-right">
                    <p className="text-gray-500 text-[10px] mb-0.5">Return Rate</p>
                    <p className="font-bold text-sm" style={{ color: "#3db51d" }}>{taux}%</p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Gift Code Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGiftModal(false); }}>
          <div className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl" style={{ background: "#3db51d" }}>
            {/* Close button */}
            <div className="flex justify-end px-4 pt-4">
              <button onClick={() => setShowGiftModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(0,0,0,0.15)" }} data-testid="button-close-gift">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Title */}
            <div className="px-6 pb-2 pt-1">
              <h2 className="text-white font-extrabold text-2xl italic leading-tight">
                Receive<br />Free Money
              </h2>
            </div>

            {/* Money bag emoji */}
            <div className="flex justify-center py-4">
              <span style={{ fontSize: 52 }}>💰</span>
            </div>

            {/* Input */}
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

            {/* Confirm button */}
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

            {/* Info section */}
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
                  Bonus codes are published on the official Telegram channel every day at 11:30 and 18:00. Follow our channel so you don't miss any!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
