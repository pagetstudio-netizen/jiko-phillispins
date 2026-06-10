import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/lib/i18n";

export default function AboutPage() {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const fr = lang === "fr";
  useEffect(() => { document.title = "À propos | EIFFAGE"; }, []);

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
          {fr ? "À propos de nous" : "About us"}
        </h1>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 20px 48px", lineHeight: 1.75 }}>

        <p style={{ color: "#cccccc", fontSize: 14, marginBottom: 20 }}>
          {fr
            ? "EIFFAGE est une entreprise technologique mondiale spécialisée dans l'automatisation industrielle intelligente et l'intelligence artificielle. Portant la devise « Automatisation Intelligente. Solutions Sans Limites. », EIFFAGE s'engage à promouvoir la transformation numérique et le développement durable grâce à l'innovation technologique et à des robots de haute performance, offrant ainsi des opportunités de revenus quotidiens stables à ses utilisateurs."
            : "EIFFAGE is a global technology company specializing in intelligent industrial automation and artificial intelligence. With the motto \"Intelligent Automation. Limitless Solutions.\", EIFFAGE is committed to promoting digital transformation and sustainable development through technological innovation and high-performance robots, offering users stable daily income opportunities."}
        </p>

        <p style={{ color: "#cccccc", fontSize: 14, marginBottom: 20 }}>
          {fr
            ? "EIFFAGE se concentre sur le segment des robots industriels intelligents, avec une gamme de produits allant du Nano AI Robot à l'Ultra AI Robot. Ses concepts de design avant-gardistes, ses performances supérieures et ses fonctionnalités intelligentes lui ont valu une reconnaissance internationale. L'entreprise investit continuellement dans la R&D dans des domaines clés tels que la robotique, la conduite autonome, les systèmes de contrôle intelligent et la technologie de l'IA embarquée."
            : "EIFFAGE focuses on the intelligent industrial robot segment, with a product range from the Nano AI Robot to the Ultra AI Robot. Its cutting-edge design concepts, superior performance and intelligent features have earned it international recognition. The company continuously invests in R&D in key areas such as robotics, autonomous control, intelligent systems and embedded AI technology."}
        </p>

        <p style={{ color: "#cccccc", fontSize: 14, marginBottom: 20 }}>
          {fr
            ? "En matière d'investissement, EIFFAGE a été pionnière dans le développement d'un système de revenus passifs basé sur des robots industriels qu'elle perfectionne constamment. Elle a mis en place un réseau d'investisseurs à travers l'Afrique francophone pour offrir aux utilisateurs une expérience d'investissement efficace et pratique, réduisant ainsi l'écart d'accès aux opportunités financières mondiales."
            : "In terms of investment, EIFFAGE has been a pioneer in developing a passive income system based on industrial robots that it constantly improves. It has built an investor network across French-speaking Africa to offer users an efficient and practical investment experience, bridging the gap in access to global financial opportunities."}
        </p>

        <p style={{ color: "#cccccc", fontSize: 14, marginBottom: 20 }}>
          {fr
            ? "EIFFAGE accorde une grande importance au service client et au développement de sa communauté, créant un écosystème complet intégrant services d'investissement, parrainage, missions et services liés à la finance digitale. À travers ses canaux Telegram et ses plateformes communautaires en ligne, EIFFAGE a tissé des liens étroits et durables avec ses utilisateurs, forgeant ainsi une véritable communauté d'investisseurs."
            : "EIFFAGE places great importance on customer service and community development, creating a complete ecosystem integrating investment services, referrals, missions, and digital finance services. Through its Telegram channels and online community platforms, EIFFAGE has built close and lasting bonds with its users, forging a true investor community."}
        </p>

        <p style={{ color: "#cccccc", fontSize: 14, marginBottom: 20 }}>
          {fr
            ? "Disponible dans 7 pays d'Afrique francophone (Cameroun, Burkina Faso, Niger, Mali, Gabon, RDC, Congo Brazzaville), EIFFAGE travaille avec les principaux opérateurs de mobile money (Orange Money, MTN Mobile Money, Airtel Money, Moov Money, etc.) afin d'offrir des solutions de dépôt et de retrait fluides et adaptées aux marchés locaux."
            : "Available in 7 French-speaking African countries (Cameroon, Burkina Faso, Niger, Mali, Gabon, DRC, Congo Brazzaville), EIFFAGE works with the leading mobile money operators (Orange Money, MTN Mobile Money, Airtel Money, Moov Money, etc.) to offer smooth deposit and withdrawal solutions adapted to local markets."}
        </p>

        <p style={{ color: "#cccccc", fontSize: 14 }}>
          {fr
            ? "La sécurité de vos fonds et la transparence de nos opérations sont nos priorités absolues. L'empreinte d'EIFFAGE dans le domaine de l'investissement numérique illustre parfaitement la capacité d'une entreprise à conjuguer qualité, innovation et stratégie de marque pérenne."
            : "The security of your funds and the transparency of our operations are our absolute priorities. EIFFAGE's footprint in the digital investment space perfectly illustrates a company's ability to combine quality, innovation and lasting brand strategy."}
        </p>

      </div>
    </div>
  );
}
