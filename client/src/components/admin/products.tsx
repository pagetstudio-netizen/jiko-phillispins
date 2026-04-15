import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
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
import { Edit, Loader2, TrendingUp } from "lucide-react";
import type { Product } from "@shared/schema";

const productSchema = z.object({
  name: z.string().min(2, "Name required"),
  price: z.string().min(1, "Price required"),
  dailyEarnings: z.string().min(1, "Daily earnings required"),
  cycleDays: z.string().min(1, "Duration required"),
  imageUrl: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function AdminProducts() {
  const { toast } = useToast();
  const { formatAmount } = useAdminCurrency();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products/all"],
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: "",
      dailyEarnings: "",
      cycleDays: "80",
      imageUrl: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${id}`, data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      toast({ title: "Product updated!" });
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${id}`, { isActive });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    form.reset({
      name: product.name,
      price: product.price.toString(),
      dailyEarnings: product.dailyEarnings.toString(),
      cycleDays: product.cycleDays.toString(),
      imageUrl: product.imageUrl || "",
    });
  };

  const handleSubmit = (data: ProductForm) => {
    if (!selectedProduct) return;

    const price = parseInt(data.price);
    const dailyEarnings = parseInt(data.dailyEarnings);
    const cycleDays = parseInt(data.cycleDays);

    updateMutation.mutate({
      id: selectedProduct.id,
      data: {
        name: data.name,
        price,
        dailyEarnings,
        cycleDays,
        totalReturn: dailyEarnings * cycleDays,
        imageUrl: data.imageUrl || null,
      },
    });
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
      ) : products && products.length > 0 ? (
        products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.isFree && <Badge variant="secondary" className="text-xs">Free</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatAmount(product.price)} - {formatAmount(product.dailyEarnings)}/day
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={product.isActive}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: product.id, isActive: checked })}
                  />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-medium text-foreground">{formatAmount(product.price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Daily earnings</p>
                  <p className="font-medium text-foreground">{formatAmount(product.dailyEarnings)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total return</p>
                  <p className="font-medium text-primary">{formatAmount(product.totalReturn)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No products
        </div>
      )}

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <FormLabel>Price (FCFA)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
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
                      <FormLabel>Daily earnings (FCFA)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cycleDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (days)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
