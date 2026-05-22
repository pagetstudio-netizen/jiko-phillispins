import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useLang } from "@/lib/i18n";

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { t, lang } = useLang();
  const tr = t.changePassword;
  const fr = lang === "fr";

  useEffect(() => { document.title = tr.title; }, [tr.title]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/change-password", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || tr.errorMismatch);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: tr.successTitle, description: tr.successDesc });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      navigate("/account");
    },
    onError: (e: Error) => {
      toast({ title: tr.errorTitle, description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: tr.requiredFields, description: tr.requiredFieldsDesc, variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: tr.tooShort, description: tr.tooShortDesc, variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: tr.errorTitle, description: tr.errorMismatch, variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 16px",
    borderBottom: "1px solid #2a2a2a",
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#ccc",
    fontSize: 14,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "#ffffff", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px", paddingTop: 48 }}>
        <button
          data-testid="button-back"
          onClick={() => window.history.length > 1 ? window.history.back() : navigate("/account")}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
        >
          <ChevronLeft style={{ width: 24, height: 24, color: "#fff" }} />
        </button>
        <h1 style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16, color: "#fff", marginRight: 32 }}>
          {fr ? "Modifier le mot de passe de connexion" : "Change Login Password"}
        </h1>
      </div>

      {/* Card */}
      <div style={{ margin: "24px 16px 0", background: "#1a1a1a", borderRadius: 12, overflow: "hidden" }}>

        {/* Old password */}
        <div style={fieldStyle}>
          <Lock style={{ width: 18, height: 18, color: "#888", flexShrink: 0 }} />
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={fr ? "Ancien mot de passe de connexion" : "Old login password"}
            style={inputStyle}
            data-testid="input-current-password"
          />
        </div>

        {/* New password */}
        <div style={fieldStyle}>
          <Lock style={{ width: 18, height: 18, color: "#888", flexShrink: 0 }} />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={fr ? "Nouveau mot de passe de connexion" : "New login password"}
            style={inputStyle}
            data-testid="input-new-password"
          />
        </div>

        {/* Confirm password */}
        <div style={{ ...fieldStyle, borderBottom: "none" }}>
          <Lock style={{ width: 18, height: 18, color: "#888", flexShrink: 0 }} />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={fr ? "Confirmer le mot de passe de connexion" : "Confirm login password"}
            style={inputStyle}
            data-testid="input-confirm-password"
          />
        </div>

      </div>

      {/* Submit button */}
      <div style={{ padding: "32px 16px 0" }}>
        <button
          onClick={handleSubmit}
          disabled={changePasswordMutation.isPending}
          data-testid="button-change-password-submit"
          style={{
            width: "100%",
            height: 52,
            borderRadius: 8,
            background: "#1a1a1a",
            border: "1px solid #e07020",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            opacity: changePasswordMutation.isPending ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {changePasswordMutation.isPending ? (
            <>
              <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
              {fr ? "En cours..." : "Processing..."}
            </>
          ) : (fr ? "Confirmer les modifications" : "Confirm changes")}
        </button>
      </div>

    </div>
  );
}
