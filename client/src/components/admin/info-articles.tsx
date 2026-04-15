import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Loader2, ImagePlus } from "lucide-react";
import type { InfoArticle } from "@shared/schema";

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

export default function AdminInfoArticles() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editArticle, setEditArticle] = useState<InfoArticle | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [extraImages, setExtraImages] = useState<string[]>([]);

  const coverRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  const { data: articles, isLoading } = useQuery<InfoArticle[]>({
    queryKey: ["/api/info-articles"],
  });

  function resetForm() {
    setTitle(""); setContent(""); setCoverImage(""); setExtraImages([]);
    setEditArticle(null);
  }

  function openCreate() { resetForm(); setShowForm(true); }

  function openEdit(a: InfoArticle) {
    setTitle(a.title); setContent(a.content); setCoverImage(a.coverImage);
    setExtraImages(a.extraImages || []); setEditArticle(a); setShowForm(true);
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setCoverImage(b64);
  }

  async function handleExtraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const b64s = await Promise.all(files.map(toBase64));
    setExtraImages(prev => [...prev, ...b64s]);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !coverImage) throw new Error("Title and cover image required");
      const body = { title: title.trim(), content: content.trim(), coverImage, extraImages };
      if (editArticle) {
        return apiRequest("PUT", `/api/admin/info-articles/${editArticle.id}`, body);
      }
      return apiRequest("POST", "/api/admin/info-articles", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/info-articles"] });
      setShowForm(false); resetForm();
      toast({ title: editArticle ? "Article updated" : "Article published" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/info-articles/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/info-articles"] });
      toast({ title: "Article deleted" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">News Articles</h2>
        <Button onClick={openCreate} size="sm" data-testid="button-create-article">
          <Plus className="w-4 h-4 mr-1" /> Publish
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !articles?.length ? (
        <p className="text-center text-gray-400 py-8 text-sm">No articles published.</p>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Card key={a.id} data-testid={`card-info-${a.id}`}>
              <CardContent className="p-3 flex gap-3 items-start">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <img src={a.coverImage} alt={a.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{a.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{a.content || "No content"}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(a)} data-testid={`button-edit-${a.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(a.id)}
                    disabled={deleteMutation.isPending} data-testid={`button-delete-${a.id}`}>
                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editArticle ? "Edit Article" : "Publish Article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Article title" className="mt-1" data-testid="input-title" />
            </div>

            <div>
              <label className="text-sm font-medium">Cover Image *</label>
              <div className="mt-1">
                {coverImage ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ height: 140 }}>
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <button onClick={() => setCoverImage("")}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <button onClick={() => coverRef.current?.click()}
                    className="w-full rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 py-8 text-gray-400"
                    data-testid="button-upload-cover">
                    <ImagePlus className="w-8 h-8" />
                    <span className="text-sm">Choose an image</span>
                  </button>
                )}
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={"Write section 1...\n---\nWrite section 2...\n---\nWrite section 3..."}
                rows={7}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                data-testid="textarea-content"
              />
              <p className="text-xs text-gray-400 mt-1">
                Use <span className="font-mono bg-gray-100 px-1 rounded">---</span> on its own line to separate sections. Each extra image is inserted after the corresponding section.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Extra Images (between sections)</label>
              <div className="mt-1 space-y-2">
                {extraImages.map((img, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden" style={{ height: 100 }}>
                    <img src={img} alt={`Extra ${i}`} className="w-full h-full object-cover" />
                    <button onClick={() => setExtraImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">✕</button>
                  </div>
                ))}
                <button onClick={() => extraRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 py-3 text-gray-400 text-sm"
                  data-testid="button-add-image">
                  <ImagePlus className="w-5 h-5" /> Add images
                </button>
                <input ref={extraRef} type="file" accept="image/*" multiple className="hidden" onChange={handleExtraChange} />
              </div>
            </div>

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full" data-testid="button-save-article">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editArticle ? "Save" : "Publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
