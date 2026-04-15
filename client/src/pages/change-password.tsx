import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLang } from "@/lib/i18n";

const GREEN = "#3db51d";

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { t } = useLang();
  const tr = t.changePassword;

  useEffect(() => { document.title = tr.title; }, [tr.title]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#f5f5f5" }}>

      {/* Green header */}
      <div
        className="flex items-center px-4 py-4"
        style={{ background: GREEN }}
      >
        <Link href="/account">
          <button
            className="flex items-center gap-1 text-white font-semibold text-sm mr-4"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
            {tr.back}
          </button>
        </Link>
        <h1 className="flex-1 text-center text-white font-bold text-base mr-16">
          {tr.header}
        </h1>
      </div>

      {/* White card */}
      <div className="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 space-y-5">

          {/* Current password */}
          <div>
            <p className="text-sm text-gray-600 mb-2">{tr.currentPassword}</p>
            <div
              className="flex items-center rounded-xl overflow-hidden"
              style={{ border: "1px solid #e0e0e0", height: 52 }}
            >
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="flex-1 px-4 text-sm text-gray-800 outline-none bg-transparent"
                data-testid="input-current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="px-3 text-gray-400"
                data-testid="button-toggle-current"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <p className="text-sm text-gray-600 mb-2">{tr.newPassword}</p>
            <div
              className="flex items-center rounded-xl overflow-hidden"
              style={{ border: "1px solid #e0e0e0", height: 52 }}
            >
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 px-4 text-sm text-gray-800 outline-none bg-transparent"
                data-testid="input-new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="px-3 text-gray-400"
                data-testid="button-toggle-new"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <p className="text-sm text-gray-600 mb-2">{tr.confirmPassword}</p>
            <div
              className="flex items-center rounded-xl overflow-hidden"
              style={{ border: "1px solid #e0e0e0", height: 52 }}
            >
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex-1 px-4 text-sm text-gray-800 outline-none bg-transparent"
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="px-3 text-gray-400"
                data-testid="button-toggle-confirm"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs mt-1 text-red-500">{tr.mismatch}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={changePasswordMutation.isPending}
            className="w-full h-13 rounded-xl text-white font-bold text-base disabled:opacity-40"
            style={{ background: GREEN, height: 52 }}
            data-testid="button-change-password-submit"
          >
            {changePasswordMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {tr.submitting}
              </span>
            ) : tr.submit}
          </button>

        </div>
      </div>

    </div>
  );
}
