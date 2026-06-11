import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/lib/i18n";
import { useUserCurrency } from "@/lib/useUserCurrency";

const PRODUCTS = [
  { vip: "01", name: "Rouleau Compacteur",    price: 3000,   daily: 400,    days: 80 },
  { vip: "02", name: "Chargeuse-Pelleteuse",  price: 7000,   daily: 1000,   days: 80 },
  { vip: "03", name: "Pelleteuse Hydraulique",price: 12000,  daily: 1600,   days: 80 },
  { vip: "04", name: "Camion Bétonnière",     price: 20000,  daily: 3500,   days: 80 },
  { vip: "05", name: "Camion Benne",          price: 35000,  daily: 5000,   days: 80 },
  { vip: "06", name: "Grue à Tour",           price: 50000,  daily: 8000,   days: 80 },
  { vip: "07", name: "Bulldozer",             price: 75000,  daily: 12000,  days: 80 },
  { vip: "08", name: "Finisseur de Chaussée", price: 100000, daily: 18000,  days: 80 },
  { vip: "09", name: "Foreuse",               price: 200000, daily: 40000,  days: 80 },
  { vip: "10", name: "Tunnelier",             price: 400000, daily: 100000, days: 80 },
];

export default function RulesPage() {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const fr = lang === "fr";
  const { fmt } = useUserCurrency();
  useEffect(() => { document.title = "Règlement | EIFFAGE"; }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "#ffffff" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px", paddingTop: 48 }}>
        <button
          data-testid="button-back"
          onClick={() => window.history.length > 1 ? window.history.back() : navigate("/account")}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
        >
          <ChevronLeft style={{ width: 24, height: 24, color: "#fff" }} />
        </button>
        <h1 style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16, color: "#fff", marginRight: 32 }}>
          Réglementation
        </h1>
      </div>

      <div style={{ padding: "0 16px 48px" }}>

        {/* Product table banner */}
        <div style={{ background: "#111", borderRadius: 12, overflow: "hidden", marginBottom: 24, border: "1px solid #222" }}>
          {/* Banner header */}
          <div style={{ background: "#1a1a1a", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #333" }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: "#e07020", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff" }}>N</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#fff", letterSpacing: 0.5 }}>
                GAGNEZ PLUS AVEC EIFFAGE
              </div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>
                Investissez intelligemment, gagnez quotidiennement !
              </div>
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px 60px", gap: 4, padding: "8px 10px", background: "#222", fontSize: 9, fontWeight: 700, color: "#aaa", textTransform: "uppercase" }}>
            <span>PRODUIT</span>
            <span></span>
            <span style={{ textAlign: "right" }}>PRIX</span>
            <span style={{ textAlign: "right" }}>QUOTIDIEN</span>
            <span style={{ textAlign: "right" }}>JOURS</span>
          </div>

          {/* Table rows */}
          {PRODUCTS.map((p, i) => (
            <div
              key={p.vip}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr 80px 80px 60px",
                gap: 4,
                padding: "8px 10px",
                borderTop: "1px solid #222",
                background: i % 2 === 0 ? "#111" : "#141414",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: "#e07020" }}>{p.vip}</span>
              <span style={{ fontSize: 10, color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              <span style={{ fontSize: 10, color: "#fff", textAlign: "right" }}>{fmt(p.price)}</span>
              <span style={{ fontSize: 10, color: "#4caf50", textAlign: "right", fontWeight: 700 }}>{fmt(p.daily)}</span>
              <span style={{ fontSize: 10, color: "#aaa", textAlign: "right" }}>{p.days}d</span>
            </div>
          ))}

          {/* Footer badges */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, background: "#333", margin: "0 0 0 0" }}>
            {[
              { icon: "📈", label: "Revenus quotidiens" },
              { icon: "🔒", label: "Investissement sécurisé" },
              { icon: "💰", label: "Revenus élevés" },
              { icon: "⏱", label: "Durée 80 jours" },
            ].map((b, i) => (
              <div key={i} style={{ background: "#1a1a1a", padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontSize: 14 }}>{b.icon}</div>
                <div style={{ fontSize: 8, color: "#aaa", marginTop: 2, lineHeight: 1.3 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <p style={{ color: "#cccccc", fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
          EIFFAGE est une plateforme d'investissement technologique mondiale spécialisée dans l'automatisation intelligente. Nous promouvons l'innovation numérique et le développement durable, afin d'offrir une meilleure expérience d'investissement à nos utilisateurs.
        </p>

        <p style={{ color: "#cccccc", fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
          Lorsqu'un ami que vous invitez s'inscrit et investit, vous recevez immédiatement une commission de 18 % sur son investissement. Lorsque les membres de votre équipe de deuxième niveau investissent, vous recevez une commission de 2 %. Lorsque les membres de votre équipe de troisième niveau investissent, vous recevez également une commission de 1 %. Dès que les membres de votre équipe investissent, la commission est immédiatement créditée sur votre compte et vous pouvez la retirer instantanément.
        </p>

        <div style={{ color: "#cccccc", fontSize: 13, lineHeight: 1.9 }}>
          <p>① Inscrivez-vous et recevez {fmt(500)}.</p>
          <p>② Recevez {fmt(5)} chaque jour avec le produit gratuit.</p>
          <p>③ Invitez des amis à investir et recevez instantanément une commission avantageuse de 18 %.</p>
        </div>

        {/* Rules sections */}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 20 }}>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: 14, color: "#e07020", borderLeft: "3px solid #e07020", paddingLeft: 10, marginBottom: 10 }}>
              1. Investissement
            </h2>
            <ul style={{ paddingLeft: 18, color: "#ccc", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              <li>Chaque utilisateur peut posséder plusieurs produits d'investissement simultanément.</li>
              <li>Les revenus sont générés quotidiennement et crédités sur votre solde toutes les 24 heures.</li>
              <li>Le cycle d'investissement est de 80 jours.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: 14, color: "#e07020", borderLeft: "3px solid #e07020", paddingLeft: 10, marginBottom: 10 }}>
              2. Dépôts et Retraits
            </h2>
            <ul style={{ paddingLeft: 18, color: "#ccc", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              <li>Le montant minimum de dépôt est de {fmt(3000)}.</li>
              <li>Le montant minimum de retrait est de {fmt(1500)}.</li>
              <li>Les frais de retrait sont de 18 %.</li>
              <li>Les retraits sont traités entre 9h et 17h les jours ouvrables.</li>
              <li>Limite d'1 retrait maximum par jour par utilisateur.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: 14, color: "#e07020", borderLeft: "3px solid #e07020", paddingLeft: 10, marginBottom: 10 }}>
              3. Système de Parrainage
            </h2>
            <ul style={{ paddingLeft: 18, color: "#ccc", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              <li>Commission de niveau 1 : 18 % sur l'investissement du filleul.</li>
              <li>Commission de niveau 2 : 2 % sur l'investissement.</li>
              <li>Commission de niveau 3 : 1 % sur l'investissement.</li>
              <li>Les activités frauduleuses ou la création de comptes multiples entraîneront la suspension du compte.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: 14, color: "#e07020", borderLeft: "3px solid #e07020", paddingLeft: 10, marginBottom: 10 }}>
              4. Sécurité
            </h2>
            <ul style={{ paddingLeft: 18, color: "#ccc", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              <li>Vous êtes responsable de la sécurité de votre mot de passe.</li>
              <li>Ne partagez jamais vos identifiants de connexion avec des tiers.</li>
              <li>Le service client officiel ne vous demandera jamais votre mot de passe.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
