import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCountryByCode } from "@/lib/countries";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { Loader2, Shield, LogOut } from "lucide-react";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";

import nioAvatar   from "@assets/IMG-20260522-WA0031_1779519908758.jpg";
import iconRecharge  from "@assets/recharge-icon-BZHWSjQZ_1779464171620.png";
import iconRetirer   from "@assets/withdraw-icon-DFsum39V_(1)_1779464171531.png";
import iconRecords   from "@assets/mine-mod-records-DgHXSKa1_1779464171459.png";
import iconAbout     from "@assets/mine-mod-aboutus-xnaBhqOq_1779464171597.png";
import iconRegle     from "@assets/téléchargement_(72)_1779464171437.png";
import iconSupport   from "@assets/téléchargement_(67)_1779464171480.png";
import iconDownload  from "@assets/mine-mod-download-B1teb57W_1779464171645.png";
import iconBankcard  from "@assets/mine-mod-bankcard-CLOhqwHj_1779464171572.png";
import iconPassword  from "@assets/mine-mod-change-pwd-D4tL_Aft_1779464171551.png";
import iconGift      from "@assets/téléchargement_(66)_1779464171508.png";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const fr = lang === "fr";
  useEffect(() => { document.title = "Account | Noviqra Ai"; }, []);

  const [showPinModal, setShowPinModal]     = useState(false);
  const [adminPin, setAdminPin]             = useState("");

  const { data: products } = useQuery<any[]>({ queryKey: ["/api/user-products"] });

  const { data: appLinks } = useQuery<{ appDownloadLink: string }>({
    queryKey: ["/api/settings/links"],
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
    onSuccess: () => { setShowPinModal(false); setAdminPin(""); navigate("/admin"); },
    onError: (error: Error) => { toast({ title: error.message, variant: "destructive" }); },
  });

  const handleAdminClick = () => {
    if (user?.isAdminPasswordRequired === false) { navigate("/admin"); return; }
    setShowPinModal(true);
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };

  if (!user) return null;

  const balance      = parseFloat(user.balance || "0");
  const totalEarnings = products?.reduce((sum: number, p: any) => sum + parseFloat(p.totalEarned || "0"), 0) || 0;
  const country      = getCountryByCode(user.country);
  const phonePrefix  = country?.phonePrefix || "";
  const { fmt }      = useUserCurrency();

  const level = (products?.length || 0) === 0 ? "LV0" : `LV${Math.min(products!.length, 9)}`;

  const quickActions = [
    { icon: iconRecharge, label: fr ? "Recharger" : "Deposit",  href: "/deposit" },
    { icon: iconRetirer,  label: fr ? "Retirer"   : "Withdraw", href: "/withdrawal" },
    { icon: iconRecords,  label: fr ? "Historique": "History",  href: "/deposit-orders" },
  ];

  const gridMenu = [
    { icon: iconAbout,    label: fr ? "À propos"              : "About",           action: () => navigate("/about") },
    { icon: iconRegle,    label: fr ? "Réglementation"        : "Rules",           action: () => navigate("/rules") },
    { icon: iconRecords,  label: fr ? "Historique"            : "History",         action: () => navigate("/deposit-orders") },
    { icon: iconSupport,  label: fr ? "Service client"        : "Support",         action: () => navigate("/service") },
    { icon: iconDownload, label: fr ? "Télécharger l'app"     : "Download app",    action: () => { const link = appLinks?.appDownloadLink; if (link) window.open(link, "_blank"); else toast({ title: fr ? "Lien non configuré" : "Link not configured yet", variant: "destructive" }); } },
    { icon: iconBankcard, label: fr ? "Lier une carte bancaire": "Bank card",      action: () => navigate("/wallet") },
    { icon: iconPassword, label: fr ? "Changer le mot de passe": "Change password",action: () => navigate("/change-password") },
    { icon: iconGift,     label: "GIFT",                                            action: () => navigate("/gift-code") },
  ];

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#111111" }}>

      <div className="flex-1 overflow-y-auto pb-24">

        {/* ── HERO HEADER ── */}
        <div
          className="relative px-4 pt-10 pb-8"
          style={{
            background: "linear-gradient(160deg, #1c1c1c 0%, #2a2a2a 40%, #1a1a1a 100%)",
            backgroundImage: `
              linear-gradient(160deg, #1c1c1c 0%, #2a2a2a 40%, #1a1a1a 100%),
              repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 10px),
              repeating-linear-gradient(-45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 10px)
            `,
          }}
        >
          {/* Admin button */}
          {user.isAdmin && (
            <button
              onClick={handleAdminClick}
              className="absolute top-4 left-4 p-1.5 rounded-full"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)" }}
              data-testid="button-admin"
            >
              <Shield className="w-4 h-4" style={{ color: "#f59e0b" }} />
            </button>
          )}

          {/* Avatar */}
          <div className="absolute top-8 right-4">
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: "#fff", border: "2px solid rgba(255,255,255,0.4)" }}
            >
              <img src={nioAvatar} alt="Noviqra AI" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Greeting */}
          <div className="mt-2 pr-20">
            <p className="text-white font-black text-3xl leading-tight">{fr ? "Bonjour," : "Hello,"}</p>
            <p className="text-gray-300 text-base font-medium mt-0.5" data-testid="text-phone">
              {phonePrefix} {user.phone}
            </p>
            <div
              className="mt-3 inline-flex px-4 py-0.5 rounded-full"
              style={{ border: "1.5px solid rgba(255,255,255,0.6)" }}
            >
              <span className="text-white text-sm font-bold">{level}</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-start justify-around mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {quickActions.map((a) => (
              <Link href={a.href} key={a.label}>
                <button className="flex flex-col items-center gap-2" data-testid={`button-quick-${a.label}`}>
                  <img src={a.icon} alt={a.label} className="w-9 h-9 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
                  <span className="text-white text-xs font-medium">{a.label}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* ── BALANCE CARDS ── */}
        <div className="flex gap-3 px-3 mt-4">
          <div
            className="flex-1 rounded-2xl p-4 flex flex-col gap-1"
            style={{ background: "#1a1a1a", border: "1.5px solid #f59e0b" }}
          >
            <p className="text-white font-extrabold text-xl leading-tight" data-testid="text-balance">
              {fmt(balance)}
            </p>
            <p className="text-gray-400 text-sm">{fr ? "Solde" : "Balance"}</p>
          </div>
          <div
            className="flex-1 rounded-2xl p-4 flex flex-col gap-1"
            style={{ background: "#1a1a1a", border: "1.5px solid #f59e0b" }}
          >
            <p className="text-white font-extrabold text-xl leading-tight" data-testid="text-cumulative">
              {fmt(totalEarnings)}
            </p>
            <p className="text-gray-400 text-sm">{fr ? "Revenus cumulés" : "Total earned"}</p>
          </div>
        </div>

        {/* ── GRID MENU ── */}
        <div className="grid grid-cols-4 gap-0 mt-5 mx-3 rounded-2xl overflow-hidden" style={{ background: "#1a1a1a" }}>
          {gridMenu.map((item, idx) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex flex-col items-center justify-center py-5 gap-2 active:bg-white/5"
              style={{
                borderRight:  (idx % 4 !== 3) ? "1px solid rgba(255,255,255,0.06)" : "none",
                borderBottom: (idx < 4)        ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
              data-testid={`button-menu-${idx}`}
            >
              <img
                src={item.icon}
                alt={item.label}
                className="w-8 h-8 object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <span className="text-white text-[10px] font-medium text-center leading-tight px-1">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ── LOGOUT ── */}
        <div className="px-3 mt-5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-full"
            style={{ background: "#1a1a1a", border: "1.5px solid rgba(255,255,255,0.15)" }}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-base">{fr ? "Déconnexion" : "Log Out"}</span>
          </button>
        </div>

        <div className="h-4" />
      </div>

      {/* ── ADMIN PIN MODAL ── */}
      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="max-w-sm" style={{ background: "#1a1a1a", border: "1px solid rgba(245,158,11,0.3)" }}>
          <DialogHeader>
            <DialogTitle className="text-center text-white">Administrator Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-400 text-center">Enter your PIN to access the admin panel</p>
            <Input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="PIN Code"
              className="text-center text-2xl tracking-widest bg-black/40 border-white/20 text-white"
              maxLength={8}
              data-testid="input-admin-pin"
            />
            <Button
              onClick={() => {
                if (adminPin.length < 4) { toast({ title: "PIN must be at least 4 characters", variant: "destructive" }); return; }
                verifyPinMutation.mutate(adminPin);
              }}
              disabled={verifyPinMutation.isPending || adminPin.length < 4}
              className="w-full font-bold"
              style={{ background: "#f59e0b", color: "#000" }}
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
