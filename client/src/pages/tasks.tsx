import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import type { Task } from "@shared/schema";
import { useUserCurrency } from "@/lib/useUserCurrency";
import { useLang } from "@/lib/i18n";
import heroImg from "@assets/robot-humanoide_1779479959935.jpg";

interface TaskWithStatus extends Task {
  isCompleted: boolean;
  canClaim: boolean;
  currentInvites: number;
}

const ORANGE = "#e07020";
const DARK_CARD = "#1a1a1a";
const BORDER = "#2a2a2a";

export default function TasksPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { fmt } = useUserCurrency();
  const { lang } = useLang();
  const fr = lang === "fr";
  const [, navigate] = useLocation();

  useEffect(() => { document.title = "Mission Center | Noviqra Ai"; }, []);

  const { data: tasks, isLoading } = useQuery<TaskWithStatus[]>({
    queryKey: ["/api/tasks"],
  });

  const claimMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/claim`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refreshUser();
      toast({ title: fr ? "Récompense réclamée !" : "Reward claimed!", description: fr ? "Le bonus a été ajouté à votre compte." : "The bonus has been added to your account." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const totalClaimed = tasks?.filter(t => t.isCompleted).reduce((sum, t) => sum + t.reward, 0) || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#111111", color: "#fff", paddingBottom: 80 }}>

      {/* ── HERO ── */}
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <img
          src={heroImg}
          alt="Centre de missions"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.70) 100%)" }} />

        {/* Back button */}
        <button
          data-testid="button-back"
          onClick={() => window.history.length > 1 ? window.history.back() : navigate("/")}
          style={{ position: "absolute", top: 44, left: 16, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
        >
          <ChevronLeft style={{ width: 28, height: 28, color: "#fff" }} />
        </button>

        {/* Title */}
        <div style={{
          position: "absolute",
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: "center",
          fontWeight: 900,
          fontSize: 30,
          color: "#fff",
          letterSpacing: 3,
          textShadow: "0 2px 12px rgba(0,0,0,0.7)",
          textTransform: "uppercase",
        }}>
          {fr ? "CENTRE DE MISSIONS" : "MISSION CENTER"}
        </div>
      </div>

      {/* ── TOTAL REWARDS CARD ── */}
      <div style={{ margin: "20px 16px 0", background: DARK_CARD, borderRadius: 12, border: `1px solid ${ORANGE}`, padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: 1 }} data-testid="text-total-rewards">
          {fmt(totalClaimed)}
        </div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
          {fr ? "Récompenses cumulées" : "Total rewards earned"}
        </div>
      </div>

      {/* ── MISSION CARDS ── */}
      <div style={{ padding: "20px 16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} style={{ background: DARK_CARD, borderRadius: 12, height: 140, opacity: 0.5 }} />
          ))
        ) : tasks && tasks.length > 0 ? (
          tasks.map((task, index) => {
            const missionNum = index + 1;
            const progress = task.currentInvites;
            const target = task.requiredInvites;
            const progressStr = `${progress}/${target}`;

            return (
              <div
                key={task.id}
                data-testid={`task-item-${task.id}`}
                style={{
                  background: DARK_CARD,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: task.isCompleted ? "1px solid #4caf50" : task.canClaim ? `1px solid ${ORANGE}` : `1px solid ${BORDER}`,
                }}
              >
                {/* Card top: mission number + description */}
                <div style={{ padding: "16px 16px 12px", display: "flex", gap: 14 }}>
                  {/* Left: Mission number */}
                  <div style={{ flexShrink: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>Mission</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{missionNum}</div>
                  </div>

                  {/* Right: Description */}
                  <div style={{ flex: 1, fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>
                    {task.description}
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
                  {[
                    { label: fr ? "Actuel" : "Current",     value: String(progress) },
                    { label: fr ? "Objectif" : "Target",    value: String(target) },
                    { label: fr ? "Progression" : "Progress", value: progressStr },
                  ].map((col, i) => (
                    <div
                      key={i}
                      style={{
                        textAlign: "center",
                        padding: "12px 8px",
                        borderRight: i < 2 ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{col.value}</div>
                      <div style={{ fontSize: 11, color: "#777", marginTop: 3 }}>{col.label}</div>
                    </div>
                  ))}
                </div>

                {/* Action button */}
                <div style={{ padding: "12px 16px" }}>
                  {task.isCompleted ? (
                    <div
                      style={{
                        width: "100%",
                        height: 40,
                        borderRadius: 8,
                        background: "#2a3a2a",
                        border: "1px solid #4caf50",
                        color: "#4caf50",
                        fontWeight: 700,
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ✓ {fr ? "Réclamé" : "Claimed"}
                    </div>
                  ) : task.canClaim ? (
                    <button
                      onClick={() => !claimMutation.isPending && claimMutation.mutate(task.id)}
                      disabled={claimMutation.isPending}
                      data-testid={`button-claim-${task.id}`}
                      style={{
                        width: "100%",
                        height: 40,
                        borderRadius: 8,
                        background: ORANGE,
                        border: "none",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      {claimMutation.isPending ? (
                        <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                      ) : (fr ? "Réclamer" : "Claim")}
                    </button>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: 40,
                        borderRadius: 8,
                        background: "#2a2a2a",
                        color: "#666",
                        fontWeight: 600,
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {fr ? "En cours" : "In progress"}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#555" }}>
            {fr ? "Aucune mission disponible" : "No missions available"}
          </div>
        )}
      </div>
    </div>
  );
}
