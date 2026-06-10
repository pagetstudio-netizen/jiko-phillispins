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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Loader2, Link } from "lucide-react";
import type { PaymentChannel } from "@shared/schema";

const COUNTRY_OPTIONS = [
  { code: "CM", label: "🇨🇲 Cameroun" },
  { code: "BF", label: "🇧🇫 Burkina Faso" },
  { code: "TG", label: "🇹🇬 Togo" },
  { code: "BJ", label: "🇧🇯 Bénin" },
  { code: "CI", label: "🇨🇮 Côte d'Ivoire" },
  { code: "CG", label: "🇨🇬 Congo Brazzaville" },
  { code: "CD", label: "🇨🇩 RDC" },
  { code: "SN", label: "🇸🇳 Sénégal" },
  { code: "ML", label: "🇲🇱 Mali" },
  { code: "NE", label: "🇳🇪 Niger" },
];

const channelSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  redirectUrl: z.string().min(5, "URL requise"),
  isApi: z.boolean().default(false),
  countries: z.array(z.string()).default([]),
});

type ChannelForm = z.infer<typeof channelSchema>;

interface AdminChannelsProps {
  isSuperAdmin: boolean;
}

export default function AdminChannels({ isSuperAdmin }: AdminChannelsProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editChannel, setEditChannel] = useState<PaymentChannel | null>(null);

  const { data: channels, isLoading } = useQuery<PaymentChannel[]>({
    queryKey: ["/api/admin/channels"],
  });

  const form = useForm<ChannelForm>({
    resolver: zodResolver(channelSchema),
    defaultValues: { name: "", redirectUrl: "", isApi: false, countries: [] },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChannelForm) => {
      const response = await apiRequest("POST", "/api/admin/channels", data);
      if (!response.ok) { const result = await response.json(); throw new Error(result.message || "Erreur"); }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-channels"] });
      toast({ title: "Canal créé !" });
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ChannelForm> }) => {
      const response = await apiRequest("PATCH", `/api/admin/channels/${id}`, data);
      if (!response.ok) { const result = await response.json(); throw new Error(result.message || "Erreur"); }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-channels"] });
      toast({ title: "Canal mis à jour !" });
      setEditChannel(null);
    },
    onError: (error: any) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/channels/${id}`, {});
      if (!response.ok) { const result = await response.json(); throw new Error(result.message || "Erreur"); }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-channels"] });
      toast({ title: "Canal supprimé !" });
    },
    onError: (error: any) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/channels/${id}`, { isActive });
      if (!response.ok) { const result = await response.json(); throw new Error(result.message || "Erreur"); }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-channels"] });
    },
    onError: (error: any) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const openEdit = (channel: PaymentChannel) => {
    setEditChannel(channel);
    form.reset({
      name: channel.name,
      redirectUrl: channel.redirectUrl,
      isApi: channel.isApi,
      countries: (channel.countries as string[]) || [],
    });
  };

  const handleSubmit = (data: ChannelForm) => {
    if (editChannel) {
      updateMutation.mutate({ id: editChannel.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => { setShowForm(true); form.reset({ name: "", redirectUrl: "", isApi: false, countries: [] }); }} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter un canal
      </Button>

      {isLoading ? (
        Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
      ) : channels && channels.length > 0 ? (
        channels.map((channel) => (
          <Card key={channel.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Link className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{channel.name}</p>
                      {channel.isApi && <Badge className="text-xs">API</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{channel.redirectUrl}</p>
                    {channel.countries && (channel.countries as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(channel.countries as string[]).map(c => (
                          <span key={c} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                            {COUNTRY_OPTIONS.find(o => o.code === c)?.label || c}
                          </span>
                        ))}
                      </div>
                    )}
                    {(!channel.countries || (channel.countries as string[]).length === 0) && (
                      <p className="text-xs text-orange-500 mt-0.5">⚠ Aucun pays configuré</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={channel.isActive}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: channel.id, isActive: checked })}
                  />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(channel)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(channel.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Aucun canal de paiement
        </div>
      )}

      <Dialog open={showForm || !!editChannel} onOpenChange={() => { setShowForm(false); setEditChannel(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editChannel ? "Modifier le canal" : "Nouveau canal"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du canal</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex. MTN Mobile Money" data-testid="input-channel-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="redirectUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de redirection / Instructions</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." data-testid="input-channel-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="countries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays disponibles *</FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {COUNTRY_OPTIONS.map((opt) => {
                        const checked = field.value.includes(opt.code);
                        return (
                          <button
                            key={opt.code}
                            type="button"
                            onClick={() => {
                              const newVal = checked
                                ? field.value.filter((c: string) => c !== opt.code)
                                : [...field.value, opt.code];
                              field.onChange(newVal);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              checked ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-600"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
                              {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                            </div>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Ce canal ne sera visible que pour les utilisateurs des pays sélectionnés.</p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isApi"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Paiement API automatique</FormLabel>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editChannel ? "Enregistrer" : "Créer"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
