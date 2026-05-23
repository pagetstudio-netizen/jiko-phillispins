import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { SiTelegram } from "react-icons/si";
import { useLang } from "@/lib/i18n";
import heroBg from "@assets/images_(29)_1779519826317.jpeg";

export default function ServicePage() {
  const { lang, t } = useLang();
  const [, navigate] = useLocation();
  useEffect(() => { document.title = "Customer Service | Noviqra Ai"; }, []);

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
      label: lang === "fr" ? "Service Telegram" : "Telegram Support",
      url: settings?.supportLink || "https://t.me/noviqraai",
      testId: "button-support-link",
    },
    {
      label: lang === "fr" ? "Groupes Telegram" : "Telegram Groups",
      url: settings?.groupLink || "https://t.me/noviqraai",
      testId: "button-group-link",
    },
    {
      label: lang === "fr" ? "Chaînes Telegram" : "Telegram Channels",
      url: settings?.channelLink || "https://t.me/noviqraai",
      testId: "button-channel-link",
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
        {/* gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.65) 100%)",
        }} />

        {/* back button */}
        <div style={{ position: "absolute", top: 44, left: 16, zIndex: 10 }}>
          <button
            data-testid="button-back"
            onClick={() => navigate("/account")}
            style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}
          >
            <ChevronLeft style={{ width: 26, height: 26, color: "white" }} />
          </button>
        </div>

        {/* centered text */}
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
        <p style={{ color: "#3b82f6", fontSize: 14, fontWeight: 600, marginBottom: 4, paddingLeft: 2 }}>
          Telegram
        </p>

        {/* Telegram rows */}
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
            {/* Telegram circle icon */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#229ED9",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <SiTelegram style={{ width: 22, height: 22, color: "white" }} />
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
