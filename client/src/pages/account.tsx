import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCountryByCode } from "@/lib/countries";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { Loader2, Shield, ChevronRight, Copy, MessageCircleMore } from "lucide-react";
import { useState } from "react";
import ContactSheet from "@/components/contact-sheet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import jinkoLogo from "@assets/jinko-solar-logo-png_seeklogo-265492_1775671142176.png";
import jinkoLogoText from "@assets/JinkoSolarLOGO_1775671142017.png";
import iconDeposit from "@assets/20260410_193219_1775849744533.png";
import iconWithdraw from "@assets/20260410_192847_1775849812824.png";
import iconLogout from "@assets/20260410_193432_1775849812759.png";
import iconWallet from "@assets/20260410_193054_1775849844493.png";
import iconSecurite from "@assets/20260410_192649_1775849844694.png";

const GREEN = "#3db51d";
const GREEN_DARK = "#2a8d13";

const carbonCard: React.CSSProperties = {
  backgroundColor: "#161616",
  backgroundImage: `
    repeating-linear-gradient(
      45deg,
      rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px,
      transparent 1px, transparent 8px
    ),
    repeating-linear-gradient(
      -45deg,
      rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px,
      transparent 1px, transparent 8px
    )
  `,
  borderRadius: 20,
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  useEffect(() => { document.title = "Account | Noviqra Ai"; }, []);
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [showContactSheet, setShowContactSheet] = useState(false);

  const { data: products } = useQuery<any[]>({
    queryKey: ["/api/user-products"],
  });

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const res = await apiRequest("POST", "/api/admin/verify-pin", { pin });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Incorrect PIN code");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowPinModal(false);
      setAdminPin("");
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const handleAdminClick = () => {
    if (user?.isAdminPasswordRequired === false) {
      navigate("/admin");
      return;
    }
    setShowPinModal(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const copyCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast({ title: "Code copied!" });
    }
  };

  if (!user) return null;

  const balance = parseFloat(user.balance || "0");
  const todayEarnings = products?.reduce((sum: number, p: any) => sum + parseFloat(p.dailyIncome || "0"), 0) || 0;
  const country = getCountryByCode(user.country);
  const phonePrefix = country?.phonePrefix || "";
  const { fmt } = useUserCurrency();

  const menuItems = [
    { icon: iconWallet, label: "My Wallet", href: "/wallet" },
    { icon: iconDeposit, label: "Deposit History", href: "/deposit-orders" },
    { icon: iconWithdraw, label: "Withdrawal History", href: "/withdrawal-history" },
    { icon: iconSecurite, label: "Account Security", href: "/change-password" },
  ];

  return (
    <div className="flex flex-col min-h-full bg-gray-100">
      <ContactSheet open={showContactSheet} onClose={() => setShowContactSheet(false)} />
      <div className="flex-1 overflow-y-auto pb-24">

        <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm">
          <img src={jinkoLogoText} alt="Jinko Solar" className="h-10 w-auto object-contain" />
          <div className="flex items-center gap-2">
            {user.isAdmin && (
              <button onClick={handleAdminClick} className="p-1" data-testid="button-admin">
                <Shield className="w-6 h-6 text-gray-700" />
              </button>
            )}
            <button onClick={() => setShowContactSheet(true)} className="p-1" data-testid="button-service-account">
              <MessageCircleMore className="w-7 h-7 text-gray-700" />
            </button>
          </div>
        </div>

        <div
          className="px-4 pt-5 pb-10"
          style={{ background: `linear-gradient(to bottom, ${GREEN} 0%, ${GREEN} 55%, #f2f2f2 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)" }}
            >
              <img src={jinkoLogo} alt="" className="w-10 h-10 object-contain rounded-full" />
            </div>
            <div>
              <p className="text-white font-extrabold text-xl leading-tight" data-testid="text-phone">
                {phonePrefix}{user.phone}
              </p>
              <button onClick={copyCode} className="flex items-center gap-1.5 mt-0.5" data-testid="button-copy-code">
                <span className="text-white/70 text-xs">
                  Invitation code: <span className="text-white font-semibold">{user.referralCode}</span>
                </span>
                <Copy size={12} color="rgba(255,255,255,0.7)" />
              </button>
            </div>
          </div>
        </div>

        <div className="mx-3 mt-3">
          <div style={carbonCard} className="p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-semibold">Balance</span>
              <div className="flex gap-2">
                <Link href="/deposit">
                  <button
                    className="px-5 py-1.5 rounded-full text-white text-xs font-bold"
                    style={{ background: GREEN, boxShadow: `0 2px 8px rgba(61,181,29,0.4)` }}
                    data-testid="button-recharger"
                  >
                    Deposit
                  </button>
                </Link>
                <Link href="/withdrawal">
                  <button
                    className="px-5 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: "transparent", color: "white", border: "1.5px solid rgba(255,255,255,0.5)" }}
                    data-testid="button-retrait"
                  >
                    Withdraw
                  </button>
                </Link>
              </div>
            </div>

            <p className="text-3xl font-extrabold mb-4" style={{ color: GREEN }} data-testid="text-balance">
              {fmt(balance)}
            </p>

            <div className="flex justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <p className="text-gray-500 text-[10px] leading-tight mb-1">Today's<br />Earnings</p>
                <p className="text-white font-bold text-sm" data-testid="text-today-earnings">
                  {fmt(todayEarnings)}
                </p>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="text-center">
                <p className="text-gray-500 text-[10px] leading-tight mb-1">Yesterday's<br />Earnings</p>
                <p className="text-white font-bold text-sm">0</p>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="text-right">
                <p className="text-gray-500 text-[10px] leading-tight mb-1">Total<br />Income</p>
                <p className="text-white font-bold text-sm" data-testid="text-cumulative">
                  {fmt(balance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-3 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          {menuItems.map((item, idx) => {
            const inner = (
              <button
                className="w-full flex items-center px-4 py-3.5 text-left"
                style={{ borderBottom: idx < menuItems.length - 1 ? "1px solid #f0f0f0" : "none" }}
                data-testid={`button-menu-${idx}`}
                onClick={item.href === "" ? () => setShowContactSheet(true) : undefined}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mr-3 shrink-0" style={{ background: "#f5f5f5" }}>
                  <img src={item.icon} alt="" className="w-5 h-5 object-contain" />
                </div>
                <span className="flex-1 text-gray-800 font-medium text-sm">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            );
            return item.href ? (
              <Link href={item.href} key={item.label}>{inner}</Link>
            ) : (
              <div key={item.label}>{inner}</div>
            );
          })}
        </div>

        <div className="mx-3 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-3.5" data-testid="button-logout">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mr-3 shrink-0" style={{ background: "#f5f5f5" }}>
              <img src={iconLogout} alt="" className="w-5 h-5 object-contain" />
            </div>
            <span className="flex-1 text-gray-800 font-medium text-sm">Log Out</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        <div className="h-4" />
      </div>

      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Administrator Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Enter your PIN code to access the admin panel
            </p>
            <Input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="PIN Code"
              className="text-center text-2xl tracking-widest"
              maxLength={8}
              data-testid="input-admin-pin"
            />
            <Button
              onClick={() => {
                if (adminPin.length < 4) {
                  toast({ title: "PIN must be at least 4 characters", variant: "destructive" });
                  return;
                }
                verifyPinMutation.mutate(adminPin);
              }}
              disabled={verifyPinMutation.isPending || adminPin.length < 4}
              className="w-full"
              style={{ backgroundColor: GREEN }}
              data-testid="button-verify-pin"
            >
              {verifyPinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
