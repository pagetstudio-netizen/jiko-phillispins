import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import ContactSheet from "@/components/contact-sheet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/countries";
import { Loader2, AlertTriangle, Settings } from "lucide-react";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";

import jinkoLogoFull from "@assets/20260311_220915_1773268242686.png";
import serviceIcon from "@assets/20260311_214852_1773265973964.png";
import productHeroImg from "@assets/jinko-solar-logo-png_seeklogo-265492_1775671142176.png";

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  canClaimFree: boolean;
  ownedCount?: number;
}

export default function InvestPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  useEffect(() => { document.title = "Invest | Jinko Solar"; }, []);
  const [confirmProduct, setConfirmProduct] = useState<ProductWithOwnership | null>(null);
  const [showContactSheet, setShowContactSheet] = useState(false);

  const { data: products, isLoading } = useQuery<ProductWithOwnership[]>({
    queryKey: ["/api/products"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("POST", `/api/products/${productId}/purchase`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      refreshUser();
      setConfirmProduct(null);
      toast({ title: "Product purchased!", description: "You will start receiving earnings tomorrow." });
    },
    onError: (error: any) => {
      setConfirmProduct(null);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const balance = parseFloat(user.balance || "0");

  const handleBuyClick = (product: ProductWithOwnership) => {
    setConfirmProduct(product);
  };

  const confirmPurchase = () => {
    if (confirmProduct) {
      purchaseMutation.mutate(confirmProduct.id);
    }
  };

  const paidProducts = products?.filter(p => !p.isFree) || [];

  return (
    <div className="flex flex-col min-h-full bg-gray-100">
      <ContactSheet open={showContactSheet} onClose={() => setShowContactSheet(false)} />
      <div className="flex items-center justify-between px-4 py-3 shadow-sm" style={{ background: "linear-gradient(135deg, #3db51d 0%, #2a8d13 100%)" }}>
        <img src={jinkoLogoFull} alt="Jinko Solar" className="h-9 w-auto object-contain" data-testid="img-jinko-logo" />
        <button
          onClick={() => setShowContactSheet(true)}
          className="flex items-center justify-center"
          data-testid="button-service"
        >
          <img src={serviceIcon} alt="Customer Service" className="w-8 h-8 object-contain" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-3 pt-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : paidProducts.length > 0 ? (
          <div className="space-y-5">
            {paidProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
                data-testid={`product-card-${product.id}`}
              >
                <div className="px-4 pt-3 pb-5">
                  <h3 className="font-bold text-gray-900 text-base" data-testid={`text-product-name-${product.id}`}>
                    {product.name}
                  </h3>
                </div>

                <div className="mx-3 rounded-2xl relative" style={{ background: "#E28075", paddingTop: "126px", marginBottom: "0" }}>
                  <div
                    className="absolute overflow-hidden rounded-xl"
                    style={{ top: "-14px", height: "132px", left: "8px", right: "8px" }}
                  >
                    <img
                      src={productHeroImg}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="px-4 pb-4 pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/90">Cycle (Days)</span>
                      <span className="text-sm font-bold text-white">{product.cycleDays}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/90">Daily Income (₱)</span>
                      <span className="text-sm font-bold text-white">{product.dailyEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/90">Total Return (₱)</span>
                      <span className="text-sm font-bold text-white">
                        {product.price.toLocaleString()}+{product.totalReturn.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="text-xs text-gray-400">Price (₱)</span>
                    <p className="text-base font-bold text-orange-500">{product.price.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleBuyClick(product)}
                    className="px-7 py-2.5 rounded-full text-sm font-bold text-white shadow-md"
                    style={{ background: "#3db51d" }}
                    data-testid={`button-purchase-${product.id}`}
                  >
                    Invest
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">No products available</p>
          </div>
        )}
      </div>

      {confirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/50" onClick={() => setConfirmProduct(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

            <div className="pt-6 pb-2 text-center">
              <h3 className="text-xl font-bold text-gray-900">{confirmProduct.name}</h3>
            </div>

            <div className="flex justify-center px-6 py-3">
              <img
                src={productHeroImg}
                alt={confirmProduct.name}
                className="w-36 h-28 object-cover rounded-2xl"
              />
            </div>

            <p className="text-center text-sm text-gray-500 px-6 pb-3">
              Settlement income every 24 hours
            </p>

            <div className="px-6 pb-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">Price:</span>
                <span className="text-[#3db51d] font-bold text-sm">₱{confirmProduct.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">Daily Income:</span>
                <span className="text-[#3db51d] font-bold text-sm">₱{confirmProduct.dailyEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">Total Return:</span>
                <span className="text-[#3db51d] font-bold text-sm">₱{confirmProduct.totalReturn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">Duration:</span>
                <span className="text-gray-900 font-bold text-sm">{confirmProduct.cycleDays} days</span>
              </div>

              {balance < confirmProduct.price && (
                <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-red-200 rounded-xl mt-1">
                  <AlertTriangle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <p className="text-xs text-green-500">
                    Insufficient balance. You need {formatCurrency(confirmProduct.price - balance, user.country)}.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-5">
              <button
                onClick={() => setConfirmProduct(null)}
                className="flex-1 py-3 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm"
                data-testid="button-cancel-purchase"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                disabled={purchaseMutation.isPending || balance < confirmProduct.price}
                className="flex-1 py-3 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #3db51d, #2a8d13)" }}
                data-testid="button-confirm-purchase"
              >
                {purchaseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
