import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Link, Clock, Users, DollarSign } from "lucide-react";


const settingsSchema = z.object({
  supportLink: z.string().min(5, "Link required"),
  support2Link: z.string().min(5, "Link required"),
  channelLink: z.string().min(5, "Link required"),
  groupLink: z.string().min(5, "Link required"),
  minDeposit: z.string().min(1, "Amount required"),
  withdrawalFees: z.string().min(1, "Fees required"),
  withdrawalStartHour: z.string().min(1, "Hour required"),
  withdrawalEndHour: z.string().min(1, "Hour required"),
  level1Commission: z.string().min(1, "Commission required"),
  level2Commission: z.string().min(1, "Commission required"),
  level3Commission: z.string().min(1, "Commission required"),
  adminCurrency: z.string().min(1, "Currency required"),
  phpToFcfaRate: z.string().min(1, "Rate required"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface AdminSettingsProps {
  isSuperAdmin: boolean;
}

export default function AdminSettings({ isSuperAdmin }: AdminSettingsProps) {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      supportLink: "https://t.me/Jinkosolarr",
      support2Link: "https://t.me/Jinkosolarr",
      channelLink: "https://t.me/Jinkosolarr",
      groupLink: "https://t.me/+R9SFSGneBkg3NTFh",
      minDeposit: "3500",
      withdrawalFees: "15",
      withdrawalStartHour: "8",
      withdrawalEndHour: "17",
      level1Commission: "27",
      level2Commission: "2",
      level3Commission: "1",
      adminCurrency: "PHP",
      phpToFcfaRate: "10",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        supportLink: settings.supportLink || "https://t.me/Jinkosolarr",
        support2Link: settings.support2Link || "https://t.me/Jinkosolarr",
        channelLink: settings.channelLink || "https://t.me/Jinkosolarr",
        groupLink: settings.groupLink || "https://t.me/+R9SFSGneBkg3NTFh",
        minDeposit: settings.minDeposit || "3500",
        withdrawalFees: settings.withdrawalFees || "15",
        withdrawalStartHour: settings.withdrawalStartHour || "8",
        withdrawalEndHour: settings.withdrawalEndHour || "17",
        level1Commission: settings.level1Commission || "27",
        level2Commission: settings.level2Commission || "2",
        level3Commission: settings.level3Commission || "1",
        adminCurrency: settings.adminCurrency || "PHP",
        phpToFcfaRate: settings.phpToFcfaRate || "10",
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
                    <Input {...field} placeholder="PHP" />
                  </FormControl>
                  <FormDescription>Currency symbol shown in admin panel (e.g. PHP, USD, EUR)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phpToFcfaRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange Rate (1 {form.watch("adminCurrency") || "PHP"} = ? FCFA)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0.01" step="0.01" placeholder="10" />
                  </FormControl>
                  <FormDescription>
                    1 {form.watch("adminCurrency") || "PHP"} = {form.watch("phpToFcfaRate") || "10"} FCFA
                    &nbsp;|&nbsp;
                    1 FCFA = {(1 / parseFloat(form.watch("phpToFcfaRate") || "10")).toFixed(4)} {form.watch("adminCurrency") || "PHP"}
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
