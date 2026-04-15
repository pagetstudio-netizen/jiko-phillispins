import { useAuth } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

import fallbackImg from "@assets/jinko-solar-logo-png_seeklogo-265492_1775671142176.png";
import p1 from "@assets/panneaux-solaires-3d-realiste_625553-173_1775768333512.jpg";
import p2 from "@assets/images_(33)_1775768333811.jpeg";
import p3 from "@assets/panneau-solaire-detoure-min_1775768333844.png";
import p4 from "@assets/panneau-solaire-hybride_1775768333929.jpg";
import p5 from "@assets/images_(30)_1775768333959.jpeg";
import p6 from "@assets/images_(29)_1775768333985.jpeg";
import p7 from "@assets/images_(28)_1775768334009.jpeg";
import p8 from "@assets/images_(26)_1775768334029.jpeg";
import p9 from "@assets/Jinko-solar-panel-535-555W-p-type-1_1775768334052.jpg";

const productImages: Record<number, string> = {
  2: p1, 3: p2, 4: p3, 5: p4, 6: p5, 7: p6, 8: p7, 9: p8, 10: p9,
};

const GREEN = "#3db51d";
const GREEN_DARK = "#2a8d13";

export default function MyProductsPage() {
  const { user } = useAuth();

  const { data: userProducts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
  });

  if (!user) return null;

  const allProducts = userProducts || [];

  const totalEarned = allProducts.reduce((sum: number, p: any) => {
    return sum + parseFloat(p.totalEarned || "0");
  }, 0);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-100">
      <div className="flex-1 overflow-y-auto pb-24">

        <div className="relative pt-10 pb-8 px-4 text-center" style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DARK} 100%)` }}>
          <div className="absolute top-3 left-3">
            <Link href="/account">
              <button className="p-1.5 bg-white/20 rounded-full" data-testid="button-back">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
          </div>
          <p className="text-white text-4xl font-black tracking-tight">
            ₱{totalEarned.toLocaleString()}
          </p>
          <p className="text-white/80 text-sm mt-1">Total Earnings</p>
        </div>

        <div className="bg-white border-b border-gray-100 px-4 py-3 text-center">
          <p className="text-gray-500 text-xs">
            ℹ️ Product earnings are settled every 24 hours
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            You can purchase multiple products to increase your earnings
          </p>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: GREEN }} />
            </div>
          ) : allProducts.length === 0 ? (
            <EmptyState message="No products yet" />
          ) : (
            allProducts.map((up: any) => {
              const productId = up.product?.id;
              const imgSrc = productImages[productId] || fallbackImg;
              const cycleDays = up.product?.cycleDays || 60;
              const daysRemaining = up.daysRemaining || 0;
              const daysCompleted = Math.max(0, cycleDays - daysRemaining);
              const dailyEarnings = up.product?.dailyEarnings || 0;
              const price = up.product?.price || 0;
              const totalRevenue = cycleDays * dailyEarnings;
              const earnedSoFar = parseFloat(up.totalEarned || "0");

              return (
                <div
                  key={up.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                  data-testid={`product-card-${up.id}`}
                >
                  <p className="text-center text-gray-900 font-bold text-base pt-4 pb-2 px-4">
                    {up.product?.name || "Product"}
                  </p>

                  <div className="flex items-start gap-4 px-4 pb-3">
                    <img
                      src={imgSrc}
                      alt={up.product?.name || "Product"}
                      className="rounded-xl object-cover shrink-0"
                      style={{ width: 90, height: 90 }}
                    />

                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Price:</span>
                        <span className="font-semibold text-sm" style={{ color: GREEN }}>
                          ₱{Number(price).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Daily Income:</span>
                        <span className="font-semibold text-sm" style={{ color: GREEN }}>
                          ₱{Number(dailyEarnings).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Total Earnings:</span>
                        <span className="font-semibold text-sm" style={{ color: GREEN }}>
                          ₱{Number(totalRevenue).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Earned so far:</span>
                        <span className="font-semibold text-sm" style={{ color: GREEN }}>
                          ₱{earnedSoFar.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Purchased on:</span>
                        <span className="font-semibold text-xs" style={{ color: GREEN }}>
                          {formatDateTime(up.purchasedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <div
                      className="w-full py-2.5 rounded-full text-center text-white text-sm font-bold"
                      style={{ background: `linear-gradient(90deg, ${GREEN} 0%, ${GREEN_DARK} 100%)` }}
                    >
                      Duration: {daysCompleted}/{cycleDays}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
