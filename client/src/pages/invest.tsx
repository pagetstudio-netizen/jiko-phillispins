import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { useLang } from "@/lib/i18n";
import type { Product } from "@shared/schema";

import heroImg from "@assets/file_000000008ed8720a9a149bc45896943c_1779479835731.png";
import r1 from "@assets/ROBOTIQUE-ET-IA_1779479959842.jpg";
import r2 from "@assets/Liberer-le-potentiel-de-lintelligence-artificielle-dans-la-rob_1779479959906.png";
import r3 from "@assets/robot-humanoide_1779479959935.jpg";
import r4 from "@assets/roboter-pyhsikalische-ki-Xpert.Digital-png_1779479959968.png";
import r5 from "@assets/images_(30)_1779479959995.jpeg";
import r6 from "@assets/photo-1737644467636-6b0053476bb2_1779479960022.jpeg";
import r7 from "@assets/images_(29)_1779479856301.jpeg";
import r8 from "@assets/Liberer-le-potentiel-de-lintelligence-artificielle-dans-la-rob_1779479856196.png";

const CAR_IMAGES = [r1, r2, r3, r4, r5, r6, r7, r8];

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  canClaimFree: boolean;
  ownedCount?: number;
}

const VIP_NAMES = [
  "Nano AI Robot",
  "Smart AI Robot",
  "Pro AI Robot",
  "Elite AI Robot",
  "Premium AI Robot",
  "Expert AI Robot",
  "Master AI Robot",
  "Ultra AI Robot",
];

