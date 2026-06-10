import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Trash2, Plus, Pencil, X, Check, CreditCard } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import type { ManualPaymentAccount } from "@shared/schema";

const EMPTY_FORM = { operatorName: "", ownerName: "", phoneNumber: "", country: "", logoUrl: "", isActive: true };

export default function AdminManualAccounts() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ManualPaymentAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: accounts = [], isLoading } = useQuery<ManualPaymentAccount[]>({
    queryKey: ["/api/admin/manual-payment-accounts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof EMPTY_FORM) => {
      const res = await apiRequest("POST", "/api/admin/manual-payment-accounts", data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-payment-accounts"] });
      toast({ title: "Compte ajouté !" });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ManualPaymentAccount> }) => {
      const res = await apiRequest("PUT", `/api/admin/manual-payment-accounts/${id}`, data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-payment-accounts"] });
      toast({ title: "Compte mis à jour !" });
      setEditing(null);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/manual-payment-accounts/${id}`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-payment-accounts"] });
      toast({ title: "Compte supprimé" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.operatorName || !form.ownerName || !form.phoneNumber || !form.country) {
      toast({ title: "Champs requis", description: "Remplissez tous les champs obligatoires", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  const handleEditSave = () => {
    if (!editing) return;
    updateMutation.mutate({ id: editing.id, data: editing });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Comptes de paiement semi-auto</h2>
        </div>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }} data-testid="button-add-account">
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nouveau compte de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Opérateur *</label>
                <Input placeholder="Orange Money, MTN..." value={form.operatorName} onChange={e => setForm(f => ({ ...f, operatorName: e.target.value }))} data-testid="input-operator-name" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nom propriétaire *</label>
                <Input placeholder="Jean Dupont" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} data-testid="input-owner-name" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Numéro *</label>
                <Input placeholder="+237..." value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} data-testid="input-phone-number" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Pays *</label>
                <select
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  data-testid="select-country"
                >
                  <option value="">Sélectionner...</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">URL logo (optionnel)</label>
                <Input placeholder="https://..." value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} data-testid="input-logo-url" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} id="new-active" />
                <label htmlFor="new-active" className="text-sm">Actif</label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-account">
                <Check className="w-4 h-4 mr-1" /> Enregistrer
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4 mr-1" /> Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Aucun compte configuré</div>
      ) : (
        <div className="space-y-3">
          {accounts.map(account => (
            <Card key={account.id} data-testid={`card-account-${account.id}`}>
              <CardContent className="p-4">
                {editing?.id === account.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={editing.operatorName} onChange={e => setEditing(a => a ? { ...a, operatorName: e.target.value } : a)} placeholder="Opérateur" />
                      <Input value={editing.ownerName} onChange={e => setEditing(a => a ? { ...a, ownerName: e.target.value } : a)} placeholder="Propriétaire" />
                      <Input value={editing.phoneNumber} onChange={e => setEditing(a => a ? { ...a, phoneNumber: e.target.value } : a)} placeholder="Numéro" />
                      <select value={editing.country} onChange={e => setEditing(a => a ? { ...a, country: e.target.value } : a)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                      <Input value={editing.logoUrl || ""} onChange={e => setEditing(a => a ? { ...a, logoUrl: e.target.value } : a)} placeholder="URL logo" className="col-span-2" />
                      <div className="col-span-2 flex items-center gap-2">
                        <Switch checked={editing.isActive} onCheckedChange={v => setEditing(a => a ? { ...a, isActive: v } : a)} id={`edit-active-${account.id}`} />
                        <label htmlFor={`edit-active-${account.id}`} className="text-sm">Actif</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleEditSave} disabled={updateMutation.isPending}><Check className="w-4 h-4 mr-1" /> Sauvegarder</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(null)}><X className="w-4 h-4 mr-1" /> Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {account.logoUrl && (
                      <img src={account.logoUrl} alt={account.operatorName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground">{account.operatorName}</p>
                        <Badge variant="outline" className="text-xs">{account.country}</Badge>
                        {!account.isActive && <Badge variant="secondary" className="text-xs">Inactif</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{account.ownerName}</p>
                      <p className="font-mono text-sm font-medium text-foreground">{account.phoneNumber}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditing(account)} data-testid={`button-edit-account-${account.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => { if (confirm("Supprimer ce compte ?")) deleteMutation.mutate(account.id); }} data-testid={`button-delete-account-${account.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
