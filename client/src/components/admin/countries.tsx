import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Pencil, X, Check, Globe, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react";

type Operator = { id: number; countryCode: string; operatorName: string; isActive: boolean };
type Country = { id: number; code: string; name: string; currency: string; phonePrefix: string; isActive: boolean; operators: Operator[] };

const QKEY = ["/api/admin/countries"];

export default function AdminCountries() {
  const { data: countries = [], isLoading } = useQuery<Country[]>({ queryKey: QKEY });

  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [newOpInput, setNewOpInput] = useState<Record<string, string>>({});

  // ── New country form state
  const [nc, setNc] = useState({ code: "", name: "", currency: "", phonePrefix: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QKEY });

  const addCountryMut = useMutation({
    mutationFn: (data: typeof nc) => apiRequest("POST", "/api/admin/countries", data).then(r => r.json()),
    onSuccess: () => { invalidate(); setShowAddCountry(false); setNc({ code: "", name: "", currency: "", phonePrefix: "" }); },
  });

  const updateCountryMut = useMutation({
    mutationFn: ({ code, data }: { code: string; data: Partial<Country> }) =>
      apiRequest("PUT", `/api/admin/countries/${code}`, data).then(r => r.json()),
    onSuccess: () => { invalidate(); setEditingCode(null); },
  });

  const deleteCountryMut = useMutation({
    mutationFn: (code: string) => apiRequest("DELETE", `/api/admin/countries/${code}`, {}).then(r => r.json()),
    onSuccess: () => invalidate(),
  });

  const addOpMut = useMutation({
    mutationFn: ({ code, name }: { code: string; name: string }) =>
      apiRequest("POST", `/api/admin/countries/${code}/operators`, { operatorName: name }).then(r => r.json()),
    onSuccess: (_d, { code }) => { invalidate(); setNewOpInput(p => ({ ...p, [code]: "" })); },
  });

  const deleteOpMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/operators/${id}`, {}).then(r => r.json()),
    onSuccess: () => invalidate(),
  });

  const [editForm, setEditForm] = useState<Record<string, Country>>({});

  const startEdit = (c: Country) => {
    setEditForm(p => ({ ...p, [c.code]: { ...c } }));
    setEditingCode(c.code);
  };

  if (isLoading) return <div style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>Chargement...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Globe style={{ width: 18, height: 18, color: "#f59e0b" }} />
          <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Pays & Opérateurs</span>
        </div>
        <button
          onClick={() => setShowAddCountry(v => !v)}
          data-testid="button-add-country"
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#f59e0b", border: "none", borderRadius: 8, padding: "8px 14px", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          <Plus style={{ width: 16, height: 16 }} /> Ajouter un pays
        </button>
      </div>

      {/* ── Add country form ── */}
      {showAddCountry && (
        <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 16, border: "1px solid #f59e0b44" }}>
          <p style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Nouveau pays</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { key: "code", label: "Code ISO (ex: SN)", upper: true },
              { key: "name", label: "Nom du pays" },
              { key: "currency", label: "Devise (ex: XOF)" },
              { key: "phonePrefix", label: "Indicatif (ex: 221)" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 4 }}>{f.label}</label>
                <input
                  value={(nc as any)[f.key]}
                  onChange={e => setNc(p => ({ ...p, [f.key]: f.upper ? e.target.value.toUpperCase() : e.target.value }))}
                  data-testid={`input-country-${f.key}`}
                  style={{ width: "100%", background: "#0d0d0d", border: "1px solid #333", borderRadius: 8, padding: "8px 10px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => addCountryMut.mutate(nc)}
              disabled={addCountryMut.isPending || !nc.code || !nc.name || !nc.currency || !nc.phonePrefix}
              data-testid="button-save-country"
              style={{ flex: 1, background: "#22c55e", border: "none", borderRadius: 8, padding: "10px 0", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: addCountryMut.isPending ? 0.6 : 1 }}
            >
              {addCountryMut.isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button onClick={() => setShowAddCountry(false)} style={{ flex: 1, background: "#2a2a2a", border: "none", borderRadius: 8, padding: "10px 0", color: "#9ca3af", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Annuler
            </button>
          </div>
          {addCountryMut.isError && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{(addCountryMut.error as any)?.message || "Erreur"}</p>}
        </div>
      )}

      {/* ── Country list ── */}
      {countries.map(c => {
        const isOpen = expanded === c.code;
        const isEditing = editingCode === c.code;
        const ef = editForm[c.code] || c;

        return (
          <div key={c.code} style={{ background: "#1a1a1a", borderRadius: 12, border: `1px solid ${c.isActive ? "#2a2a2a" : "#3a1a1a"}`, overflow: "hidden" }}>

            {/* ── Country header row ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
              {/* Active toggle */}
              <button
                onClick={() => updateCountryMut.mutate({ code: c.code, data: { isActive: !c.isActive } })}
                title={c.isActive ? "Désactiver" : "Activer"}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
              >
                {c.isActive
                  ? <ToggleRight style={{ width: 24, height: 24, color: "#22c55e" }} />
                  : <ToggleLeft style={{ width: 24, height: 24, color: "#6b7280" }} />
                }
              </button>

              {/* Country info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {["name", "currency", "phonePrefix"].map(field => (
                      <input
                        key={field}
                        value={(ef as any)[field]}
                        onChange={e => setEditForm(p => ({ ...p, [c.code]: { ...ef, [field]: e.target.value } }))}
                        placeholder={field}
                        style={{ background: "#0d0d0d", border: "1px solid #444", borderRadius: 6, padding: "5px 8px", color: "white", fontSize: 13, outline: "none" }}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 15 }}>{c.code}</span>
                    <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>{c.currency} · +{c.phonePrefix}</span>
                    <span style={{ background: "#1f2937", color: "#60a5fa", fontSize: 11, padding: "2px 7px", borderRadius: 20 }}>
                      {c.operators.length} opérateur{c.operators.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {isEditing ? (
                  <>
                    <button onClick={() => updateCountryMut.mutate({ code: c.code, data: { name: ef.name, currency: ef.currency, phonePrefix: ef.phonePrefix } })}
                      style={{ background: "#22c55e", border: "none", borderRadius: 6, padding: "5px 10px", color: "white", fontSize: 12, cursor: "pointer" }}>
                      <Check style={{ width: 14, height: 14 }} />
                    </button>
                    <button onClick={() => setEditingCode(null)}
                      style={{ background: "#2a2a2a", border: "none", borderRadius: 6, padding: "5px 10px", color: "#9ca3af", fontSize: 12, cursor: "pointer" }}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </>
                ) : (
                  <button onClick={() => startEdit(c)} data-testid={`button-edit-${c.code}`}
                    style={{ background: "#1f2937", border: "none", borderRadius: 6, padding: "5px 10px", color: "#60a5fa", fontSize: 12, cursor: "pointer" }}>
                    <Pencil style={{ width: 14, height: 14 }} />
                  </button>
                )}
                <button
                  onClick={() => { if (confirm(`Supprimer ${c.name} et tous ses opérateurs ?`)) deleteCountryMut.mutate(c.code); }}
                  data-testid={`button-delete-${c.code}`}
                  style={{ background: "#2a0a0a", border: "none", borderRadius: 6, padding: "5px 10px", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
                <button onClick={() => setExpanded(isOpen ? null : c.code)}
                  style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "5px 8px", color: "#9ca3af", cursor: "pointer" }}>
                  {isOpen ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            </div>

            {/* ── Operators section (expanded) ── */}
            {isOpen && (
              <div style={{ borderTop: "1px solid #2a2a2a", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>Opérateurs de retrait</p>

                {c.operators.length === 0 && (
                  <p style={{ color: "#4b5563", fontSize: 13 }}>Aucun opérateur — ajoutez-en un ci-dessous.</p>
                )}

                {c.operators.map(op => (
                  <div key={op.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d0d0d", borderRadius: 8, padding: "8px 12px" }}>
                    <span style={{ color: "white", fontSize: 14 }}>{op.operatorName}</span>
                    <button
                      onClick={() => { if (confirm(`Supprimer "${op.operatorName}" ?`)) deleteOpMut.mutate(op.id); }}
                      data-testid={`button-delete-op-${op.id}`}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}>
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ))}

                {/* Add operator input */}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input
                    value={newOpInput[c.code] || ""}
                    onChange={e => setNewOpInput(p => ({ ...p, [c.code]: e.target.value }))}
                    placeholder="Nom de l'opérateur (ex: Wave)"
                    data-testid={`input-operator-${c.code}`}
                    style={{ flex: 1, background: "#0d0d0d", border: "1px solid #333", borderRadius: 8, padding: "8px 10px", color: "white", fontSize: 13, outline: "none" }}
                    onKeyDown={e => { if (e.key === "Enter" && newOpInput[c.code]) addOpMut.mutate({ code: c.code, name: newOpInput[c.code] }); }}
                  />
                  <button
                    onClick={() => { if (newOpInput[c.code]) addOpMut.mutate({ code: c.code, name: newOpInput[c.code] }); }}
                    disabled={!newOpInput[c.code] || addOpMut.isPending}
                    data-testid={`button-add-op-${c.code}`}
                    style={{ background: "#f59e0b", border: "none", borderRadius: 8, padding: "8px 14px", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: !newOpInput[c.code] ? 0.5 : 1 }}>
                    <Plus style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {countries.length === 0 && !isLoading && (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
          <Globe style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.3 }} />
          <p>Aucun pays configuré. Ajoutez le premier pays.</p>
        </div>
      )}
    </div>
  );
}
