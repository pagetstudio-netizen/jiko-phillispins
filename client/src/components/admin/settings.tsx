import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Link, Clock, Users, DollarSign, CreditCard, Download, UploadCloud, CheckCircle2 } from "lucide-react";


const settingsSchema = z.object({
  supportLink: z.string().min(5, "Lien requis"),
  support2Link: z.string().min(5, "Lien requis"),
  channelLink: z.string().min(5, "Lien requis"),
  groupLink: z.string().min(5, "Lien requis"),
  appDownloadLink: z.string(),
  minDeposit: z.string().min(1, "Montant requis"),
  withdrawalFees: z.string().min(1, "Frais requis"),
  withdrawalStartHour: z.string().min(1, "Heure requise"),
  withdrawalEndHour: z.string().min(1, "Heure requise"),
  level1Commission: z.string().min(1, "Commission requise"),
  level2Commission: z.string().min(1, "Commission requise"),
  level3Commission: z.string().min(1, "Commission requise"),
  adminCurrency: z.string().min(1, "Devise requise"),
  phpToFcfaRate: z.string().min(1, "Taux requis"),
  cloudpayEnabled: z.string(),
  cloudpayMerchantId: z.string(),
  cloudpaySecretKey: z.string(),
  cloudpayDomain: z.string(),
  cloudpayChannelName: z.string(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface AdminSettingsProps {
  isSuperAdmin: boolean;
}

export default function AdminSettings({ isSuperAdmin }: AdminSettingsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apkUploading, setApkUploading] = useState(false);
  const [apkUploaded, setApkUploaded] = useState<{ filename: string; url: string } | null>(null);

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      supportLink: "https://t.me/EiffageSupport",
      support2Link: "https://t.me/EiffageSupport",
      channelLink: "https://t.me/EiffageSupport",
      groupLink: "https://t.me/+R9SFSGneBkg3NTFh",
      appDownloadLink: "",
      minDeposit: "3500",
      withdrawalFees: "15",
      withdrawalStartHour: "8",
      withdrawalEndHour: "17",
      level1Commission: "27",
      level2Commission: "2",
      level3Commission: "1",
      adminCurrency: "FCFA",
      phpToFcfaRate: "1",
      cloudpayEnabled: "false",
      cloudpayMerchantId: "",
      cloudpaySecretKey: "",
      cloudpayDomain: "",
      cloudpayChannelName: "CloudPay",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        supportLink: settings.supportLink || "https://t.me/EiffageSupport",
        support2Link: settings.support2Link || "https://t.me/EiffageSupport",
        channelLink: settings.channelLink || "https://t.me/EiffageSupport",
        groupLink: settings.groupLink || "https://t.me/+R9SFSGneBkg3NTFh",
        appDownloadLink: settings.appDownloadLink || "",
        minDeposit: settings.minDeposit || "3500",
        withdrawalFees: settings.withdrawalFees || "15",
        withdrawalStartHour: settings.withdrawalStartHour || "8",
        withdrawalEndHour: settings.withdrawalEndHour || "17",
        level1Commission: settings.level1Commission || "27",
        level2Commission: settings.level2Commission || "2",
        level3Commission: settings.level3Commission || "1",
        adminCurrency: settings.adminCurrency || "FCFA",
        phpToFcfaRate: settings.phpToFcfaRate || "1",
        cloudpayEnabled: settings.cloudpayEnabled || "false",
        cloudpayMerchantId: settings.cloudpayMerchantId || "",
        cloudpaySecretKey: settings.cloudpaySecretKey || "",
        cloudpayDomain: settings.cloudpayDomain || "",
        cloudpayChannelName: settings.cloudpayChannelName || "CloudPay",
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const response = await apiRequest("POST", "/api/admin/settings", data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Paramètres sauvegardés !" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  async function handleApkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".apk")) {
      toast({ title: "Seuls les fichiers .apk sont acceptés", variant: "destructive" });
      return;
    }
    setApkUploading(true);
    try {
      const formData = new FormData();
      formData.append("apk", file);
      const res = await fetch("/api/admin/upload-apk", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Échec du téléversement");
      setApkUploaded({ filename: data.filename, url: data.url });
      form.setValue("appDownloadLink", data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/settings/links"] });
      toast({ title: "APK téléversé !", description: `${data.filename} (${(data.size / 1024 / 1024).toFixed(1)} Mo)` });
    } catch (err: any) {
      toast({ title: "Erreur de téléversement", description: err.message, variant: "destructive" });
    } finally {
      setApkUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">

        {/* Paramètres devise */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Paramètres devise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="adminCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Devise d'affichage admin</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="FCFA" />
                  </FormControl>
                  <FormDescription>Devise affichée dans le panel admin (ex : FCFA, XOF, XAF)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phpToFcfaRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taux de conversion (1 {form.watch("adminCurrency") || "FCFA"} = ? FCFA)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0.01" step="0.01" placeholder="1" />
                  </FormControl>
                  <FormDescription>
                    1 {form.watch("adminCurrency") || "FCFA"} = {form.watch("phpToFcfaRate") || "1"} FCFA
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Liens sociaux */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              Liens sociaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="supportLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service client 1</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://t.me/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="support2Link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service client 2</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://t.me/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="channelLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal officiel</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://t.me/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Groupe de discussion</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://t.me/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
        </Card>

        {/* Téléchargement de l'app */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Téléchargement de l'app
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <FormField
              control={form.control}
              name="appDownloadLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien de téléchargement (URL)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/eiffage.apk" data-testid="input-app-download-link" />
                  </FormControl>
                  <FormDescription>
                    Collez une URL APK directe ou un lien vers une boutique d'applications. Rempli automatiquement si vous téléversez un APK ci-dessous.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground font-medium">OU TÉLÉVERSER UN APK DIRECTEMENT</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".apk,application/vnd.android.package-archive"
                className="hidden"
                data-testid="input-apk-file"
                onChange={handleApkUpload}
              />

              <Button
                type="button"
                variant="outline"
                className="w-full h-20 flex flex-col gap-1 border-dashed"
                disabled={apkUploading}
                data-testid="button-upload-apk"
                onClick={() => fileInputRef.current?.click()}
              >
                {apkUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-sm">Téléversement…</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cliquer pour sélectionner un APK (max 200 Mo)</span>
                  </>
                )}
              </Button>

              {apkUploaded && (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-400 truncate">{apkUploaded.filename}</p>
                    <p className="text-xs text-muted-foreground truncate">{apkUploaded.url}</p>
                  </div>
                </div>
              )}

              {!apkUploaded && form.watch("appDownloadLink")?.includes("/uploads/apk/") && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="text-sm text-blue-300">APK déjà hébergé sur le serveur</p>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Retraits */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Retraits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="minDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dépôt minimum (FCFA)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" />
                  </FormControl>
                  <FormDescription>Montant minimum qu'un utilisateur peut déposer.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="withdrawalFees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frais de retrait (%)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="withdrawalStartHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure début</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" max="23" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="withdrawalEndHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure fin</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" max="23" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Commissions de parrainage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Commissions de parrainage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="level1Commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau 1 (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level2Commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau 2 (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level3Commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau 3 (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* CloudPay (Galaxy System) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              CloudPay (Galaxy System API)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="cloudpayEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">Activer CloudPay</FormLabel>
                    <FormDescription>Afficher CloudPay comme canal de dépôt</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === "true"}
                      onCheckedChange={(checked) => field.onChange(checked ? "true" : "false")}
                      data-testid="switch-cloudpay-enabled"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cloudpayChannelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'affichage du canal</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="CloudPay" data-testid="input-cloudpay-channel-name" />
                  </FormControl>
                  <FormDescription>Nom affiché aux utilisateurs dans la liste des canaux de paiement</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cloudpayDomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domaine API</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="pay.example.com" data-testid="input-cloudpay-domain" />
                  </FormControl>
                  <FormDescription>Domaine fourni par Galaxy System (sans https://)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cloudpayMerchantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Votre Merchant ID" data-testid="input-cloudpay-merchant-id" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cloudpaySecretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clé secrète</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Votre clé secrète" data-testid="input-cloudpay-secret-key" />
                  </FormControl>
                  <FormDescription>Clé de signature MD5 fournie par Galaxy System</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les paramètres
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