export default function InvestPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { fmt } = useUserCurrency();
  const { lang } = useLang();
  useEffect(() => { document.title = "Produit | Noviqra Ai"; }, []);
  const [confirmProduct, setConfirmProduct] = useState<ProductWithOwnership | null>(null);

  const { data: products, isLoading } = useQuery<ProductWithOwnership[]>({
    queryKey: ["/api/products"],
  });

  const { data: userProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("POST", `/api/products/${productId}/purchase`, {});
      if (!response.ok) { const data = await response.json(); throw new Error(data.message || "Error"); }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      refreshUser();
      setConfirmProduct(null);
      toast({ title: lang === "fr" ? "Produit acheté !" : "Product purchased!", description: lang === "fr" ? "Vos revenus commenceront demain." : "You will start receiving earnings tomorrow." });
    },
    onError: (error: any) => {
      setConfirmProduct(null);
      toast({ title: lang === "fr" ? "Erreur" : "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const balance = parseFloat(user.balance || "0");
  const totalEarnings = parseFloat((user as any).totalEarnings || "0");
  const myProductCount = userProducts.length;

  const paidProducts = products?.filter(p => !p.isFree) || [];

  const confirmPurchase = () => {
    if (confirmProduct) purchaseMutation.mutate(confirmProduct.id);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111111", paddingBottom: 80 }}>

      {/* ── HERO ── */}
      <div style={{ position: "relative", height: 180 }}>
        <img src={heroImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 100%)" }} />
      </div>

      {/* ── STATS CARD ── */}
      <div style={{ margin: "0 12px", marginTop: -1 }}>
        <div style={{
          background: "#0d0d0d",
          border: "1.5px solid #f59e0b",
          borderRadius: 12,
          display: "flex",
          overflow: "hidden",
        }}>
          {/* Left: My products */}
          <button
            onClick={() => navigate("/my-products")}
            data-testid="button-my-products"
            style={{ flex: 1, padding: "14px 10px", background: "transparent", border: "none", borderRight: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", textAlign: "center" }}
          >
            <p style={{ color: "white", fontWeight: 800, fontSize: 22, margin: 0 }}>{myProductCount}</p>
            <p style={{ color: "#9ca3af", fontSize: 12, margin: "4px 0 0" }}>
              {lang === "fr" ? "Mes produits ›" : "My products ›"}
            </p>
          </button>
          {/* Right: Total revenue */}
          <button
            onClick={() => navigate("/my-products")}
            data-testid="button-total-revenue"
            style={{ flex: 1, padding: "14px 10px", background: "transparent", border: "none", cursor: "pointer", textAlign: "center" }}
          >
            <p style={{ color: "white", fontWeight: 800, fontSize: 22, margin: 0 }}>{fmt(totalEarnings)}</p>
            <p style={{ color: "#9ca3af", fontSize: 12, margin: "4px 0 0" }}>
              {lang === "fr" ? "Revenu total ›" : "Total revenue ›"}
            </p>
          </button>
        </div>
      </div>

      {/* ── PRODUCT LIST ── */}
      <div style={{ padding: "12px 0 0" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Loader2 style={{ width: 32, height: 32, color: "#f59e0b" }} className="animate-spin" />
          </div>
        ) : paidProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
            <Settings style={{ width: 40, height: 40, margin: "0 auto 12px" }} />
            <p>{lang === "fr" ? "Aucun produit disponible" : "No products available"}</p>
          </div>
        ) : (
          paidProducts.map((product, idx) => {
            const carImg = CAR_IMAGES[idx % CAR_IMAGES.length];
            const vipName = VIP_NAMES[idx] || product.name;
            return (
              <div key={product.id} data-testid={`product-card-${product.id}`}>
                <div style={{ padding: "14px 12px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {/* Car thumbnail */}
                  <img
                    src={carImg}
                    alt={vipName}
                    style={{ width: 110, height: 80, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                  />
                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>{vipName}</p>
                      <button
                        onClick={() => setConfirmProduct(product)}
                        data-testid={`button-purchase-${product.id}`}
                        style={{
                          background: "white",
                          color: "#111111",
                          border: "none",
                          borderRadius: 6,
                          padding: "5px 14px",
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: "pointer",
                          letterSpacing: 0.5,
                          flexShrink: 0,
                        }}
                      >
                        {lang === "fr" ? "ACHETER" : "BUY"}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {[
                        [lang === "fr" ? "Prix" : "Price",              fmt(product.price)],
                        [lang === "fr" ? "Jours de revenu" : "Revenue days", `${product.cycleDays}`],
                        [lang === "fr" ? "Revenu quotidien" : "Daily revenue", fmt(product.dailyEarnings)],
                        [lang === "fr" ? "Revenu total" : "Total revenue", fmt(product.totalReturn)],
                      ].map(([label, value]) => (
                        <p key={label} style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>
                          {label} : <span style={{ color: "#d1d5db" }}>{value}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 12px" }} />
              </div>
            );
          })
        )}
      </div>

      {/* ── CONFIRM MODAL ── */}
      {confirmProduct && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", background: "rgba(0,0,0,0.75)" }}
          onClick={() => setConfirmProduct(null)}
        >
          <div
            style={{ background: "#1a1a1a", borderRadius: 20, width: "100%", maxWidth: 360, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "20px 20px 10px", textAlign: "center" }}>
              <p style={{ color: "white", fontWeight: 800, fontSize: 16, margin: 0 }}>
                {VIP_NAMES[paidProducts.findIndex(p => p.id === confirmProduct.id)] || confirmProduct.name}
              </p>
            </div>
            <div style={{ padding: "0 20px 8px", textAlign: "center" }}>
              <img
                src={CAR_IMAGES[paidProducts.findIndex(p => p.id === confirmProduct.id) % CAR_IMAGES.length]}
                alt={confirmProduct.name}
                style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 12 }}
              />
            </div>
            <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "4px 20px 10px", margin: 0 }}>
              {lang === "fr" ? "Revenus réglés toutes les 24h" : "Settlement income every 24 hours"}
            </p>
            <div style={{ padding: "0 20px 4px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                [lang === "fr" ? "Prix" : "Price",              fmt(confirmProduct.price)],
                [lang === "fr" ? "Revenu quotidien" : "Daily Income", fmt(confirmProduct.dailyEarnings)],
                [lang === "fr" ? "Revenu total" : "Total Return", fmt(confirmProduct.totalReturn)],
                [lang === "fr" ? "Durée" : "Duration",           `${confirmProduct.cycleDays} ${lang === "fr" ? "jours" : "days"}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#9ca3af", fontSize: 13 }}>{label} :</span>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{value}</span>
                </div>
              ))}
              {balance < confirmProduct.price && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "8px 10px", marginTop: 4 }}>
                  <AlertTriangle style={{ width: 16, height: 16, color: "#ef4444", flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>
                    {lang === "fr" ? "Solde insuffisant." : "Insufficient balance."}
                  </p>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, padding: "16px 20px 20px" }}>
              <button
                onClick={() => setConfirmProduct(null)}
                data-testid="button-cancel-purchase"
                style={{ flex: 1, height: 46, borderRadius: 999, background: "rgba(255,255,255,0.08)", color: "white", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}
              >
                {lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button
                onClick={confirmPurchase}
                disabled={purchaseMutation.isPending || balance < confirmProduct.price}
                data-testid="button-confirm-purchase"
                style={{ flex: 1, height: 46, borderRadius: 999, background: "#f59e0b", color: "#111111", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", opacity: (purchaseMutation.isPending || balance < confirmProduct.price) ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                {purchaseMutation.isPending && <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />}
                {lang === "fr" ? "Confirmer" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
