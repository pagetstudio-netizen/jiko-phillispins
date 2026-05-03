import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import jinkoBg from "@assets/15502488526db98c02ac135d0ac0e262d31dee111d_1775833317804.jpg";
import historyIcon from "@assets/5708960_1774829436660-C3SIos42_1775833646464.png";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { apiRequest } from "@/lib/queryClient";

const GREEN = "#3db51d";

export default function DepositPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { document.title = "Deposit | Jinko Solar"; }, []);
  const { fmt, fromFcfa, toFcfa } = useUserCurrency();

  const [amount, setAmount] = useState<number | "">("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [cloudpayResult, setCloudpayResult] = useState<{
    redirectUrl?: string | null;
    qrcodeUrl?: string | null;
    bankAccount?: string | null;
  } | null>(null);

  const { data: platformSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const { data: channels = [] } = useQuery<any[]>({
    queryKey: ["/api/payment-channels"],
  });

  const minDepositFcfa = parseInt(platformSettings?.minDeposit || "3000");
  const minDeposit = fromFcfa(minDepositFcfa);

  const activeChannels = (channels as any[]).filter((c: any) => c.isActive);

  const generatePresets = (minFcfa: number): number[] => {
    const min = fromFcfa(minFcfa);
    return [1, 2, 3, 5, 10, 20].map(m => Math.round(min * m));
  };
  const presetAmounts = generatePresets(minDepositFcfa);

  const selectedChannel = activeChannels.find((c: any) => c.id.toString() === selectedChannelId);
  const isCloudpay = selectedChannel?.gateway === "cloudpay";

  const cloudpayMutation = useMutation({
    mutationFn: async (amtFcfa: number) => {
      const response = await apiRequest("POST", "/api/cloudpay/deposit", {
        amount: amtFcfa,
        paymentMethod: "GCash",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Erreur CloudPay");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCloudpayResult({
        redirectUrl: data.redirectUrl,
        qrcodeUrl: data.qrcodeUrl,
        bankAccount: data.bankAccount,
      });
    },
    onError: (err: any) => {
      alert(err.message || "Erreur CloudPay");
    },
  });

  const handleDeposit = () => {
    const amt = typeof amount === "number" ? amount : 0;
    if (!amt || amt < minDeposit) {
      alert(`Dépôt minimum : ${fmt(minDepositFcfa)}`);
      return;
    }
    if (!selectedChannelId) {
      alert("Veuillez choisir un canal de paiement.");
      return;
    }
    const amtFcfa = toFcfa(amt);
    if (isCloudpay) {
      cloudpayMutation.mutate(amtFcfa);
    } else {
      navigate(`/pay?amount=${amtFcfa}&country=${user?.country || "PH"}`);
    }
  };

  if (!user) return null;

  if (cloudpayResult) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
        <div style={{ background: "white", borderRadius: 20, padding: "40px 28px", textAlign: "center", maxWidth: 360, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}>
          <CheckCircle2 style={{ width: 56, height: 56, color: GREEN, margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Paiement initié</h2>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>
            Complétez le paiement pour créditer votre compte automatiquement.
          </p>

          {cloudpayResult.qrcodeUrl && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Scannez le QR Code pour payer</p>
              <img
                src={cloudpayResult.qrcodeUrl}
                alt="QR Code"
                style={{ maxWidth: 180, borderRadius: 12, border: "1px solid #e5e7eb", margin: "0 auto", display: "block" }}
              />
            </div>
          )}

          {cloudpayResult.bankAccount && (
            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px 0" }}>Transférer vers le compte</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "monospace", margin: 0 }}>{cloudpayResult.bankAccount}</p>
            </div>
          )}

          {cloudpayResult.redirectUrl && (
            <button
              onClick={() => window.open(cloudpayResult.redirectUrl!, "_blank")}
              data-testid="button-cloudpay-redirect"
              style={{ width: "100%", height: 48, borderRadius: 999, background: GREEN, color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <ExternalLink style={{ width: 18, height: 18 }} />
              Ouvrir la page de paiement
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            data-testid="button-go-home"
            style={{ width: "100%", height: 48, borderRadius: 999, background: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f5f5", overflowX: "hidden" }}>

      <div style={{ backgroundImage: `url(${jinkoBg})`, backgroundSize: "cover", backgroundPosition: "center", paddingBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 16px 16px" }}>
          <button onClick={() => navigate("/")} data-testid="button-back" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
            <ChevronLeft style={{ width: 24, height: 24, color: "white" }} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0 }}>Dépôt</h1>
          <Link href="/deposit-orders">
            <button data-testid="button-history" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
              <img src={historyIcon} alt="History" style={{ width: 26, height: 26, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </button>
          </Link>
        </div>

        {/* Saisie du montant */}
        <div style={{ width: "calc(100% - 16px)", marginLeft: 16, boxSizing: "border-box" as const, background: "white", borderRadius: "24px 0 0 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.10)", padding: "20px 16px" }}>
          <p style={{ fontSize: 12, color: GREEN, marginBottom: 8, fontWeight: 600 }}>Montant minimum : {fmt(minDepositFcfa)}</p>

          {/* Montants rapides */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 14 }}>
            {presetAmounts.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                data-testid={`button-preset-${p}`}
                style={{
                  flex: "0 0 auto",
                  height: 36,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderRadius: 8,
                  border: `1.5px solid ${amount === p ? GREEN : "#d1d5db"}`,
                  background: amount === p ? GREEN : "white",
                  color: amount === p ? "white" : "#374151",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {fmt(p)}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 13, color: GREEN, margin: "0 0 8px 0" }}>Saisissez le montant</p>
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px" }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder={minDeposit.toLocaleString()}
              data-testid="input-deposit-amount"
              style={{ flex: 1, fontSize: 16, color: "#111827", border: "none", outline: "none", background: "transparent" }}
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, background: "#f5f5f5", padding: "20px 16px 40px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Sélection du canal */}
        {activeChannels.length > 0 && (
          <div style={{ background: "white", borderRadius: 16, padding: "18px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", margin: "0 0 14px 0" }}>Canal de paiement</p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              {activeChannels.map((channel: any) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannelId(channel.id.toString())}
                  data-testid={`button-channel-${channel.id}`}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: `2px solid ${selectedChannelId === channel.id.toString() ? GREEN : "#e5e7eb"}`,
                    background: selectedChannelId === channel.id.toString() ? `${GREEN}10` : "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left" as const,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{channel.name}</p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0 0" }}>
                      {channel.gateway === "cloudpay" ? "Paiement automatique instantané" : "Paiement manuel"}
                    </p>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: `2px solid ${selectedChannelId === channel.id.toString() ? GREEN : "#d1d5db"}`,
                    background: selectedChannelId === channel.id.toString() ? GREEN : "white",
                    flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {selectedChannelId === channel.id.toString() && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Note CloudPay */}
        {isCloudpay && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 16px" }}>
            <p style={{ fontSize: 13, color: "#1e40af", margin: 0, lineHeight: 1.6 }}>
              ✅ Votre dépôt sera traité <strong>automatiquement</strong>. Vous recevrez un lien ou QR code pour finaliser le paiement.
            </p>
          </div>
        )}

        {/* Bouton */}
        <button
          onClick={handleDeposit}
          disabled={cloudpayMutation.isPending}
          data-testid="button-submit-deposit"
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            background: cloudpayMutation.isPending ? "#9ca3af" : GREEN,
            color: "white",
            fontWeight: 700,
            fontSize: 16,
            border: "none",
            cursor: cloudpayMutation.isPending ? "not-allowed" : "pointer",
            boxShadow: cloudpayMutation.isPending ? "none" : "0 4px 12px rgba(61,181,29,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {cloudpayMutation.isPending ? (
            <>
              <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
              Traitement...
            </>
          ) : "Déposer maintenant"}
        </button>

        {/* Instructions */}
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 12 }}>
            💳 Instructions de dépôt :
          </p>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {[
              { bold: "Montant minimum :", text: ` ${fmt(minDepositFcfa)}` },
              { bold: "Vérifiez vos informations", text: " avant d'effectuer un transfert pour éviter toute erreur" },
              { bold: "Chaque ordre a ses propres informations de paiement", text: " ; ne réutilisez pas les informations précédentes" },
              { bold: "Après un transfert réussi", text: ", attendez 10 à 30 minutes. Si le montant n'est pas crédité, contactez le support." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#1565C0", fontWeight: 700, fontSize: 14, marginTop: 1, flexShrink: 0 }}>◆</span>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>{item.bold}</span>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
