import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Link } from "wouter";
import { SiTelegram } from "react-icons/si";
import serviceAgent1 from "@assets/images_(20)_1773474932054.jpeg";
import serviceAgent2 from "@assets/images_(21)_1773474931992.jpeg";

export default function ServicePage() {
  useEffect(() => { document.title = "Service client | Noviqra Ai"; }, []);
  const { data: settings } = useQuery<{ supportLink: string; support2Link: string; channelLink: string; groupLink: string }>({
    queryKey: ["/api/settings/links"],
  });

  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-100">

      {/* Red header */}
      <div style={{ background: "linear-gradient(135deg, #3db51d, #2a8d13)" }}>
        <div className="flex items-center px-4 py-4">
          <Link href="/account">
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20" data-testid="button-back">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <h1 className="flex-1 text-center text-white font-bold text-base mr-9">Service client</h1>
        </div>

        {/* Hours banner */}
        <div className="flex items-center justify-center gap-2 pb-5">
          <Clock className="w-4 h-4 text-white/80" />
          <p className="text-white/90 text-sm font-medium">Disponible de 09h00 à 20h00</p>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 px-4 pt-4 pb-24 space-y-3">

        {/* Service client en ligne 1 */}
        <button
          onClick={() => openLink(settings?.supportLink || "https://t.me/wendysappgroup")}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 border border-gray-100"
          data-testid="button-support-link"
        >
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-[#3db51d]/20">
            <img src={serviceAgent1} alt="Service client 1" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-gray-800 text-sm">Service client en ligne 1</p>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              Les heures du service client en ligne sont de 10h00 à 18h00.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        {/* Service client en ligne 2 */}
        <button
          onClick={() => openLink(settings?.support2Link || "https://t.me/wendysappgroup")}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 border border-gray-100"
          data-testid="button-support2-link"
        >
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-[#3db51d]/20">
            <img src={serviceAgent2} alt="Service client 2" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-gray-800 text-sm">Service client en ligne 2</p>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              Les heures du service client en ligne sont de 10h00 à 18h00.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        {/* Canal Telegram */}
        <button
          onClick={() => openLink(settings?.channelLink || "https://t.me/wendysappgroup")}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 border border-gray-100"
          data-testid="button-channel-link"
        >
          <div className="w-14 h-14 rounded-xl bg-[#229ED9] flex items-center justify-center flex-shrink-0">
            <SiTelegram className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-gray-800 text-sm">Canal Telegram</p>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              Dernières nouvelles et annonces, nouvelles informations sur les avantages !
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        {/* Groupe Telegram */}
        <button
          onClick={() => openLink(settings?.groupLink || "https://t.me/wendysappgroup")}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 border border-gray-100"
          data-testid="button-group-link"
        >
          <div className="w-14 h-14 rounded-xl bg-[#229ED9] flex items-center justify-center flex-shrink-0">
            <SiTelegram className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-gray-800 text-sm">Groupe Telegram</p>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              Rejoignez notre communauté et échangez avec nos membres !
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 border-l-4 border-l-[#3db51d]">
          <p className="text-[#3db51d] font-bold text-sm mb-3">Instructions</p>
          <div className="space-y-2.5 text-xs text-gray-500 leading-relaxed">
            <p>1. Si vous ne parvenez pas à ouvrir l'application Telegram officielle, veuillez utiliser un autre navigateur.</p>
            <p>2. Pour toute question, contactez notre service client en ligne. Ils répondront à toutes vos questions.</p>
            <p>3. Si notre service client ne répond pas immédiatement, veuillez patienter. Nous recevons un grand nombre de messages et vous répondrons dès que possible.</p>
            <p>4. Pour gagner plus d'argent, rejoignez notre chaîne Telegram officielle !</p>
          </div>
        </div>
      </div>
    </div>
  );
}
