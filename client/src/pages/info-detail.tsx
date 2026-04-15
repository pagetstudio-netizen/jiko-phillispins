import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Loader2 } from "lucide-react";
import type { InfoArticle } from "@shared/schema";
import { useLang } from "@/lib/i18n";

function renderArticleBody(content: string, extraImages: string[]) {
  // Split content by "---" on its own line to create sections
  const sections = content
    .split(/\n?---\n?/)
    .map((s) => s.trim())
    .filter(Boolean);

  const blocks: Array<{ type: "text"; value: string } | { type: "image"; value: string }> = [];
  const maxLen = Math.max(sections.length, extraImages.length);

  for (let i = 0; i < maxLen; i++) {
    if (sections[i]) blocks.push({ type: "text", value: sections[i] });
    if (extraImages[i]) blocks.push({ type: "image", value: extraImages[i] });
  }

  return blocks;
}

export default function InfoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = useLang();
  const tr = t.info;

  const { data: article, isLoading } = useQuery<InfoArticle>({
    queryKey: ["/api/info-articles", id],
    queryFn: async () => {
      const res = await fetch(`/api/info-articles/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error(tr.notFound);
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10"
        style={{ background: "linear-gradient(90deg, #3db51d 0%, #2a8d13 100%)" }}
      >
        <button
          onClick={() => navigate("/info")}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.2)" }}
          data-testid="button-back"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="flex-1 text-center text-white font-bold text-base pr-8 truncate">
          {isLoading ? tr.loading : article?.title || "Article"}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#3db51d" }} />
        </div>
      ) : !article ? (
        <div className="flex justify-center py-20">
          <p className="text-gray-500">{tr.notFound}</p>
        </div>
      ) : (
        <div className="pb-12">
          {/* Cover image — full width, no padding */}
          <div>
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full object-cover"
              style={{ maxHeight: 280 }}
            />
          </div>

          {/* Date */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-gray-400 text-xs">
              {new Date(article.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Interleaved content: text sections + images */}
          {article.content || (article.extraImages && article.extraImages.length > 0) ? (
            <div>
              {renderArticleBody(
                article.content || "",
                article.extraImages || []
              ).map((block, i) =>
                block.type === "text" ? (
                  <div key={i} className="px-4 py-3">
                    <p
                      className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ textAlign: "justify" }}
                    >
                      {block.value}
                    </p>
                  </div>
                ) : (
                  <div key={i} className="py-3">
                    <img
                      src={block.value}
                      alt={`Image ${i}`}
                      className="w-full object-cover"
                      style={{ maxHeight: 340 }}
                    />
                  </div>
                )
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
