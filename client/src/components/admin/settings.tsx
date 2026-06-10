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
  supportLink: z.string().min(5, "Link required"),
  support2Link: z.string().min(5, "Link required"),
  channelLink: z.string().min(5, "Link required"),
  groupLink: z.string().min(5, "Link required"),
  appDownloadLink: z.string(),
  minDeposit: z.string().min(1, "Amount required"),
  withdrawalFees: z.string().min(1, "Fees required"),
  withdrawalStartHour: z.string().min(1, "Hour required"),
  withdrawalEndHour: z.string().min(1, "Hour required"),
  level1Commission: z.string().min(1, "Commission required"),
  level2Commission: z.string().min(1, "Commission required"),
  level3Commission: z.string().min(1, "Commission required"),
  adminCurrency: z.string().min(1, "Currency required"),
  phpToFcfaRate: z.string().min(1, "Rate required"),
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
        throw new Error(result.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  async function handleApkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".apk")) {
      toast({ title: "Only .apk files allowed", variant: "destructive" });
      return;
    }
    setApkUploading(true);
    try {
      const formData = new FormData();
      formData.append("apk", file);
      const res = await fetch("/api/admin/upload-apk", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setApkUploaded({ filename: data.filename, url: data.url });
      form.setValue("appDownloadLink", data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/settings/links"] });
      toast({ title: "APK uploaded!", description: `${data.filename} (${(data.size / 1024 / 1024).toFixed(1)} MB)` });
    } catch (err: any) {
      toast({ title: "Upload error", description: err.message, variant: "destructive" });
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

        {/* Currency Settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Currency Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="adminCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Display Currency</FormLabel>
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

        {/* Social Links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="supportLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Service 1</FormLabel>
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
                  <FormLabel>Customer Service 2</FormLabel>
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
                  <FormLabel>Official Channel</FormLabel>
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
                  <FormLabel>Discussion Group</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://t.me/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
        </Card>

        {/* App Download */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              App Download
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Option 1: URL */}
            <FormField
              control={form.control}
              name="appDownloadLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Download Link (URL)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/eiffage.apk" data-testid="input-app-download-link" />
                  </FormControl>
                  <FormDescription>
                    Paste a direct APK URL or app store link. This is filled automatically when you upload an APK below.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground font-medium">OR UPLOAD APK DIRECTLY</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Option 2: Upload APK */}
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
                    <span className="text-sm">Uploading…</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to select an APK file (max 200 MB)</span>
                  </>
                )}
              </Button>

              {/* Success state */}
              {apkUploaded && (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-400 truncate">{apkUploaded.filename}</p>
                    <p className="text-xs text-muted-foreground truncate">{apkUploaded.url}</p>
                  </div>
                </div>
              )}

              {/* Existing APK info if link looks like our server */}
              {!apkUploaded && form.watch("appDownloadLink")?.includes("/uploads/apk/") && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="text-sm text-blue-300">APK already hosted on server</p>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Withdrawals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="minDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Deposit (FCFA)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" />
                  </FormControl>
                  <FormDescription>Minimum amount a user can deposit.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="withdrawalFees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal Fees (%)</FormLabel>
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
                    <FormLabel>Start Hour</FormLabel>
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
                    <FormLabel>End Hour</FormLabel>
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

        {/* Referral Commissions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Referral Commissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="level1Commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level 1 (%)</FormLabel>
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
                    <FormLabel>Level 2 (%)</FormLabel>
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
                    <FormLabel>Level 3 (%)</FormLabel>
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
                    <FormLabel className="text-base">Enable CloudPay</FormLabel>
                    <FormDescription>Show CloudPay as a deposit channel</FormDescription>
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
                  <FormLabel>Channel Display Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="CloudPay" data-testid="input-cloudpay-channel-name" />
                  </FormControl>
                  <FormDescription>Name shown to users in the payment channel list</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cloudpayDomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Domain</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="pay.example.com" data-testid="input-cloudpay-domain" />
                  </FormControl>
                  <FormDescription>Domain provided by Galaxy System (without https://)</FormDescription>
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
                    <Input {...field} placeholder="Your merchant ID" data-testid="input-cloudpay-merchant-id" />
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
                  <FormLabel>Secret Key</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Your secret key" data-testid="input-cloudpay-secret-key" />
                  </FormControl>
                  <FormDescription>MD5 signature key provided by Galaxy System</FormDescription>
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
              Save Settings
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
