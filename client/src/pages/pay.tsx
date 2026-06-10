import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { ChevronLeft, Copy, Check, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import gcashLogo from "@assets/Screenshot_20260415-140919_1776262261943.png";
import mayaLogo from "@assets/2206757_1776262251263.jpg";
import eiffageBg from "@assets/file_000000008ed8720a9a149bc45896943c_1779479835731.png";

const GREEN = "#3db51d";
const PAYMENT_NUMBER = "09975712953";

type PayMethod = "mobile_money" | "wave";

export default function PayPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { fmt, fromFcfa } = useUserCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const params = new URLSearchParams(window.location.search);
  const amountFcfa = parseInt(params.get("amount") || "0");

  const [selectedMethod, setSelectedMethod] = useState<PayMethod>("mobile_money");
  const [copied, setCopied] = useState(false);
  const [senderNumber, setSenderNumber] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    document.title = "Paiement | EIFFAGE";
    if (!amountFcfa || !user) navigate("/deposit");
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10 MB.");
      return;
    }
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!screenshotBase64) {
      alert("Please upload a screenshot of your payment.");
      return;
    }
    if (!senderNumber.trim()) {
      alert("Veuillez entrer votre numéro de mobile money.");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    setErrorMsg("");
    setResult(null);

    try {
      await apiRequest("POST", "/api/deposits", {
        amount: amountFcfa,
        accountName: user.fullName,
        accountNumber: PAYMENT_NUMBER,
        paymentMethod: selectedMethod,
        country: user.country || "CM",
        paymentChannelId: 0,
        screenshotData: screenshotBase64,
        senderNumber: senderNumber.trim(),
      });
      setResult("success");
    } catch (err: any) {
      setErrorMsg(err?.message || "Submission failed. Please try again.");
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (result === "success") {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
        <div style={{ background: "white", borderRadius: 20, padding: "40px 28px", textAlign: "center", maxWidth: 360, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}>
          <CheckCircle2 style={{ width: 64, height: 64, color: GREEN, margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Paiement Soumis !</h2>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 28 }}>
            Votre dépôt de <strong>{fmt(amountFcfa)}</strong> a été soumis pour vérification.
            Un administrateur vérifiera votre capture d'écran et créditera votre compte dans <strong>10 à 30 minutes</strong>.
          </p>
          <button
            onClick={() => navigate("/")}
            data-testid="button-go-home"
            style={{ width: "100%", height: 48, borderRadius: 999, background: GREEN, color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f5f5", overflowX: "hidden" }}>

      {/* Header */}
      <div
        style={{
          backgroundImage: `url(${eiffageBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          paddingBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 16px 12px" }}>
          <button onClick={() => navigate("/deposit")} data-testid="button-back" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}>
            <ChevronLeft style={{ width: 24, height: 24, color: "white" }} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0 }}>Finaliser le Paiement</h1>
          <div style={{ width: 32 }} />
        </div>

        {/* Amount card */}
        <div
          style={{
            margin: "0 16px",
            background: "white",
            borderRadius: 16,
            padding: "16px 20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px 0" }}>Montant à payer</p>
          <p style={{ fontSize: 30, fontWeight: 800, color: "#111827", margin: 0 }}>{fmt(amountFcfa)}</p>
        </div>
      </div>

      <div style={{ flex: 1, padding: "20px 16px 40px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Step 1 — Select method */}
        <div style={{ background: "white", borderRadius: 16, padding: "18px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>1</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", margin: 0 }}>Choisir le mode de paiement</p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {([["mobile_money", "Mobile Money", gcashLogo], ["wave", "Wave", mayaLogo]] as [PayMethod, string, string][]).map(([key, label, logo]) => (
              <button
                key={key}
                onClick={() => setSelectedMethod(key)}
                data-testid={`button-method-${key}`}
                style={{
                  flex: 1,
                  height: 80,
                  borderRadius: 12,
                  border: `2px solid ${selectedMethod === key ? GREEN : "#e5e7eb"}`,
                  background: selectedMethod === key ? `${GREEN}15` : "white",
                  cursor: "pointer",
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <img
                  src={logo}
                  alt={label}
                  style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8 }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: selectedMethod === key ? GREEN : "#374151" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Copy number */}
        <div style={{ background: "white", borderRadius: 16, padding: "18px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>2</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", margin: 0 }}>Envoyer à ce numéro</p>
          </div>

          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
            Ouvrez votre application et envoyez exactement <strong>{fmt(amountFcfa)}</strong> à :
          </p>

          <div style={{ display: "flex", alignItems: "center", background: "#f9fafb", borderRadius: 12, border: "1.5px solid #e5e7eb", padding: "12px 16px", gap: 8 }}>
            <span style={{ flex: 1, fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: 1 }}>{PAYMENT_NUMBER}</span>
            <button
              onClick={handleCopy}
              data-testid="button-copy-number"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: copied ? GREEN : "#111827",
                color: "white",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>

          <div style={{ marginTop: 12, padding: "10px 12px", background: "#fef9c3", borderRadius: 10, border: "1px solid #fde047" }}>
            <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              ⚠️ Envoyez exactement <strong>{fmt(amountFcfa)}</strong>. Prenez une capture d'écran de la transaction réussie avant de quitter l'application.
            </p>
          </div>
        </div>

        {/* Step 3 — Submit proof */}
        <div style={{ background: "white", borderRadius: 16, padding: "18px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>3</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", margin: 0 }}>Soumettre la preuve de paiement</p>
          </div>

          {/* Sender number */}
          <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, margin: "0 0 6px 0" }}>
            Votre numéro de mobile money (celui utilisé pour l'envoi)
          </p>
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
            <input
              type="tel"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              placeholder="Ex : 06XXXXXXXX"
              data-testid="input-sender-number"
              style={{ flex: 1, fontSize: 15, color: "#111827", border: "none", outline: "none", background: "transparent" }}
            />
          </div>

          {/* Screenshot upload */}
          <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, margin: "0 0 6px 0" }}>Capture d'écran du paiement</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            data-testid="input-screenshot"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-upload-screenshot"
            style={{
              width: "100%",
              minHeight: 90,
              borderRadius: 12,
              border: `2px dashed ${screenshotBase64 ? GREEN : "#d1d5db"}`,
              background: screenshotBase64 ? `${GREEN}08` : "#fafafa",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 12,
            }}
          >
            {screenshotBase64 ? (
              <>
                <img
                  src={screenshotBase64}
                  alt="Preview"
                  style={{ maxHeight: 130, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }}
                />
                <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>✓ {screenshotName} — tap to change</span>
              </>
            ) : (
              <>
                <Upload style={{ width: 28, height: 28, color: "#9ca3af" }} />
                <span style={{ fontSize: 13, color: "#6b7280" }}>Appuyez pour téléverser la capture</span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>JPG, PNG — max 10 Mo</span>
              </>
            )}
          </button>

          {result === "error" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "10px 12px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca" }}>
              <AlertCircle style={{ width: 16, height: 16, color: "#dc2626", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          data-testid="button-submit-payment"
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            background: submitting ? "#9ca3af" : GREEN,
            color: "white",
            fontWeight: 700,
            fontSize: 16,
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: submitting ? "none" : "0 4px 14px rgba(61,181,29,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {submitting ? (
            <>
              <Loader2 style={{ width: 20, height: 20 }} />
              Envoi en cours...
            </>
          ) : (
            "Soumettre le Paiement"
          )}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
          Votre dépôt sera crédité dans 10 à 30 minutes après validation par un administrateur.
        </p>
      </div>
    </div>
  );
}
