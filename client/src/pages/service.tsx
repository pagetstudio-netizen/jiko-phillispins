import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { SiTelegram, SiWhatsapp } from "react-icons/si";
import { useLang } from "@/lib/i18n";
import heroBg from "@assets/IMG_20260610_064536_722_1781186238228.jpg";

export default function ServicePage() {
  const { lang } = useLang();
  const [, navigate] = useLocation();
  useEffect(() => { document.title = "Service Client | EIFFAGE"; }, []);

  const { data: settings } = useQuery<{
    supportLink: string;
    support2Link: string;
    channelLink: string;
    groupLink: string;
  }>({
    queryKey: ["/api/settings/links"],
  });

  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  const links = [
    {
      label: lang === "fr" ? "WhatsApp Support" : "WhatsApp Support",
      url: settings?.supportLink || "https://wa.me/qr/IXZNRQDK7IFJH1",
      testId: "button-support-link",
      type: "whatsapp" as const,
    },
    {
      label: lang === "fr" ? "Telegram Service" : "Telegram Support",
      url: settings?.support2Link || "https://t.me/EIFFAGE_service",
      testId: "button-support2-link",
      type: "telegram" as const,
    },
    {
      label: lang === "fr" ? "Canal Telegram" : "Telegram Channel",
      url: settings?.channelLink || "https://t.me/EIFFAGE_canzl",
      testId: "button-channel-link",
      type: "telegram" as const,
    },
    {
      label: lang === "fr" ? "Chaîne WhatsApp" : "WhatsApp Channel",
      url: settings?.groupLink || "https://whatsapp.com/channel/0029VbDH4mGElagq0ISJ7e1N",
      testId: "button-group-link",
      type: "whatsapp" as const,
    },
  ];

  const infoLines = lang === "fr"
    ? [
        "1. Pour toute question, n'hésitez pas à contacter notre service client en ligne. Nous serons ravis de vous aider.",
        "2. Veuillez conserver votre mot de passe en lieu sûr et ne le divulguez jamais à personne. Le personnel officiel ne vous le demandera jamais.",
      ]
    : [
        "1. For any questions, do not hesitate to contact our online customer service. We will be happy to help you.",
        "2. Please keep your password in a safe place and never share it with anyone. Official staff will never ask for it.",
      ];

  return (
    <div style={{ minHeight: "100vh", background: "#111111", display: "flex", flexDirection: "column" }}>

      {/* ── HERO HEADER ── */}
      <div style={{ position: "relative" }}>
        <img
          src={heroBg}
          alt=""
          style={{ width: "100%", height: 220, objectFit: "cover", objectPosition: "center 40%", display: "block" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.65) 100%)",
        }} />

        <div style={{ position: "absolute", top: 44, left: 16, zIndex: 10 }}>
          <button
            data-testid="button-back"
            onClick={() => navigate("/account")}
            style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}
          >
            <ChevronLeft style={{ width: 26, height: 26, color: "white" }} />
          </button>
        </div>

        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          paddingTop: 20,
        }}>
          <p style={{ color: "white", fontWeight: 900, fontSize: 22, letterSpacing: 3, margin: 0 }}>
            {lang === "fr" ? "SERVICE CLIENT" : "CUSTOMER SERVICE"}
          </p>
          <p style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "4px 0 0", letterSpacing: -0.5 }}>
            9:00 AM-7:00 PM
          </p>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 500, margin: "2px 0 0" }}>
            {lang === "fr" ? "Heures en ligne" : "Online hours"}
          </p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, padding: "18px 12px 60px", display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Section label */}
        <p style={{ color: "#9ca3af", fontSize: 13, fontWeight: 600, marginBottom: 4, paddingLeft: 2 }}>
          {lang === "fr" ? "Nous contacter" : "Contact us"}
        </p>

        {links.map((item) => (
          <button
            key={item.testId}
            onClick={() => openLink(item.url)}
            data-testid={item.testId}
            style={{
              width: "100%",
              background: "#1a1a1a",
              border: "none",
              borderRadius: 12,
              padding: "16px 14px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: item.type === "whatsapp" ? "#25D366" : "#229ED9",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {item.type === "whatsapp"
                ? <SiWhatsapp style={{ width: 22, height: 22, color: "white" }} />
                : <SiTelegram style={{ width: 22, height: 22, color: "white" }} />
              }
            </div>

            <span style={{ flex: 1, color: "white", fontSize: 15, fontWeight: 500, textAlign: "left" }}>
              {item.label}
            </span>

            <ChevronRight style={{ width: 18, height: 18, color: "#6b7280", flexShrink: 0 }} />
          </button>
        ))}

        {/* Info card */}
        <div style={{
          marginTop: 8,
          background: "#1a1a1a",
          borderRadius: 12,
          padding: "16px 14px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          {infoLines.map((line, i) => (
            <p key={i} style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.65, margin: i > 0 ? "8px 0 0" : 0 }}>
              {line}
            </p>
          ))}
        </div>

      </div>
    </div>
  );
}
