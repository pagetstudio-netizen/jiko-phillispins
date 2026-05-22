import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, X, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Product } from "@shared/schema";

import p1 from "@assets/panneaux-solaires-3d-realiste_625553-173_1775768333512.jpg";
import p2 from "@assets/images_(33)_1775768333811.jpeg";
import p3 from "@assets/panneau-solaire-detoure-min_1775768333844.png";
import p4 from "@assets/panneau-solaire-hybride_1775768333929.jpg";
import p5 from "@assets/images_(30)_1775768333959.jpeg";
import p6 from "@assets/images_(29)_1775768333985.jpeg";
import p7 from "@assets/images_(28)_1775768334009.jpeg";
import p8 from "@assets/images_(26)_1775768334029.jpeg";
import p9 from "@assets/images_(29)_1779479856301.jpeg";

const productImages: Record<number, string> = { 2: p1, 3: p2, 4: p3, 5: p4, 6: p5, 7: p6, 8: p7, 9: p8, 10: p9 };
const defaultImg = p1;

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  canClaimFree: boolean;
  ownedCount?: number;
}

const descriptions: Record<string, string> = {
  "Mini Solar Panel": "The Mini Solar Panel by Noviqra Ai is the perfect entry-level investment to start your AI-powered investment journey. This product generates stable daily earnings and provides reliable passive income. Invest now and benefit from our smart technology.",
  "Basic Solar Kit": "The Basic Solar Kit offers increased power and higher returns. Ideal for investors who want to optimize their daily earnings while contributing to the energy transition.",
  "Solar Panel 100W": "The Solar Panel 100W is a high-performance panel that maximizes solar energy production. With an excellent return on investment rate, it represents a strategic choice for your portfolio.",
  "Solar Panel 200W": "The Solar Panel 200W is designed for ambitious investors. Its advanced technology guarantees optimal energy production and attractive daily income throughout the full cycle.",
  "Home Solar System": "The Home Solar System combines performance and profitability. With this premium product, enjoy a high daily income and an exceptional total return on your solar investment.",
  "Mini Solar Plant": "The Mini Solar Plant is reserved for experienced investors seeking maximum returns. Noviqra Ai's cutting-edge technology ensures constant daily earnings and substantial gains.",
  "Advanced Solar Station": "The Advanced Solar Station represents excellence in solar investment. Enjoy very high daily income and an optimized investment cycle to maximize your profits.",
  "Industrial Solar Plant": "The Industrial Solar Plant is our flagship product for large investors. It combines state-of-the-art technology and exceptional returns for a unique and highly profitable solar investment experience.",
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { fmt, symbol } = useUserCurrency();
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: products } = useQuery<ProductWithOwnership[]>({
    queryKey: ["/api/products"],
  });

  const product = products?.find(p => p.id === Number(id));

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/products/${product!.id}/purchase`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-products"] });
      refreshUser();
      setShowConfirm(false);
      toast({ title: "Product purchased!", description: "You will start receiving earnings tomorrow." });
      navigate("/");
    },
    onError: (error: any) => {
      setShowConfirm(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!user || !product) return null;

  const price = Number(product.price);
  const totalReturn = Number(product.totalReturn);
  const dailyEarnings = Number(product.dailyEarnings);
  const returnRate = price > 0 ? Math.round((totalReturn / price) * 100) : 0;
  const imgSrc = productImages[product.id] || defaultImg;
  const desc = descriptions[product.name] || `${product.name} is a Noviqra Ai investment product offering attractive daily returns and an excellent return on investment.`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f0f1a" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button onClick={() => navigate("/")} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} data-testid="button-back">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="flex-1 text-center text-white font-bold text-base pr-9">Product Details</h1>
      </div>

      {/* Product image */}
      <div className="w-full" style={{ height: 220 }}>
        <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
      </div>

      {/* Product info */}
      <div className="px-4 pt-4">
        <h2 className="text-white font-extrabold text-2xl mb-1">{product.name}</h2>
        <p className="font-bold text-xl mb-4" style={{ color: "#f59e0b" }}>
          {fmt(price)}
        </p>

        {/* Daily + Total */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Daily Income:</span>
            <span className="font-bold" style={{ color: "#f59e0b" }}>
              {fmt(dailyEarnings)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Total Earnings:</span>
            <span className="font-bold" style={{ color: "#f59e0b" }}>
              {fmt(totalReturn)}
            </span>
          </div>
        </div>

        {/* 3-stat bar */}
        <div className="flex items-center justify-between py-3 mb-5 rounded-xl" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex-1 text-center">
            <p className="text-gray-500 text-[11px] mb-1">Return Rate</p>
            <p className="font-bold text-sm" style={{ color: "#3db51d" }}>{returnRate}%</p>
          </div>
          <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
          <div className="flex-1 text-center">
            <p className="text-gray-500 text-[11px] mb-1">Duration</p>
            <p className="text-white font-bold text-sm">{product.cycleDays} Days</p>
          </div>
          <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
          <div className="flex-1 text-center">
            <p className="text-gray-500 text-[11px] mb-1">Purchase Limit</p>
            <p className="text-white font-bold text-sm">1</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => navigate("/deposit")}
            className="flex-1 py-3.5 rounded-full text-white font-bold text-sm"
            style={{ background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)" }}
            data-testid="button-recharger"
          >
            Top Up Account
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex-1 py-3.5 rounded-full text-white font-bold text-sm"
            style={{ background: "linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)" }}
            data-testid="button-acheter"
          >
            Buy Product
          </button>
        </div>

        {/* Description */}
        <div className="pb-10">
          <h3 className="text-white font-bold text-base text-center mb-3">Product Description</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
        </div>
      </div>

      {/* Confirmation popup */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="mx-6 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3" style={{ background: "linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)" }}>
              <span className="text-white font-bold text-base">Confirmation</span>
              <button onClick={() => setShowConfirm(false)} data-testid="button-close-confirm">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="bg-white px-6 py-5">
              <p className="text-gray-800 font-semibold text-center text-sm mb-5">
                Are you sure you want to purchase this product?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-full font-bold text-sm"
                  style={{ background: "#f3f4f6", color: "#6b7280" }}
                  data-testid="button-annuler"
                >
                  Cancel
                </button>
                <button
                  onClick={() => purchaseMutation.mutate()}
                  disabled={purchaseMutation.isPending}
                  className="flex-1 py-3 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)" }}
                  data-testid="button-confirmer"
                >
                  {purchaseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
