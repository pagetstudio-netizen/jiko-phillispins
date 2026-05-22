import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { SiTelegram } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";
import carImg from "@assets/20260408_191416_1775675670071.jpg";

export default function GiftCodePage() {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const { lang } = useLang();
  useEffect(() => { document.title = "Échanger des cadeaux | Noviqra Ai"; }, []);

  const [code, setCode] = useState("");

  const { data: settings } = useQuery<{ groupLink: string }>({
    queryKey: ["/api/settings/links"],
  });

  const claimMutation = useMutation({
    mutationFn: async (giftCode: string) => {
      const response = await apiRequest("POST", "/api/gift-codes/claim", { code: giftCode });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: (data) => {
      refreshUser();
      setCode("");
      toast({ title: lang === "fr" ? "Félicitations !" : "Congratulations!", description: data.message });
    },
    onError: (error: any) => {
      toast({ title: lang === "fr" ? "Erreur" : "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!code.trim()) {
      toast({
        title: lang === "fr" ? "Erreur" : "Error",
        description: lang === "fr" ? "Veuillez saisir un code" : "Please enter a code",
        variant: "destructive",
      });
      return;
    }
    claimMutation.mutate(code.trim());
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111111", display: "flex", flexDirection: "column" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "44px 16px 16px", gap: 8 }}>
        <Link href="/">
          <button data-testid="button-back" style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer", flexShrink: 0 }}>
            <ChevronLeft style={{ width: 26, height: 26, color: "white" }} />
          </button>
        </Link>
        <h1 style={{ flex: 1, textAlign: "center", color: "white", fontWeight: 700, fontSize: 17, margin: 0, paddingRight: 30 }}>
          {lang === "fr" ? "Échanger des cadeaux" : "Redeem Gifts"}
        </h1>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, padding: "0 12px 60px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* NIO car image */}
        <img
          src={carImg}
          alt="NIO"
          data-testid="img-gift-banner"
          style={{ width: "100%", borderRadius: 14, objectFit: "cover", height: 220, display: "block" }}
        />

        {/* "Get codes from the group" */}
        <p style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
          {lang === "fr"
            ? "Vous pouvez obtenir des codes cadeaux dans le groupe"
            : "You can get gift codes in the group"}
        </p>

        {/* Telegram group row */}
        <button
          onClick={() => window.open(settings?.groupLink || "https://t.me/Jinkosolarr", "_blank")}
          data-testid="button-group-link"
          style={{
            width: "100%",
            background: "#1a1a1a",
            border: "none",
            borderRadius: 12,
            padding: "14px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "#229ED9",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <SiTelegram style={{ width: 20, height: 20, color: "white" }} />
          </div>
          <span style={{ flex: 1, color: "white", fontSize: 15, fontWeight: 500, textAlign: "left" }}>
            {lang === "fr" ? "Groupes Telegram" : "Telegram Groups"}
          </span>
          <ChevronRight style={{ width: 18, height: 18, color: "#6b7280", flexShrink: 0 }} />
        </button>

        {/* Input label */}
        <p style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", margin: 0 }}>
          {lang === "fr"
            ? "Veuillez saisir le code d'échange cadeau"
            : "Please enter the gift redemption code"}
        </p>

        {/* Code input */}
        <div style={{
          background: "#1a1a1a",
          borderRadius: 12,
          padding: "0 14px",
          height: 52,
          display: "flex",
          alignItems: "center",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={lang === "fr" ? "Saisir le code ici" : "Enter code here"}
            data-testid="input-gift-code"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "white",
              fontSize: 15,
              fontFamily: "monospace",
              letterSpacing: 2,
              textAlign: "center",
            }}
          />
        </div>

        {/* Recevoir button */}
        <button
          onClick={handleSubmit}
          disabled={claimMutation.isPending}
          data-testid="button-submit-code"
          style={{
            width: "100%",
            height: 54,
            background: "#0d0d0d",
            border: "1.5px solid #f59e0b",
            borderRadius: 12,
            color: "white",
            fontWeight: 700,
            fontSize: 17,
            cursor: claimMutation.isPending ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: claimMutation.isPending ? 0.7 : 1,
          }}
        >
          {claimMutation.isPending
            ? <><Loader2 style={{ width: 20, height: 20 }} className="animate-spin" /> {lang === "fr" ? "Traitement..." : "Processing..."}</>
            : (lang === "fr" ? "Recevoir" : "Receive")
          }
        </button>

      </div>
    </div>
  );
}
