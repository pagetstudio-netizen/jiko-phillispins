import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import ContactSheet from "@/components/contact-sheet";
import { Loader2, Eye, EyeOff, Phone, Lock, UserPlus, ChevronDown, Globe } from "lucide-react";
import { useLang, translations } from "@/lib/i18n";
import jinkoBanner from "@assets/20260408_191813_1775839627189.jpg";
import serviceAgent from "@assets/service_p1_1775839314312.png";

const GREEN = "#3db51d";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { lang, setLang, t } = useLang();
  const tr = t.register;

  const registerSchema = z.object({
    phone: z.string().min(8, tr.invalidPhone),
    country: z.string().min(2, tr.selectCountry),
    password: z.string().min(6, tr.minPassword),
    invitationCode: z.string().optional(),
  });
  type RegisterForm = z.infer<typeof registerSchema>;

  useEffect(() => { document.title = tr.title; }, [tr.title]);
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const params = new URLSearchParams(searchString);
  const refCode = params.get("start") || params.get("money") || params.get("reg") || "";

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "",
      country: "PH",
      password: "",
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
    setPos({
      x: startRef.current.bx + (e.clientX - startRef.current.mx),
      y: startRef.current.by + (e.clientY - startRef.current.my),
    });
  }
  function onPointerUp() {
    dragging.current = false;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080d18", maxWidth: 480, margin: "0 auto", position: "relative", overflow: "hidden" }}>

      <img
        src={jinkoBanner}
        alt="Jinko Solar"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "auto", display: "block", zIndex: 0 }}
      />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        <img
          src={jinkoBanner}
          alt=""
          aria-hidden="true"
          style={{ width: "100%", height: "auto", visibility: "hidden", display: "block", flexShrink: 0 }}
        />

        <div style={{ flex: 1, background: "white", borderRadius: "16px 16px 0 0", marginTop: -14, padding: "28px 20px 20px" }}>

          <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Phone */}
            <div>
              <div style={{ background: "#f9fafb", borderRadius: 14, height: 56, display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", overflow: "hidden" }}>
                <div style={{ paddingLeft: 14, paddingRight: 10, color: "#9ca3af", display: "flex", alignItems: "center" }}>
                  <Phone size={18} />
                </div>
                <span
                  data-testid="label-country-prefix"
                  style={{ fontSize: 14, fontWeight: 700, color: "#374151", paddingRight: 10, height: "100%", display: "flex", alignItems: "center", gap: 2, borderRight: "1.5px solid #e5e7eb" }}
                >
                  +63
                </span>
                <input
                  {...form.register("phone")}
                  type="tel"
                  placeholder={tr.phonePlaceholder}
                  data-testid="input-phone"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", paddingLeft: 12, paddingRight: 12, fontSize: 14, color: "#111827" }}
                />
              </div>
              {form.formState.errors.phone && (
                <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{form.formState.errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div style={{ background: "#f9fafb", borderRadius: 14, height: 56, display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", overflow: "hidden" }}>
                <div style={{ paddingLeft: 14, paddingRight: 10, color: "#9ca3af", display: "flex", alignItems: "center" }}>
                  <Lock size={18} />
                </div>
                <input
                  {...form.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder={tr.passwordPlaceholder}
                  data-testid="input-password"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#111827" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                  style={{ paddingRight: 14, paddingLeft: 8, color: "#9ca3af", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Code invitation */}
            <div>
              <div style={{ background: "#f9fafb", borderRadius: 14, height: 56, display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", overflow: "hidden" }}>
                <div style={{ paddingLeft: 14, paddingRight: 10, color: "#9ca3af", display: "flex", alignItems: "center" }}>
                  <UserPlus size={18} />
                </div>
                <input
                  {...form.register("invitationCode")}
                  type="text"
                  placeholder={tr.invitePlaceholder}
                  data-testid="input-invitation-code"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", paddingLeft: 4, paddingRight: 12, fontSize: 14, color: "#111827" }}
                />
              </div>
            </div>

            <input type="hidden" {...form.register("country")} />

            {/* Register button */}
            <button
              type="submit"
              disabled={isLoading}
              data-testid="button-register"
              style={{ width: "100%", height: 52, borderRadius: 28, background: GREEN, color: "white", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer", opacity: isLoading ? 0.72 : 1, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 18px rgba(61,181,29,0.35)" }}
            >
              {isLoading ? <><Loader2 size={20} className="animate-spin" />{tr.loading}</> : tr.registerBtn}
            </button>

            {/* Login button */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              data-testid="button-goto-login"
              style={{ width: "100%", height: 52, borderRadius: 28, background: "white", color: "#e53935", fontWeight: 700, fontSize: 16, border: "2px solid #e53935", cursor: "pointer" }}
            >
              {tr.loginBtn}
            </button>

          </form>

          {/* Language Switcher */}
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              data-testid="button-lang-switcher"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3f4f6", border: "1.5px solid #e5e7eb", borderRadius: 999, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}
            >
              <Globe size={16} style={{ color: "#6b7280" }} />
              {lang === "en" ? "🇬🇧 English" : "🇫🇷 Français"}
              <ChevronDown size={13} style={{ color: "#9ca3af" }} />
            </button>
            {showLangMenu && (
              <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", background: "white", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", overflow: "hidden", zIndex: 10, minWidth: 150 }}>
                <button
                  type="button"
                  onClick={() => { setLang("en"); setShowLangMenu(false); }}
                  data-testid="button-lang-en"
                  style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: lang === "en" ? "#f0fdf4" : "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: lang === "en" ? 700 : 400, color: lang === "en" ? GREEN : "#374151", display: "flex", alignItems: "center", gap: 8 }}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  onClick={() => { setLang("fr"); setShowLangMenu(false); }}
                  data-testid="button-lang-fr"
                  style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: lang === "fr" ? "#f0fdf4" : "white", border: "none", borderTop: "1px solid #f3f4f6", cursor: "pointer", fontSize: 14, fontWeight: lang === "fr" ? 700 : 400, color: lang === "fr" ? GREEN : "#374151", display: "flex", alignItems: "center", gap: 8 }}
                >
                  🇫🇷 Français
                </button>
              </div>
            )}
          </div>

          <div style={{ height: 40 }} />
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
        <img
          src={serviceAgent}
          alt="Contact us"
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(0.6px) brightness(1.05)", pointerEvents: "none" }}
        />
      </button>

      <ContactSheet open={showContact} onClose={() => setShowContact(false)} />
    </div>
  );
}
