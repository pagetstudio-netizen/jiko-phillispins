import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, Loader2, DollarSign, Copy, CheckCircle2, Upload, X, Zap, HandCoins } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { apiRequest } from "@/lib/queryClient";
import heroImg from "@assets/Liberer-le-potentiel-de-lintelligence-artificielle-dans-la-rob_1779519826156.png";
import historyIcon from "@assets/5708960_1774829436660-C3SIos42_1775833646464.png";
import type { ManualPaymentAccount } from "@shared/schema";

const PRESET_AMOUNTS_FCFA = [5000, 15000, 35000, 70000];

function EiffageLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <span style={{ color: "white", fontWeight: 900, fontSize: 28, letterSpacing: 1, fontFamily: "sans-serif" }}>EIFFAGE</span>
    </div>
  );
}

export default function DepositPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { fmt, toFcfa } = useUserCurrency();

  const [mode, setMode] = useState<"auto" | "semi_auto">("auto");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");

  // Semi-auto state
  const [semiStep, setSemiStep] = useState<"choose" | "submit">("choose");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<ManualPaymentAccount | null>(null);
  const [senderNumber, setSenderNumber] = useState("");
  const [paymentReceivedMessage, setPaymentReceivedMessage] = useState("");
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: platformSettings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const { data: accounts = [] } = useQuery<ManualPaymentAccount[]>({ queryKey: ["/api/manual-payment-accounts"] });

  const sendavapayEnabled = platformSettings?.sendavapayEnabled === "true";
  const minDepositFcfa = parseInt(platformSettings?.minDeposit || "3000");

  const getAmountFcfa = (): number => {
    if (selectedPreset !== null) return selectedPreset;
    const raw = parseFloat(customAmount);
    if (!isNaN(raw) && raw > 0) return toFcfa(raw);
    return 0;
  };

  // ── Auto (SendavaPay) ──
  const autoMutation = useMutation({
    mutationFn: async (amtFcfa: number) => {
      const res = await apiRequest("POST", "/api/sendavapay/deposit", { amount: amtFcfa });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) window.location.href = data.paymentUrl;
    },
    onError: (e: any) => alert(e.message || "Erreur de paiement automatique"),
  });

  const handleAutoConfirm = () => {
    const amt = getAmountFcfa();
    if (!amt || amt < minDepositFcfa) { alert(`Montant minimum: ${fmt(minDepositFcfa)}`); return; }
    autoMutation.mutate(amt);
  };

  // ── Semi-Auto ──
  const copyNumber = async (account: ManualPaymentAccount) => {
    await navigator.clipboard.writeText(account.phoneNumber);
    setCopiedId(account.id);
    setSelectedAccount(account);
    setTimeout(() => { setCopiedId(null); setSemiStep("submit"); }, 1200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setScreenshotData(result);
      setScreenshotPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const semiMutation = useMutation({
    mutationFn: async () => {
      const amt = getAmountFcfa();
      if (!amt || amt < minDepositFcfa) throw new Error(`Montant minimum: ${fmt(minDepositFcfa)}`);
      if (!senderNumber) throw new Error("Numéro expéditeur requis");
      if (!selectedAccount) throw new Error("Compte destinataire requis");
      if (!screenshotData) throw new Error("Capture d'écran requise");

      const res = await apiRequest("POST", "/api/deposits/semi-auto", {
        amount: amt,
        senderNumber,
        destinationNumber: selectedAccount.phoneNumber,
        paymentMethod: selectedAccount.operatorName,
        screenshotData,
        paymentReceivedMessage,
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: (e: any) => alert(e.message),
  });

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#111111", display: "flex", flexDirection: "column" }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: `linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.55) 100%), url(${heroImg}) center/cover no-repeat`,
        paddingTop: 44, paddingBottom: 24, position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", marginBottom: 12 }}>
          <button onClick={() => navigate("/")} data-testid="button-back" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
            <ChevronLeft style={{ width: 26, height: 26, color: "white" }} />
          </button>
          <div style={{ flex: 1 }} />
          <Link href="/deposit-orders">
            <button data-testid="button-history" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
              <img src={historyIcon} alt="History" style={{ width: 24, height: 24, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </button>
          </Link>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <EiffageLogo />
        </div>
        <p style={{ color: "white", fontWeight: 800, fontSize: 16, textAlign: "center", letterSpacing: 4, margin: 0 }}>
          RECHARGE
        </p>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, padding: "14px 12px 100px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── MODE SWITCHER ── */}
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <button
            onClick={() => { setMode("auto"); setSemiStep("choose"); setSubmitted(false); }}
            data-testid="button-mode-auto"
            style={{
              background: mode === "auto" ? "#f59e0b" : "transparent",
              border: "none", borderRadius: 10, padding: "12px 8px",
              color: mode === "auto" ? "#000" : "#9ca3af",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Zap style={{ width: 16, height: 16 }} />
            Dépôt Auto
          </button>
          <button
            onClick={() => { setMode("semi_auto"); setSemiStep("choose"); setSubmitted(false); }}
            data-testid="button-mode-semi-auto"
            style={{
              background: mode === "semi_auto" ? "#f59e0b" : "transparent",
              border: "none", borderRadius: 10, padding: "12px 8px",
              color: mode === "semi_auto" ? "#000" : "#9ca3af",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <HandCoins style={{ width: 16, height: 16 }} />
            Dépôt Semi-Auto
          </button>
        </div>

        {/* ── AMOUNT SELECTOR (commun aux deux modes) ── */}
        {(!submitted) && (
          <>
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "16px 14px" }}>
              <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}>Montant de recharge</p>
              <div style={{ borderTop: "1px dashed rgba(255,255,255,0.15)", marginBottom: 14 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                {PRESET_AMOUNTS_FCFA.map((fcfa) => {
                  const isSelected = selectedPreset === fcfa;
                  return (
                    <button key={fcfa} onClick={() => { setSelectedPreset(fcfa); setCustomAmount(""); }}
                      data-testid={`button-preset-${fcfa}`}
                      style={{
                        background: isSelected ? "#2a2a2a" : "#0d0d0d",
                        border: isSelected ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.08)",
                        borderRadius: 10, padding: "14px 6px",
                        color: isSelected ? "#f59e0b" : "white",
                        fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "center",
                      }}>
                      {fmt(fcfa)}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1.5px solid rgba(255,255,255,0.18)", paddingBottom: 10 }}>
                <DollarSign style={{ width: 22, height: 22, color: "#9ca3af", flexShrink: 0 }} />
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null); }}
                  placeholder="Montant personnalisé"
                  data-testid="input-deposit-amount"
                  style={{ flex: 1, fontSize: 15, color: "white", background: "transparent", border: "none", outline: "none" }}
                />
              </div>
            </div>
          </>
        )}

        {/* ══ AUTO MODE ══ */}
        {mode === "auto" && !submitted && (
          <>
            {sendavapayEnabled ? (
              <>
                <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "16px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ background: "#f59e0b22", borderRadius: 8, padding: 8 }}>
                      <Zap style={{ width: 20, height: 20, color: "#f59e0b" }} />
                    </div>
                    <div>
                      <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>SendavaPay</p>
                      <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>Paiement Mobile Money sécurisé</p>
                    </div>
                  </div>
                  <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.6 }}>
                    Vous serez redirigé vers la page de paiement SendavaPay. Le paiement sera crédité automatiquement après confirmation.
                  </p>
                </div>

                <button
                  onClick={handleAutoConfirm}
                  disabled={autoMutation.isPending}
                  data-testid="button-submit-auto"
                  style={{
                    width: "100%", height: 54,
                    background: "#f59e0b",
                    border: "none", borderRadius: 12,
                    color: "#000", fontWeight: 700, fontSize: 17,
                    cursor: autoMutation.isPending ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: autoMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {autoMutation.isPending
                    ? <><Loader2 style={{ width: 20, height: 20 }} className="animate-spin" /> Traitement...</>
                    : <><Zap style={{ width: 18, height: 18 }} /> Payer maintenant</>
                  }
                </button>
              </>
            ) : (
              <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "24px 14px", textAlign: "center" }}>
                <Zap style={{ width: 32, height: 32, color: "#4b5563", margin: "0 auto 10px" }} />
                <p style={{ color: "#9ca3af", fontSize: 14 }}>Le dépôt automatique n'est pas disponible pour le moment.</p>
                <p style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>Utilisez le dépôt semi-auto ou contactez le support.</p>
                <button
                  onClick={() => setMode("semi_auto")}
                  style={{ marginTop: 14, background: "#f59e0b", border: "none", borderRadius: 10, padding: "10px 20px", color: "#000", fontWeight: 700, cursor: "pointer" }}
                >
                  Passer au Dépôt Semi-Auto
                </button>
              </div>
            )}
          </>
        )}

        {/* ══ SEMI-AUTO MODE ══ */}
        {mode === "semi_auto" && !submitted && (

          semiStep === "choose" ? (
            /* ── Step 1: Choose account ── */
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "16px 14px" }}>
              <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 14 }}>
                Sélectionnez un numéro pour envoyer votre paiement
              </p>
              {accounts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <p style={{ color: "#6b7280", fontSize: 14 }}>Aucun numéro disponible pour votre pays.</p>
                  <p style={{ color: "#4b5563", fontSize: 12, marginTop: 6 }}>Contactez le support pour plus d'informations.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {accounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => copyNumber(account)}
                      data-testid={`button-account-${account.id}`}
                      style={{
                        background: copiedId === account.id ? "#0d2a0d" : "#0d0d0d",
                        border: `1.5px solid ${copiedId === account.id ? "#22c55e" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 12, padding: "14px 16px",
                        cursor: "pointer", textAlign: "left",
                        display: "flex", alignItems: "center", gap: 12,
                        transition: "all 0.15s",
                      }}
                    >
                      {account.logoUrl ? (
                        <img src={account.logoUrl} alt={account.operatorName} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <HandCoins style={{ width: 22, height: 22, color: "#f59e0b" }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>{account.operatorName}</p>
                        <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>{account.ownerName}</p>
                        <p style={{ color: "#f59e0b", fontWeight: 700, fontSize: 15, margin: 0, marginTop: 2 }}>{account.phoneNumber}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: copiedId === account.id ? "#22c55e" : "#9ca3af" }}>
                        {copiedId === account.id ? <CheckCircle2 style={{ width: 20, height: 20 }} /> : <Copy style={{ width: 18, height: 18 }} />}
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{copiedId === account.id ? "Copié!" : "Copier"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Step 2: Submit proof ── */
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Selected account recap */}
              {selectedAccount && (
                <div style={{ background: "#0d0d0d", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  {selectedAccount.logoUrl && <img src={selectedAccount.logoUrl} alt={selectedAccount.operatorName} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />}
                  <div>
                    <p style={{ color: "#9ca3af", fontSize: 11, margin: 0 }}>Vous avez envoyé à</p>
                    <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>{selectedAccount.operatorName} — {selectedAccount.phoneNumber}</p>
                  </div>
                  <button onClick={() => setSemiStep("choose")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                    <X style={{ width: 18, height: 18 }} />
                  </button>
                </div>
              )}

              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>Confirmez votre paiement</p>

              {/* Sender number */}
              <div>
                <label style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 6 }}>Votre numéro d'envoi *</label>
                <input
                  type="tel"
                  value={senderNumber}
                  onChange={e => setSenderNumber(e.target.value)}
                  placeholder="+237 6..."
                  data-testid="input-sender-number"
                  style={{
                    width: "100%", background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.12)",
                    borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Message received */}
              <div>
                <label style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 6 }}>Message reçu après paiement</label>
                <textarea
                  value={paymentReceivedMessage}
                  onChange={e => setPaymentReceivedMessage(e.target.value)}
                  placeholder="Copiez le message de confirmation ici..."
                  rows={3}
                  data-testid="input-payment-message"
                  style={{
                    width: "100%", background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.12)",
                    borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 13,
                    outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Screenshot */}
              <div>
                <label style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 6 }}>Capture d'écran du paiement *</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} data-testid="input-screenshot" />
                {screenshotPreview ? (
                  <div style={{ position: "relative" }}>
                    <img src={screenshotPreview} alt="Preuve" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }} />
                    <button onClick={() => { setScreenshotData(null); setScreenshotPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                      style={{ position: "absolute", top: 8, right: 8, background: "#ef4444", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X style={{ width: 14, height: 14, color: "white" }} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} data-testid="button-upload-screenshot"
                    style={{
                      width: "100%", height: 80, background: "#0d0d0d",
                      border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: 10,
                      color: "#9ca3af", fontSize: 13, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                    <Upload style={{ width: 18, height: 18 }} />
                    Appuyer pour choisir une image
                  </button>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={() => semiMutation.mutate()}
                disabled={semiMutation.isPending}
                data-testid="button-submit-semi"
                style={{
                  width: "100%", height: 54, background: "#f59e0b", border: "none", borderRadius: 12,
                  color: "#000", fontWeight: 700, fontSize: 17,
                  cursor: semiMutation.isPending ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: semiMutation.isPending ? 0.7 : 1,
                }}
              >
                {semiMutation.isPending
                  ? <><Loader2 style={{ width: 20, height: 20 }} className="animate-spin" /> Envoi...</>
                  : "Soumettre le paiement"
                }
              </button>

              <button onClick={() => setSemiStep("choose")} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                ← Choisir un autre numéro
              </button>
            </div>
          )
        )}

        {/* ══ SUCCESS (semi-auto) ══ */}
        {submitted && (
          <div style={{ background: "#0d2a0d", border: "1.5px solid #22c55e", borderRadius: 14, padding: "24px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <CheckCircle2 style={{ width: 48, height: 48, color: "#22c55e" }} />
            <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: 0 }}>Paiement soumis !</p>
            <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Votre recharge est en cours de validation par l'administration. Elle sera créditée dans les plus brefs délais.
            </p>
            <Link href="/deposit-orders">
              <button style={{ background: "#22c55e", border: "none", borderRadius: 10, padding: "12px 24px", color: "white", fontWeight: 700, cursor: "pointer" }}>
                Voir mes recharges
              </button>
            </Link>
          </div>
        )}

        {/* ── HELP LINK ── */}
        <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center" }}>
          Problème de paiement ?{" "}
          <Link href="/service">
            <span style={{ color: "#f59e0b", cursor: "pointer", textDecoration: "underline" }}>Cliquez ici</span>
          </Link>
        </p>

        {/* ── INSTRUCTIONS ── */}
        <div style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            `1. Le montant minimum de recharge est ${fmt(minDepositFcfa)}.`,
            "2. Pour le dépôt semi-auto, envoyez exactement le montant indiqué et joignez la capture d'écran.",
            "3. Ne partagez jamais vos informations de paiement avec des tiers.",
            "4. En cas de problème, contactez le service client officiel.",
          ].map((text, i) => <p key={i} style={{ margin: 0 }}>{text}</p>)}
        </div>
      </div>
    </div>
  );
}
