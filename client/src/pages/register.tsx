import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import ContactSheet from "@/components/contact-sheet";
import { Loader2, Eye, EyeOff, ChevronDown, Globe } from "lucide-react";
import { useLang } from "@/lib/i18n";
import skyBg from "@assets/20260408_191813_1775839627189.jpg";
import serviceAgent from "@assets/service_p1_1775839314312.png";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { lang, setLang, t } = useLang();
  const tr = t.register;

  const registerSchema = z.object({
    phone: z.string().min(8, tr.invalidPhone),
    country: z.string().min(2, tr.selectCountry),
    password: z.string().min(6, tr.minPassword),
    confirmPassword: z.string().min(1, lang === "fr" ? "Confirmez le mot de passe" : "Confirm your password"),
    invitationCode: z.string().optional(),
  }).refine(d => d.password === d.confirmPassword, {
    message: lang === "fr" ? "Les mots de passe ne correspondent pas" : "Passwords do not match",
    path: ["confirmPassword"],
  });
  type RegisterForm = z.infer<typeof registerSchema>;

  useEffect(() => { document.title = tr.title; }, [tr.title]);
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const params = new URLSearchParams(searchString);
  const refCode = params.get("start") || params.get("money") || params.get("reg") || params.get("ic") || "";

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "",
      country: "PH",
      password: "",
      confirmPassword: "",
      invitationCode: refCode,
    },
  });

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    try {
      await register({
        fullName: `User_${data.phone}`,
        phone: data.phone,
        country: data.country,
        password: data.password,
        invitationCode: data.invitationCode,
      });
      toast({ title: tr.successTitle, description: tr.successDesc });
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

        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: "white", fontSize: 32, fontWeight: 800, margin: 0, textShadow: "0 1px 8px rgba(0,0,0,0.2)" }}>
            {lang === "fr" ? "Inscription" : "Register"}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>

          {/* Phone — country fixed to PH (+63), no selector */}
          <div>
            <div style={inputStyle}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#374151", paddingLeft: 16, paddingRight: 10, height: "100%", display: "flex", alignItems: "center", gap: 2, borderRight: "1.5px solid #e5e7eb", whiteSpace: "nowrap" }}>
                +63
              </span>
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
                placeholder={lang === "fr" ? "Mot de passe" : tr.passwordPlaceholder}
                data-testid="input-password"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", paddingLeft: 16, paddingRight: 12, fontSize: 15, color: "#111827" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} data-testid="button-toggle-password"
                style={{ paddingRight: 16, paddingLeft: 8, color: "#9ca3af", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p style={{ fontSize: 12, color: "#fff", marginTop: 4, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{form.formState.errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <div style={inputStyle}>
              <input
                {...form.register("confirmPassword")}
                type={showConfirm ? "text" : "password"}
                placeholder={lang === "fr" ? "Confirmer le mot de passe" : "Confirm password"}
                data-testid="input-confirm-password"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", paddingLeft: 16, paddingRight: 12, fontSize: 15, color: "#111827" }}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} data-testid="button-toggle-confirm"
                style={{ paddingRight: 16, paddingLeft: 8, color: "#9ca3af", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p style={{ fontSize: 12, color: "#fff", marginTop: 4, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Invitation Code */}
          <div>
            <div style={inputStyle}>
              <input
                {...form.register("invitationCode")}
                type="text"
                placeholder={tr.invitePlaceholder}
                data-testid="input-invitation-code"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", paddingLeft: 16, paddingRight: 14, fontSize: 15, color: "#111827" }}
              />
            </div>
          </div>

          <input type="hidden" {...form.register("country")} />

          {/* Register button */}
          <button
            type="submit"
            disabled={isLoading}
            data-testid="button-register"
            style={{ width: "100%", height: 54, borderRadius: 999, background: "#111111", color: "white", fontWeight: 700, fontSize: 17, border: "none", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.75 : 1, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {isLoading ? <><Loader2 size={20} className="animate-spin" />{tr.loading}</> : (lang === "fr" ? "S'inscrire" : tr.registerBtn)}
          </button>

          {/* Go to login */}
          <p style={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 }}>
            {lang === "fr" ? "Vous avez déjà un compte ?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              data-testid="button-goto-login"
              style={{ background: "transparent", border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "underline", padding: 0 }}
            >
              {lang === "fr" ? "Se connecter" : tr.loginBtn}
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

      <ContactSheet open={showContact} onClose={() => setShowContact(false)} />
    </div>
  );
}
