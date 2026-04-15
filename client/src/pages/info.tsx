import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import type { InfoArticle } from "@shared/schema";
import { useLang } from "@/lib/i18n";

export default function InfoPage() {
  const [, navigate] = useLocation();
  const { t } = useLang();
  const tr = t.info;

  const { data: articles, isLoading } = useQuery<InfoArticle[]>({
    queryKey: ["/api/info-articles"],
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f2f2f7" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10"
        style={{ background: "linear-gradient(90deg, #3db51d 0%, #2a8d13 100%)" }}
      >
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.2)" }}
          data-testid="button-back"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="flex-1 text-center text-white font-bold text-base pr-8">
          {tr.header}
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ height: 220, background: "#e5e5ea" }} />
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          articles.map((article) => (
            <button
              key={article.id}
              onClick={() => navigate(`/info/${article.id}`)}
              className="w-full text-left rounded-2xl overflow-hidden shadow-sm"
              data-testid={`card-article-${article.id}`}
            >
              <div className="relative" style={{ height: 220 }}>
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute bottom-0 left-0 right-0 px-4 py-3"
                  style={{ background: "linear-gradient(0deg, rgba(0,80,180,0.92) 0%, rgba(0,80,180,0.5) 80%, transparent 100%)" }}
                >
                  <p className="text-white font-bold text-sm uppercase tracking-wide">
                    {article.title}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#e5e5ea" }}>
              <ChevronLeft className="w-8 h-8 text-gray-400" style={{ transform: "rotate(180deg)" }} />
            </div>
            <p className="text-gray-500 text-sm text-center">{tr.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}
