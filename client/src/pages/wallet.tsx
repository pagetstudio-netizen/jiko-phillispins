import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getPaymentMethodsForCountry } from "@/lib/countries";
import { Loader2, Plus, Trash2, CreditCard, ChevronLeft, ChevronRight, Shield, Check } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import type { WithdrawalWallet } from "@shared/schema";
import { useLang } from "@/lib/i18n";
import heroBg from "@assets/addbankcard-title-icon-D4FNm2p7_1779480104681.png";

const walletSchema = z.object({
  accountName: z.string().min(2, "Requis"),
  accountNumber: z.string().min(4, "Requis"),
  paymentMethod: z.string().min(2, "Requis"),
});

type WalletForm = z.infer<typeof walletSchema>;

const ORANGE = "#e07020";
const DARK_CARD = "#1a1a1a";
const BORDER = "#2a2a2a";

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { lang } = useLang();
  const fr = lang === "fr";
  useEffect(() => { document.title = "Wallet | Noviqra Ai"; }, []);
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const selectMode = params.get("from") === "withdrawal";
  const [showForm, setShowForm] = useState(false);
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");

  const { data: wallets, isLoading } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
  });

  const form = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: { accountName: "", accountNumber: "", paymentMethod: "" },
  });

  const addMutation = useMutation({
    mutationFn: async (data: WalletForm) => {
      const response = await apiRequest("POST", "/api/wallets", { ...data, country: user!.country });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: fr ? "Compte ajouté !" : "Account added!" });
      form.reset();
      setSelectedMethod("");
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("DELETE", `/api/wallets/${walletId}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: fr ? "Compte supprimé !" : "Account removed!" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("PATCH", `/api/wallets/${walletId}/default`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleSelectWallet = (wallet: WithdrawalWallet) => {
    if (selectMode) {
      localStorage.setItem("selectedWalletId", wallet.id.toString());
      navigate("/withdrawal");
    }
  };

  const handleChooseMethod = (method: string) => {
    setSelectedMethod(method);
    form.setValue("paymentMethod", method);
    setShowBankSheet(false);
  };

  const handleSubmit = () => {
    form.handleSubmit((data) => addMutation.mutate(data))();
  };

  if (!user) return null;

  const paymentMethods = getPaymentMethodsForCountry(user.country);
  const backLink = selectMode ? "/withdrawal" : "/account";

  // ── ADD FORM VIEW ──────────────────────────────────────────────
  if (showForm) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>

        {/* Hero with overlaid title */}
        <div style={{ position: "relative" }}>
          <img
            src={heroBg}
            alt=""
            style={{ width: "100%", height: 200, objectFit: "cover", objectPosition: "center", display: "block" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />

          {/* Back button */}
          <button
            data-testid="button-back-form"
            onClick={() => { setShowForm(false); form.reset(); setSelectedMethod(""); }}
            style={{ position: "absolute", top: 44, left: 16, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
          >
            <ChevronLeft style={{ width: 26, height: 26, color: "#fff" }} />
          </button>

          {/* Title */}
          <div style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            textAlign: "center",
            fontWeight: 900,
            fontSize: 28,
            color: "#fff",
            letterSpacing: 2,
            lineHeight: 1.2,
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}>
            {fr ? "LIER UNE CARTE\nBANCAIRE" : "LINK A BANK\nACCOUNT"}
          </div>
        </div>

        {/* Form fields */}
        <div style={{ background: "#000", padding: "0 20px" }}>

          {/* Select bank */}
          <button
            type="button"
            onClick={() => setShowBankSheet(true)}
            style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: "20px 0", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}
            data-testid="button-select-bank"
          >
            <div>
              <p style={{ fontSize: 11, color: "#e05050", fontWeight: 600, marginBottom: 4 }}>
                * {fr ? "Sélectionnez la banque" : "Select bank"}
              </p>
              <p style={{ fontSize: 14, color: selectedMethod ? "#fff" : "#555" }}>
                {selectedMethod || (fr ? "Veuillez choisir" : "Please choose")}
              </p>
            </div>
            <ChevronRight style={{ width: 18, height: 18, color: "#555" }} />
          </button>

          {/* Account name */}
          <div style={{ padding: "20px 0", borderBottom: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 11, color: "#e05050", fontWeight: 600, marginBottom: 4 }}>
              * {fr ? "Nom du titulaire du compte" : "Account holder name"}
            </p>
            <input
              {...form.register("accountName")}
              placeholder={fr ? "Veuillez saisir le nom du titulaire" : "Please enter account holder name"}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#ccc" }}
              data-testid="input-wallet-name"
            />
            {form.formState.errors.accountName && (
              <p style={{ color: "#e05050", fontSize: 11, marginTop: 4 }}>{form.formState.errors.accountName.message}</p>
            )}
          </div>

          {/* Account number */}
          <div style={{ padding: "20px 0", borderBottom: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 11, color: "#e05050", fontWeight: 600, marginBottom: 4 }}>
              * {fr ? "Compte bancaire" : "Account number"}
            </p>
            <input
              {...form.register("accountNumber")}
              type="tel"
              placeholder={fr ? "Veuillez saisir le numéro de compte bancaire" : "Please enter account number"}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#ccc" }}
              data-testid="input-wallet-number"
            />
            {form.formState.errors.accountNumber && (
              <p style={{ color: "#e05050", fontSize: 11, marginTop: 4 }}>{form.formState.errors.accountNumber.message}</p>
            )}
          </div>

          {/* Confirm button */}
          <div style={{ paddingTop: 32 }}>
            <button
              onClick={handleSubmit}
              disabled={addMutation.isPending}
              data-testid="button-confirm-wallet"
              style={{
                width: "100%",
                height: 52,
                borderRadius: 8,
                background: DARK_CARD,
                border: `1px solid ${ORANGE}`,
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                opacity: addMutation.isPending ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                  {fr ? "En cours..." : "Saving..."}
                </>
              ) : (fr ? "Confirmer" : "Confirm")}
            </button>
          </div>
        </div>

        {/* Bank picker bottom sheet */}
        {showBankSheet && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setShowBankSheet(false)}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
            <div
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#111", borderRadius: "20px 20px 0 0" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet header */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px 10px", borderBottom: "1px solid #222" }}>
                <button onClick={() => setShowBankSheet(false)} style={{ background: "transparent", border: "none", color: "#4a9eff", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
                  {fr ? "Annuler" : "Cancel"}
                </button>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
                  {fr ? "Selectionner une banque" : "Select a bank"}
                </span>
                <button onClick={() => setShowBankSheet(false)} style={{ background: "transparent", border: "none", color: "#4a9eff", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
                  {fr ? "Confirmer" : "Confirm"}
                </button>
              </div>

              {/* Bank list */}
              <div style={{ maxHeight: 320, overflowY: "auto", paddingBottom: 24 }}>
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => handleChooseMethod(method)}
                    data-testid={`button-bank-${method}`}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #222",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ color: "#ddd", fontSize: 14 }}>{method}</span>
                    {selectedMethod === method && (
                      <Check style={{ width: 16, height: 16, color: ORANGE }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px", paddingTop: 48 }}>
        <button
          data-testid="button-back"
          onClick={() => window.history.length > 1 ? window.history.back() : navigate(backLink)}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
        >
          <ChevronLeft style={{ width: 24, height: 24, color: "#fff" }} />
        </button>
        <h1 style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16, color: "#fff" }}>
          {selectMode
            ? (fr ? "Sélectionner un compte" : "Select an account")
            : (fr ? "Gestion des comptes bancaires" : "Bank accounts")}
        </h1>
        {!selectMode ? (
          <button
            onClick={() => setShowForm(true)}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
            data-testid="button-add-wallet-icon"
          >
            <Plus style={{ width: 22, height: 22, color: "#fff" }} />
          </button>
        ) : (
          <div style={{ width: 30 }} />
        )}
      </div>

      {/* Wallet list */}
      <div style={{ flex: 1, padding: "8px 16px 120px" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 48 }}>
            <Loader2 style={{ width: 24, height: 24, color: ORANGE }} className="animate-spin" />
          </div>
        ) : wallets && wallets.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                onClick={() => selectMode && handleSelectWallet(wallet)}
                data-testid={`wallet-card-${wallet.id}`}
                style={{
                  background: DARK_CARD,
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: selectMode ? "pointer" : "default",
                  borderLeft: wallet.isDefault ? `3px solid ${ORANGE}` : "none",
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CreditCard style={{ width: 20, height: 20, color: "#888" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{wallet.paymentMethod}</p>
                  <p style={{ fontSize: 12, color: "#888", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wallet.accountName}</p>
                  <p style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{wallet.accountNumber}</p>
                  {wallet.isDefault && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Shield style={{ width: 12, height: 12, color: ORANGE }} />
                      <span style={{ fontSize: 11, color: ORANGE, fontWeight: 600 }}>{fr ? "Défaut" : "Default"}</span>
                    </div>
                  )}
                </div>
                {!selectMode && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {!wallet.isDefault && (
                      <button
                        onClick={() => setDefaultMutation.mutate(wallet.id)}
                        disabled={setDefaultMutation.isPending}
                        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}
                        data-testid={`button-set-default-${wallet.id}`}
                      >
                        <Check style={{ width: 18, height: 18, color: "#4caf50" }} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(wallet.id)}
                      disabled={deleteMutation.isPending}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}
                      data-testid={`button-delete-wallet-${wallet.id}`}
                    >
                      <Trash2 style={{ width: 18, height: 18, color: "#e05050" }} />
                    </button>
                  </div>
                )}
                {selectMode && (
                  <ChevronRight style={{ width: 16, height: 16, color: "#444", flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Add button fixed at bottom */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 16px 32px", background: "#000" }}>
        <button
          onClick={() => setShowForm(true)}
          data-testid="button-add-wallet"
          style={{
            width: "100%",
            height: 52,
            borderRadius: 8,
            background: DARK_CARD,
            border: `1px solid ${ORANGE}`,
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          {fr ? "Ajouter" : "Add Account"}
        </button>
      </div>
    </div>
  );
}
