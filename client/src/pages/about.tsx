import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-full bg-white">
      <header className="flex items-center px-4 py-3 border-b bg-white">
        <Link href="/account">
          <button className="p-1" data-testid="button-back">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-800 pr-6">A propos de nous</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "#3db51d" }}>Qui sommes-nous ?</h2>
          <p className="text-gray-600 leading-relaxed">
            Noviqra Ai est une plateforme d'investissement innovante basée sur l'intelligence artificielle, présente dans plus de 7 pays africains. Reconnue pour la performance et la fiabilité de ses solutions d'investissement, Noviqra Ai est un acteur incontournable de la finance numérique en Afrique.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Grâce à notre technologie IA de pointe et à notre réseau mondial, nous offrons à nos utilisateurs des opportunités uniques de générer des revenus quotidiens stables en participant à nos programmes d'investissement intelligents.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "#3db51d" }}>Notre héritage</h2>
          <p className="text-gray-600 leading-relaxed">
            Aujourd'hui, Noviqra Ai est présent dans de nombreux pays avec des milliers d'utilisateurs actifs et propose une large gamme de produits d'investissement haute performance, devenant ainsi une marque reconnue dans le secteur de la finance digitale africaine.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "#3db51d" }}>Sécurité et Fiabilité</h2>
          <p className="text-gray-600 leading-relaxed">
            La sécurité de vos fonds et la transparence de nos opérations sont nos priorités absolues. L'empreinte de Noviqra Ai dans le domaine de l'investissement numérique illustre parfaitement la capacité d'une entreprise à conjuguer qualité, innovation et stratégie de marque pérenne.
          </p>
        </div>
      </div>
    </div>
  );
}
