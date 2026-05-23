import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/lib/i18n";
import { useUserCurrency } from "@/lib/useUserCurrency";

const PRODUCTS = [
  { vip: "VIP1", name: "Nano AI Robot",    price: 500,      daily: 50,       days: 30 },
  { vip: "VIP2", name: "Smart AI Robot",   price: 2000,     daily: 200,      days: 30 },
  { vip: "VIP3", name: "Pro AI Robot",     price: 5000,     daily: 500,      days: 30 },
  { vip: "VIP4", name: "Elite AI Robot",   price: 10000,    daily: 1000,     days: 30 },
  { vip: "VIP5", name: "Premium AI Robot", price: 20000,    daily: 2000,     days: 30 },
  { vip: "VIP6", name: "Expert AI Robot",  price: 50000,    daily: 5000,     days: 30 },
  { vip: "VIP7", name: "Master AI Robot",  price: 100000,   daily: 10000,    days: 30 },
  { vip: "VIP8", name: "Ultra AI Robot",   price: 200000,   daily: 20000,    days: 30 },
];

export default function RulesPage() {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const fr = lang === "fr";
  const { fmt } = useUserCurrency();
  useEffect(() => { document.title = "Rules | Noviqra Ai"; }, []);

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
          {fr ? "Réglementation" : "Rules"}
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
                {fr ? "GAGNEZ PLUS AVEC NOVIQRA AI" : "EARN MORE WITH NOVIQRA AI"}
              </div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>
                {fr ? "Investissez intelligemment, gagnez quotidiennement !" : "Invest smart, earn daily!"}
              </div>
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px 60px", gap: 4, padding: "8px 10px", background: "#222", fontSize: 9, fontWeight: 700, color: "#aaa", textTransform: "uppercase" }}>
            <span>{fr ? "PRODUIT" : "PRODUCT"}</span>
            <span></span>
            <span style={{ textAlign: "right" }}>{fr ? "PRIX" : "PRICE"}</span>
            <span style={{ textAlign: "right" }}>{fr ? "QUOTIDIEN" : "DAILY"}</span>
            <span style={{ textAlign: "right" }}>{fr ? "JOURS" : "DAYS"}</span>
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
              { icon: "📈", label: fr ? "Revenus quotidiens" : "Daily income" },
              { icon: "🔒", label: fr ? "Investissement sécurisé" : "Secure investment" },
              { icon: "💰", label: fr ? "Revenus élevés" : "High returns" },
              { icon: "⏱", label: fr ? "Durée flexible" : "Flexible duration" },
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
          {fr
            ? "Noviqra Ai est une plateforme d'investissement technologique mondiale spécialisée dans l'automatisation intelligente. Nous promouvons l'innovation numérique et le développement durable, afin d'offrir une meilleure expérience d'investissement à nos utilisateurs."
            : "Noviqra Ai is a global technology investment platform specializing in intelligent automation. We promote digital innovation and sustainable development to offer a better investment experience to our users."}
        </p>

        <p style={{ color: "#cccccc", fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
          {fr
            ? "Lorsqu'un ami que vous invitez s'inscrit et investit, vous recevez immédiatement une commission de 20 % sur son investissement.\nLorsque les membres de votre équipe de deuxième niveau investissent, vous recevez une commission de 3 %.\nLorsque les membres de votre équipe de troisième niveau investissent, vous recevez également une commission de 2 %.\nDès que les membres de votre équipe investissent, la commission est immédiatement créditée sur votre compte et vous pouvez la retirer instantanément."
            : "When a friend you invite signs up and invests, you immediately receive a 20% commission on their investment.\nWhen second-level team members invest, you receive a 3% commission.\nWhen third-level team members invest, you also receive a 2% commission.\nAs soon as your team members invest, the commission is immediately credited to your account and you can withdraw it instantly."}
        </p>

        <div style={{ color: "#cccccc", fontSize: 13, lineHeight: 1.9 }}>
          <p>① {fr ? `Inscrivez-vous et recevez ${fmt(50)}.` : `Sign up and receive ${fmt(50)}.`}</p>
          <p>② {fr ? `Recevez ${fmt(5)} chaque jour avec le produit gratuit.` : `Receive ${fmt(5)} every day with the free product.`}</p>
          <p>③ {fr ? "Invitez des amis à investir et recevez instantanément une commission avantageuse de 20 %." : "Invite friends to invest and instantly receive an advantageous 20% commission."}</p>
        </div>

        {/* Rules sections */}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 20 }}>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: 14, color: "#e07020", borderLeft: "3px solid #e07020", paddingLeft: 10, marginBottom: 10 }}>
              1. {fr ? "Investissement" : "Investment"}
            </h2>
            <ul style={{ paddingLeft: 18, color: "#ccc", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              <li>{fr ? "Chaque utilisateur peut posséder plusieurs produits d'investissement simultanément." : "Each user can own several investment products simultaneously."}</li>
              <li>{fr ? "Les revenus sont générés quotidiennement et crédités sur votre solde toutes les 24 heures." : "Earnings are generated daily and credited to your balance every 24 hours."}</li>
              <li>{fr ? "Le cycle d'investissement standard est de 30 jours." : "The standard investment cycle is 30 days."}</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: 14, color: "#e07020", borderLeft: "3px solid #e07020", paddingLeft: 10, marginBottom: 10 }}>
              2. {fr ? "Dépôts et Retraits" : "Deposits & Withdrawals"}
            </h2>
            <ul style={{ paddingLeft: 18, color: "#ccc", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              <li>{fr ? `Le montant minimum de dépôt est de ${fmt(500)}.` : `The minimum deposit amount is ${fmt(500)}.`}</li>
              <li>{fr ? `Le montant minimum de retrait est de ${fmt(100)}.` : `The minimum withdrawal amount is ${fmt(100)}.`}</li>
              <li>{fr ? "Les frais de retrait sont de 0 %." : "Withdrawal fees are 0%."}</li>
              <li>{fr ? "Les retraits sont traités entre 9h et 18h les jours ouvrables." : "Withdrawals are processed between 9am and 6pm on business days."}</li>
              <li>{fr ? "Limite de 2 retraits maximum par jour par utilisateur." : "Maximum 2 withdrawals per day per user."}</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: 14, color: "#e07020", borderLeft: "3px solid #e07020", paddingLeft: 10, marginBottom: 10 }}>
              3. {fr ? "Système de Parrainage" : "Referral System"}
            </h2>
            <ul style={{ paddingLeft: 18, color: "#ccc", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              <li>{fr ? "Commission de niveau 1 : 20 % sur l'investissement du filleul." : "Level 1 commission: 20% on the referral's investment."}</li>
              <li>{fr ? "Commission de niveau 2 : 3 % sur l'investissement." : "Level 2 commission: 3% on the investment."}</li>
              <li>{fr ? "Commission de niveau 3 : 2 % sur l'investissement." : "Level 3 commission: 2% on the investment."}</li>
              <li>{fr ? "Les activités frauduleuses ou la création de comptes multiples entraîneront la suspension du compte." : "Fraudulent activities or creating multiple accounts will result in account suspension."}</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: 14, color: "#e07020", borderLeft: "3px solid #e07020", paddingLeft: 10, marginBottom: 10 }}>
              4. {fr ? "Sécurité" : "Security"}
            </h2>
            <ul style={{ paddingLeft: 18, color: "#ccc", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              <li>{fr ? "Vous êtes responsable de la sécurité de votre mot de passe." : "You are responsible for the security of your password."}</li>
              <li>{fr ? "Ne partagez jamais vos identifiants de connexion avec des tiers." : "Never share your login credentials with third parties."}</li>
              <li>{fr ? "Le service client officiel ne vous demandera jamais votre mot de passe." : "Official customer service will never ask for your password."}</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
