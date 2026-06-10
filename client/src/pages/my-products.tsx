import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Info, Loader2 } from "lucide-react";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { useLang } from "@/lib/i18n";
import { Link } from "wouter";

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

export default function MyProductsPage() {
  const { user } = useAuth();
  const { fmt } = useUserCurrency();
  const { lang } = useLang();
  useEffect(() => { document.title = "Mes Produits | EIFFAGE"; }, []);

  const { data: userProducts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
  });

  if (!user) return null;

  const allProducts = userProducts || [];
  const totalEarned = allProducts.reduce((sum: number, p: any) => sum + parseFloat(p.totalEarned || "0"), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#111111", display: "flex", flexDirection: "column" }}>

      {/* ── HERO ── */}
      <div style={{ position: "relative", height: 220 }}>
        <img src={heroImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)" }} />
        {/* back button */}
        <div style={{ position: "absolute", top: 44, left: 16 }}>
          <Link href="/invest">
            <button data-testid="button-back" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
              <ChevronLeft style={{ width: 26, height: 26, color: "white" }} />
            </button>
          </Link>
        </div>
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
          <div style={{ flex: 1, padding: "16px 10px", borderRight: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
            <p style={{ color: "white", fontWeight: 800, fontSize: 24, margin: 0 }}>{allProducts.length}</p>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0" }}>
              {lang === "fr" ? "Mes produits" : "My products"}
            </p>
          </div>
          <div style={{ flex: 1, padding: "16px 10px", textAlign: "center" }}>
            <p style={{ color: "white", fontWeight: 800, fontSize: 24, margin: 0 }}>{fmt(totalEarned)}</p>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0" }}>
              {lang === "fr" ? "Mes revenus" : "My revenues"}
            </p>
          </div>
        </div>
      </div>

      {/* ── INFO ROW ── */}
      <div style={{ margin: "12px 12px 0", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <Info style={{ width: 12, height: 12, color: "white" }} />
          </div>
          <p style={{ color: "white", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {lang === "fr"
              ? "Les revenus des produits sont réglés toutes les 24 heures"
              : "Product revenues are settled every 24 hours"}
          </p>
        </div>
        <p style={{ color: "#6b7280", fontSize: 12, margin: "0 0 0 28px" }}>
          {lang === "fr"
            ? "Vous pouvez acheter plusieurs appareils pour augmenter vos revenus"
            : "You can purchase multiple products to increase your earnings"}
        </p>
      </div>

      {/* ── PRODUCT LIST ── */}
      <div style={{ flex: 1, padding: "16px 12px 60px", display: "flex", flexDirection: "column", gap: 10 }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Loader2 style={{ width: 28, height: 28, color: "#f59e0b" }} className="animate-spin" />
          </div>
        ) : allProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280", fontSize: 14 }}>
            {lang === "fr" ? "Aucun produit acheté" : "No products purchased yet"}
          </div>
        ) : (
          allProducts.map((up: any, idx: number) => {
            const carImg = CAR_IMAGES[idx % CAR_IMAGES.length];
            const cycleDays   = up.product?.cycleDays   || 80;
            const daysRem     = up.daysRemaining         || 0;
            const daysComp    = Math.max(0, cycleDays - daysRem);
            const dailyEarn   = up.product?.dailyEarnings || 0;
            const price       = up.product?.price         || 0;
            const totalRev    = cycleDays * dailyEarn;
            const earnedSoFar = parseFloat(up.totalEarned || "0");
            const progress    = cycleDays > 0 ? Math.min(100, (daysComp / cycleDays) * 100) : 0;

            return (
              <div
                key={up.id}
                data-testid={`product-card-${up.id}`}
                style={{ background: "#1a1a1a", borderRadius: 14, overflow: "hidden", padding: "14px" }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  {/* Car image */}
                  <img src={carImg} alt={up.product?.name} style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>
                      {up.product?.name || "Product"}
                    </p>
                    {[
                      [lang === "fr" ? "Prix" : "Price",                fmt(price)],
                      [lang === "fr" ? "Revenu quotidien" : "Daily",    fmt(dailyEarn)],
                      [lang === "fr" ? "Revenu total" : "Total return", fmt(totalRev)],
                      [lang === "fr" ? "Gagné" : "Earned",              fmt(earnedSoFar)],
                    ].map(([label, val]) => (
                      <p key={label} style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>
                        {label} : <span style={{ color: "#d1d5db" }}>{val}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#9ca3af", fontSize: 11 }}>{lang === "fr" ? "Durée" : "Duration"}</span>
                    <span style={{ color: "#d1d5db", fontSize: 11 }}>{daysComp}/{cycleDays} {lang === "fr" ? "jours" : "days"}</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "#f59e0b", borderRadius: 99, transition: "width 0.3s" }} />
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
