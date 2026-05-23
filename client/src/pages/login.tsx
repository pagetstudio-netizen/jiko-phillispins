import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { ELIGIBLE_COUNTRIES } from "@/lib/countries";
import { CountrySelector } from "@/components/country-selector";
import ContactSheet from "@/components/contact-sheet";
import { Loader2, Eye, EyeOff, ChevronDown, Globe } from "lucide-react";
import { useLang } from "@/lib/i18n";
import skyBg from "@assets/20260408_191813_1775839627189.jpg";
import serviceAgent from "@assets/service_p1_1775839314312.png";

function NioLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="21" stroke="white" strokeWidth="2.5" fill="none" />
        <path
          d="M8 28 Q15 14 22 20 Q29 26 36 12"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span style={{ color: "white", fontWeight: 800, fontSize: 26, letterSpacing: 2, fontFamily: "sans-serif" }}>Noviqra AI</span>
    </div>
  );
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { lang, setLang, t } = useLang();
  const tr = t.login;

  const loginSchema = z.object({
    phone: z.string().min(8, tr.invalidPhone),
    country: z.string().min(2, tr.selectCountry),
    password: z.string().min(1, tr.passwordRequired),
  });
  type LoginForm = z.infer<typeof loginSchema>;

  useEffect(() => { document.title = tr.title; }, [tr.title]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const saved = typeof window !== "undefined" ? localStorage.getItem("noviqra_credentials") : null;
  const parsed = saved ? JSON.parse(saved) : null;
  const [rememberMe, setRememberMe] = useState(!!parsed);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: parsed?.phone || "",
      country: parsed?.country || "PH",
      password: parsed?.password || "",
    },
  });

  const selectedCountry = form.watch("country");
  const countryData = ELIGIBLE_COUNTRIES.find(c => c.code === selectedCountry);

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    const cleanPhone = data.phone.replace(/\D/g, "");
    try {
      await login(cleanPhone, data.country, data.password.trim());
      if (rememberMe) {
        localStorage.setItem("noviqra_credentials", JSON.stringify({ phone: cleanPhone, country: data.country, password: data.password.trim() }));
      } else {
        localStorage.removeItem("noviqra_credentials");
      }
      navigate("/");
    } catch (e: any) {
      toast({ title: tr.errorTitle, description: e.message || tr.errorDesc, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const startRef = useRef({ mx: 0, my: 0, bx: 0, by: 0 });

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startRef.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    setPos({ x: startRef.current.bx + (e.clientX - startRef.current.mx), y: startRef.current.by + (e.clientY - startRef.current.my) });
  }
  function onPointerUp() { dragging.current = false; }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    height: 58,
    display: "flex",
    alignItems: "center",
    border: "none",
    overflow: "hidden",
  };

  useEffect(() => {
    const prev = document.documentElement.style.background;
    document.documentElement.style.background = "#c9a87c";
    document.body.style.background = "#c9a87c";
    return () => {
      document.documentElement.style.background = prev;
      document.body.style.background = "";
    };
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
      background: `#c9a87c url(${skyBg}) center/cover no-repeat`,
    }}>

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "60px 20px 40px" }}>

        {/* NIO Logo + welcome */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 16 }}>
          <NioLogo />
          <p style={{ color: "white", fontSize: 22, fontWeight: 700, marginTop: 12, textShadow: "0 1px 6px rgba(0,0,0,0.25)" }}>
            {lang === "fr" ? "Bienvenue sur Noviqra AI" : "Welcome to Noviqra AI"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Phone */}
          <div>
            <div style={inputStyle}>
              <button
                type="button"
                onClick={() => setCountryModalOpen(true)}
                data-testid="button-select-country"
                style={{ fontSize: 15, fontWeight: 700, color: "#374151", paddingLeft: 16, paddingRight: 10, height: "100%", display: "flex", alignItems: "center", gap: 3, background: "transparent", border: "none", borderRight: "1.5px solid #e5e7eb", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {countryData ? `+${countryData.phonePrefix}` : "+"}
                <ChevronDown size={14} style={{ color: "#9ca3af" }} />
              </button>
              <input
                {...form.register("phone")}
                type="tel"
                placeholder={tr.phonePlaceholder}
                data-testid="input-phone"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", paddingLeft: 14, paddingRight: 14, fontSize: 15, color: "#111827" }}
              />
            </div>
            {form.formState.errors.phone && (
              <p style={{ fontSize: 12, color: "#fff", marginTop: 4, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{form.formState.errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div style={inputStyle}>
              <input
                {...form.register("password")}
                type={showPassword ? "text" : "password"}
                placeholder={tr.passwordPlaceholder}
                data-testid="input-password"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", paddingLeft: 16, paddingRight: 12, fontSize: 15, color: "#111827" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-password"
                style={{ paddingRight: 16, paddingLeft: 8, color: "#9ca3af", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p style={{ fontSize: 12, color: "#fff", marginTop: 4, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{form.formState.errors.password.message}</p>
            )}
          </div>

          <input type="hidden" {...form.register("country")} />

          {/* Remember me */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              data-testid="checkbox-remember"
              style={{ width: 16, height: 16, accentColor: "#f59e0b" }}
            />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{tr.rememberMe}</span>
          </label>

          {/* Login button */}
          <button
            type="submit"
            disabled={isLoading}
            data-testid="button-login"
            style={{ width: "100%", height: 54, borderRadius: 999, background: "#111111", color: "white", fontWeight: 700, fontSize: 17, border: "none", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.75 : 1, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {isLoading ? <><Loader2 size={20} className="animate-spin" />{tr.loading}</> : (lang === "fr" ? "Se connecter" : tr.loginBtn)}
          </button>

          {/* Go to register */}
          <p style={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 }}>
            {lang === "fr" ? "Vous n'avez pas de compte ?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              data-testid="button-goto-register"
              style={{ background: "transparent", border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "underline", padding: 0 }}
            >
              {lang === "fr" ? "S'inscrire" : tr.registerBtn}
            </button>
          </p>

        </form>

        {/* Language Switcher */}
        <div style={{ marginTop: 28, display: "flex", justifyContent: "center", position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            data-testid="button-lang-switcher"
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 999, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "white" }}
          >
            <Globe size={15} />
            {lang === "en" ? "🇬🇧 English" : "🇫🇷 Français"}
            <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>
          {showLangMenu && (
            <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", background: "white", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", border: "1px solid #e5e7eb", overflow: "hidden", zIndex: 10, minWidth: 150 }}>
              <button type="button" onClick={() => { setLang("en"); setShowLangMenu(false); }} data-testid="button-lang-en"
                style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: lang === "en" ? "#fef3c7" : "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: lang === "en" ? 700 : 400, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}>
                🇬🇧 English
              </button>
              <button type="button" onClick={() => { setLang("fr"); setShowLangMenu(false); }} data-testid="button-lang-fr"
                style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: lang === "fr" ? "#fef3c7" : "white", border: "none", borderTop: "1px solid #f3f4f6", cursor: "pointer", fontSize: 14, fontWeight: lang === "fr" ? 700 : 400, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}>
                🇫🇷 Français
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Draggable service agent */}
      <button
        type="button"
        onClick={() => { if (!dragging.current) setShowContact(true); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-testid="button-contact-agent"
        style={{ position: "fixed", bottom: 28 - pos.y, right: 20 - pos.x, width: 58, height: 58, borderRadius: "50%", overflow: "hidden", border: "3px solid white", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", background: "white", cursor: "grab", padding: 0, zIndex: 100, touchAction: "none" }}
      >
        <img src={serviceAgent} alt="Contact us" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
      </button>

      <CountrySelector
        open={countryModalOpen}
        onClose={() => setCountryModalOpen(false)}
        onSelect={(code) => form.setValue("country", code, { shouldValidate: true })}
      />
      <ContactSheet open={showContact} onClose={() => setShowContact(false)} />
    </div>
  );
}
