import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminCurrency } from "@/lib/useAdminCurrency";
import { Edit, Loader2, TrendingUp, Plus, Trash2, AlertCircle } from "lucide-react";
import type { Product } from "@shared/schema";

const productSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  price: z.string().min(1, "Prix requis"),
  dailyEarnings: z.string().min(1, "Gains journaliers requis"),
  cycleDays: z.string().min(1, "Durée requise"),
  imageUrl: z.string().optional(),
  sortOrder: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

const QKEY = ["/api/admin/products/all"];

const defaultVals: ProductForm = {
  name: "",
  price: "",
  dailyEarnings: "",
  cycleDays: "80",
  imageUrl: "",
  sortOrder: "0",
};

export default function AdminProducts() {
  const { toast } = useToast();
  const { formatAmount } = useAdminCurrency();

  // null = closed, -1 = create mode, id = edit mode
  const [dialogProductId, setDialogProductId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({ queryKey: QKEY });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultVals,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QKEY });

  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const res = await apiRequest("POST", "/api/admin/products", {
        name: data.name,
        price: parseInt(data.price),
        dailyEarnings: parseInt(data.dailyEarnings),
        cycleDays: parseInt(data.cycleDays),
        imageUrl: data.imageUrl || null,
        sortOrder: parseInt(data.sortOrder || "0"),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erreur");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Produit créé !" });
      setDialogProductId(null);
      form.reset(defaultVals);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductForm }) => {
      const price = parseInt(data.price);
      const dailyEarnings = parseInt(data.dailyEarnings);
      const cycleDays = parseInt(data.cycleDays);
      const res = await apiRequest("PATCH", `/api/admin/products/${id}`, {
        name: data.name,
        price,
        dailyEarnings,
        cycleDays,
        totalReturn: dailyEarnings * cycleDays,
        imageUrl: data.imageUrl || null,
        sortOrder: parseInt(data.sortOrder || "0"),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erreur");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Produit mis à jour !" });
      setDialogProductId(null);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/products/${id}`, { isActive });
      if (!res.ok) throw new Error((await res.json()).message || "Erreur");
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/products/${id}`, {});
      if (!res.ok) throw new Error((await res.json()).message || "Erreur");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Produit supprimé" });
      setDeleteConfirmId(null);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    form.reset(defaultVals);
    setDialogProductId(-1);
  };

  const openEdit = (product: Product) => {
    form.reset({
      name: product.name,
      price: product.price.toString(),
      dailyEarnings: product.dailyEarnings.toString(),
      cycleDays: product.cycleDays.toString(),
      imageUrl: product.imageUrl || "",
      sortOrder: product.sortOrder.toString(),
    });
    setDialogProductId(product.id);
  };

  const handleSubmit = (data: ProductForm) => {
    if (dialogProductId === -1) {
      createMutation.mutate(data);
    } else if (dialogProductId !== null) {
      updateMutation.mutate({ id: dialogProductId, data });
    }
  };

  const isCreating = dialogProductId === -1;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Preview computed total return
  const watchedDaily = parseInt(form.watch("dailyEarnings") || "0");
  const watchedCycle = parseInt(form.watch("cycleDays") || "0");
  const previewTotal = isNaN(watchedDaily * watchedCycle) ? 0 : watchedDaily * watchedCycle;

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products?.length ?? 0} produit(s)</p>
        <Button onClick={openCreate} data-testid="button-create-product" size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Nouveau produit
        </Button>
      </div>

      {/* Product list */}
      {isLoading ? (
        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
      ) : products && products.length > 0 ? (
        products.map((product) => (
          <div
            key={product.id}
            data-testid={`card-product-${product.id}`}
            className={`rounded-xl border p-4 transition-all ${product.isActive ? "bg-card border-border" : "bg-card/50 border-border/40 opacity-60"}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{product.name}</p>
                    {product.isFree && <Badge variant="secondary" className="text-xs">Gratuit</Badge>}
                    {!product.isActive && <Badge variant="outline" className="text-xs text-muted-foreground">Inactif</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatAmount(product.price)} · {formatAmount(product.dailyEarnings)}/jour
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={product.isActive}
                  onCheckedChange={(checked) => toggleMutation.mutate({ id: product.id, isActive: checked })}
                  data-testid={`toggle-product-${product.id}`}
                />
                <Button
                  size="icon" variant="ghost"
                  onClick={() => openEdit(product)}
                  data-testid={`button-edit-${product.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {!product.isFree && (
                  <Button
                    size="icon" variant="ghost"
                    onClick={() => setDeleteConfirmId(product.id)}
                    data-testid={`button-delete-${product.id}`}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Prix</p>
                <p className="font-medium text-foreground">{formatAmount(product.price)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Gains/jour</p>
                <p className="font-medium text-foreground">{formatAmount(product.dailyEarnings)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Durée</p>
                <p className="font-medium text-foreground">{product.cycleDays}j</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Retour total</p>
                <p className="font-medium text-primary">{formatAmount(product.totalReturn)}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Aucun produit — créez le premier produit.</p>
        </div>
      )}

      {/* ── Create / Edit dialog ── */}
      <Dialog open={dialogProductId !== null} onOpenChange={(v) => !v && setDialogProductId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Nouveau produit" : "Modifier le produit"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du produit</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Bulldozer Pro" data-testid="input-product-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (FCFA)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" placeholder="0" data-testid="input-product-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dailyEarnings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gains/jour (FCFA)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" placeholder="0" data-testid="input-product-daily" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cycleDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée (jours)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" placeholder="80" data-testid="input-product-cycle" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre d'affichage</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" placeholder="0" data-testid="input-product-order" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL image (optionnel)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." data-testid="input-product-image" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Live preview of total return */}
              {previewTotal > 0 && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Retour total calculé : </span>
                  <span className="font-bold text-primary">{formatAmount(previewTotal)}</span>
                  <span className="text-muted-foreground"> ({watchedCycle} jours × {formatAmount(watchedDaily)}/jour)</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="submit" className="flex-1" disabled={isPending} data-testid="button-save-product">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isCreating ? "Créer le produit" : "Enregistrer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogProductId(null)} className="flex-1">
                  Annuler
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(v) => !v && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" /> Supprimer ce produit ?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Le produit sera supprimé définitivement.
            Les utilisateurs qui ont déjà ce produit ne seront pas affectés.
          </p>
          <div className="flex gap-3 mt-2">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirmId !== null && deleteMutation.mutate(deleteConfirmId)}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}>
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
