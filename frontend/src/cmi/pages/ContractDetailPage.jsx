import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchContractById, fetchContractTerms, fetchContractExtractedIngredients, resumeContractAgent } from "../api/cmiApi";
import { agentPipelinePhaseToStepIndex, CONTRACT_AGENT_PIPELINE_STEPS } from "../utils/contractAgentPipeline";

// ── Inline Pipeline Progress ───────────────────────────────────────────────
function ContractAgentPipelineProgress({ activeStepIndex, hint }) {
  const safeIdx = Math.min(Math.max(activeStepIndex, 0), CONTRACT_AGENT_PIPELINE_STEPS.length - 1);
  const label = CONTRACT_AGENT_PIPELINE_STEPS[safeIdx]?.label ?? "Working…";
  const pct = Math.min(100, ((Math.min(activeStepIndex, 5) + 1) / 6) * 100);
  return (
    <div style={{ padding: 12, border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 8, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="spinner" style={{ width: 16, height: 16, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text)" }}>
            <span style={{ fontWeight: 500 }}>Contract Agent</span>
            <span style={{ color: "var(--text-3)" }}> — {label}</span>
          </p>
          {hint && <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-3)" }}>{hint}</p>}
        </div>
      </div>
      <div style={{ marginTop: 8, height: 4, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "#2563eb", width: `${pct}%`, transition: "width 0.3s ease" }} />
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ── Utils ──────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Active:           { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Pending Review": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "On Hold":        { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  "AI Processing":  { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  Done:             { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Needs Review":   { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Verified:         { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  Disputed:         { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || { color: "#4b5563", bg: "#f3f4f6", border: "#e5e7eb" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 500, color: s.color, background: s.bg, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
};

function formatCurrency(v) { return v == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"; }

function isAgentHitlPaused(c) {
  if (c.status !== "Pending Review") return false;
  const h = c.contract_metadata?.agent_hitl;
  return !!h && typeof h === "object";
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ContractDetailPage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract]                           = useState(null);
  const [terms, setTerms]                                 = useState([]);
  const [extractedIngredients, setExtractedIngredients]   = useState([]);
  const [extractedIngredientsLoading, setExtractedIngredientsLoading] = useState(true);
  const [tab, setTab]                                     = useState("details");
  const [resumingAgent, setResumingAgent]                 = useState(false);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setExtractedIngredientsLoading(false); return; }
    setExtractedIngredientsLoading(true);
    fetchContractById(id).then(setContract).catch(() => {});
    fetchContractTerms(id).then(setTerms).catch(() => setTerms([]));
    fetchContractExtractedIngredients(id)
      .then(setExtractedIngredients)
      .catch(() => setExtractedIngredients([]))
      .finally(() => setExtractedIngredientsLoading(false));
  }, [id]);

  // ── Polling while AI Processing ───────────────────────────────────────────
  useEffect(() => {
    if (!id || contract?.status !== "AI Processing") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const c = await fetchContractById(id);
        if (!c || cancelled) return;
        if (c.status !== "AI Processing") {
          const [tms, ing] = await Promise.all([
            fetchContractTerms(id).catch(() => []),
            fetchContractExtractedIngredients(id).catch(() => []),
          ]);
          if (!cancelled) { setTerms(tms); setExtractedIngredients(ing); setExtractedIngredientsLoading(false); }
        }
        if (!cancelled) setContract(c);
      } catch { /* ignore */ }
    };
    const iv = setInterval(() => void tick(), 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [id, contract?.status]);

  const materialsCount = useMemo(() => extractedIngredients?.length || 0, [extractedIngredients]);

  if (!contract) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
      <span className="spinner" style={{ width: 24, height: 24 }} />
    </div>
  );

  const isArchived    = contract.is_archived === true;
  const hitlPaused    = !isArchived && isAgentHitlPaused(contract);
  const hitlPayload   = contract.contract_metadata?.agent_hitl || {};
  const llmPolicy     = contract.contract_metadata?.agent_llm_policy || {};
  const ccWarnings    = contract.contract_metadata?.agent_cross_check_warnings;
  const ccWarnList    = Array.isArray(ccWarnings) ? ccWarnings : [];
  const productsCount = contract.product_count > 0 ? contract.product_count : (contract.vendor_product_count || 0);

  const handleResumeAgent = async () => {
    if (!id || !hitlPaused) return;
    setResumingAgent(true);
    try {
      await resumeContractAgent(id, {});
    } catch (e) {
      alert("Could not resume extraction: " + e.message);
    } finally {
      setResumingAgent(false);
    }
  };

  const archivedTooltip = "This contract is archived. You cannot review or edit terms.";

  return (
    <div className="shell-page" style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Breadcrumb ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <span onClick={() => navigate(`/projects/${projectId}/entities/contracts`)} style={{ color: "#2563eb", cursor: "pointer", fontWeight: 500 }}>Contracts</span>
          <span style={{ color: "#cbd5e1" }}>›</span>
          <span style={{ color: "#64748b", fontWeight: 500 }}>{contract.title}</span>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(`/projects/${projectId}/entities/contracts/${id}/pdf`)}
            style={{ display: "inline-flex", alignItems: "center", background: "white", border: "1px solid #e2e8f0", padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151" }}
          >
            <IconEye /> View PDF
          </button>
          {!isArchived ? (
            <button
              onClick={() => navigate(`/projects/${projectId}/entities/contracts/${id}/review`)}
              style={{ display: "inline-flex", alignItems: "center", background: "white", border: "1px solid #e2e8f0", padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151" }}
            >
              <IconCheckCircle /> Review &amp; confirm
            </button>
          ) : (
            <button disabled title={archivedTooltip} style={{ display: "inline-flex", alignItems: "center", background: "#f9fafb", border: "1px solid #e2e8f0", padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "not-allowed", color: "#9ca3af" }}>
              <IconCheckCircle /> Review &amp; confirm
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e2e8f0", marginBottom: 20 }}>
        {[
          { key: "details",  label: "Details" },
          { key: "terms",    label: `Extracted Terms` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: tab === key ? 600 : 500, cursor: "pointer",
              background: "transparent", border: "none", borderBottom: tab === key ? "2px solid #2563eb" : "2px solid transparent",
              color: tab === key ? "#2563eb" : "#6b7280", transition: "all 0.15s",
            }}
          >
            {label}{key === "terms" ? ` (${terms.length})` : ""}
          </button>
        ))}
      </div>

      {/* ── HITL Banner ── */}
      {hitlPaused && (
        <div style={{ padding: 16, borderRadius: 8, border: "1px solid #fcd34d", background: "#fef3c7", color: "#78350f", fontSize: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <IconAlertTriangle />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: "0 0 8px 0" }}>Agent review required before extraction</p>
              <p style={{ margin: "0 0 12px 0", color: "#92400e" }}>
                The ingestion agent paused (cross-check or LLM policy). The PDF is saved; terms and ingredients are not extracted yet. Confirm vendor and dates below, then continue.
              </p>
              {typeof hitlPayload.llm_rationale === "string" && hitlPayload.llm_rationale.trim() && (
                <p style={{ borderTop: "1px solid #fde68a", paddingTop: 8, margin: "0 0 8px 0", color: "#92400e" }}>
                  <span style={{ fontWeight: 500 }}>Policy note: </span>{hitlPayload.llm_rationale}
                </p>
              )}
              {ccWarnList.length > 0 && (
                <ul style={{ borderTop: "1px solid #fde68a", paddingTop: 8, margin: "0 0 8px 0", paddingLeft: 20 }}>
                  {ccWarnList.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
              {llmPolicy.rationale && !hitlPayload.llm_rationale && (
                <p style={{ borderTop: "1px solid #fde68a", paddingTop: 8, margin: 0, fontSize: 12, color: "#92400e" }}>
                  <span style={{ fontWeight: 500 }}>LLM policy: </span>{String(llmPolicy.rationale)}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <button
                  onClick={handleResumeAgent}
                  disabled={resumingAgent}
                  style={{ padding: "7px 14px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: resumingAgent ? "not-allowed" : "pointer" }}
                >
                  {resumingAgent ? "Resuming…" : "Continue extraction"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Processing progress ── */}
      {contract.status === "AI Processing" && (
        <ContractAgentPipelineProgress
          activeStepIndex={agentPipelinePhaseToStepIndex(contract.contract_metadata?.agent_pipeline_phase)}
          hint="Extraction runs on the server in the background; this view refreshes every few seconds until terms and ingredients are ready."
        />
      )}

      {/* ── On Hold warning ── */}
      {contract.status === "On Hold" && !isArchived && (
        <div style={{ padding: 16, borderRadius: 8, border: "1px solid #fde047", background: "#fefce8", color: "#854d0e", fontSize: 14, marginBottom: 16 }}>
          <strong>On hold</strong> — Materials &amp; ingredients pricing could not be validated automatically.
          Review extracted lines, use <strong>Review &amp; confirm</strong> to verify data, and re-upload the updated contract.
          Contract activation is blocked until this is resolved.
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DETAILS TAB                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === "details" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* Contract information card */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 20px 0", color: "#111827" }}>Contract Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
              {[
                ["Contract ID",   contract.id],
                ["Vendor",        contract.vendor_name || "—"],
                ["Type",          contract.type],
                ["Value",         formatCurrency(contract.total_value)],
                ["Start Date",    formatDate(contract.start_date)],
                ["End Date",      formatDate(contract.end_date)],
                ["Products",      productsCount],
                ["Uploaded By",   contract.uploaded_by_name || "System"],
                ["Last Modified", formatDate(contract.last_modified)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", wordBreak: "break-all" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar: Status + counts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>Status</span>
                <StatusBadge status={contract.status} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Extracted Terms</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{contract.extracted_terms || terms.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Raw Materials</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                    {extractedIngredientsLoading
                      ? <span className="spinner" style={{ width: 12, height: 12 }} />
                      : materialsCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* EXTRACTED TERMS TAB                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === "terms" && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                {["Clause", "Category", "Extracted Value", "Reference", "Status"].map((h, i, a) => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", width: ["18%","14%","38%","16%","14%"][i] }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {terms.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af", fontSize: 14 }}>
                    No extracted terms yet.
                  </td>
                </tr>
              ) : terms.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 500, fontSize: 13, color: "#111827" }}>{t.clause}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>{t.category}</td>
                  <td style={{ padding: "14px 16px", fontWeight: 500, fontSize: 13, color: "#111827" }}>{t.extracted_value}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#2563eb" }}>{t.page_ref || "N/A"}</td>
                  <td style={{ padding: "14px 16px" }}><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
