import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, X, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Product } from "@shared/schema";

import r1 from "@assets/IMG_20260610_064536_722_1781279350174.jpg";
import r2 from "@assets/IMG_20260610_064537_476_1781279350278.jpg";
import r3 from "@assets/IMG_20260610_064532_360_1781279350322.jpg";
import r4 from "@assets/IMG_20260610_064531_480_1781279350346.jpg";
import r5 from "@assets/IMG_20260610_064537_345_1781279350369.jpg";
import r6 from "@assets/IMG_20260610_064537_635_1781279350395.jpg";

const ROBOT_IMAGES = [r1, r2, r3, r4, r5, r6];
const defaultImg = r1;

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  canClaimFree: boolean;
  ownedCount?: number;
}

const descriptions: Record<string, string> = {
  "Nano AI Robot": "Le Nano AI Robot d'EIFFAGE est l'investissement idéal pour débuter votre parcours d'automatisation IA. Il génère des gains quotidiens stables grâce à notre technologie robotique intelligente.",
  "Smart AI Robot": "Le Smart AI Robot offre une puissance de traitement améliorée et des rendements plus élevés. Idéal pour les investisseurs souhaitant accroître leurs gains quotidiens grâce à l'automatisation de pointe.",
  "Pro AI Robot": "Le Pro AI Robot est une unité haute performance qui maximise la productivité pilotée par l'IA. Avec un excellent taux de rendement, il représente un choix stratégique pour votre portefeuille.",
  "Elite AI Robot": "L'Elite AI Robot est conçu pour les investisseurs ambitieux. Son IA avancée garantit des performances optimales et des revenus quotidiens attractifs tout au long du cycle complet.",
  "Premium AI Robot": "Le Premium AI Robot allie performance et rentabilité. Profitez de revenus quotidiens élevés et d'un retour total exceptionnel sur votre investissement en automatisation.",
  "Expert AI Robot": "L'Expert AI Robot est réservé aux investisseurs expérimentés recherchant des rendements maximaux. La technologie de pointe d'EIFFAGE garantit des gains quotidiens constants et des bénéfices substantiels.",
  "Master AI Robot": "Le Master AI Robot représente l'excellence en matière d'investissement dans l'automatisation IA. Profitez de revenus quotidiens très élevés et d'un cycle d'investissement optimisé.",
  "Ultra AI Robot": "L'Ultra AI Robot est notre produit phare pour les grands investisseurs. La technologie IA de dernière génération offre des rendements exceptionnels pour une expérience d'investissement unique.",
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
  const imgSrc = product.sortOrder > 0 ? (ROBOT_IMAGES[(product.sortOrder - 1) % ROBOT_IMAGES.length] || defaultImg) : defaultImg;
  const desc = descriptions[product.name] || `${product.name} est un produit d'investissement EIFFAGE offrant des rendements quotidiens attractifs et un excellent retour sur investissement.`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f0f1a" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button onClick={() => navigate("/")} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} data-testid="button-back">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="flex-1 text-center text-white font-bold text-base pr-9">Détails du Produit</h1>
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
