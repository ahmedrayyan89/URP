import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchContractById, fetchContractAgentStatus } from "../api/cmiApi";
import { agentPipelinePhaseToStepIndex, CONTRACT_AGENT_PIPELINE_STEPS } from "../utils/contractAgentPipeline";

const STATUS_COLORS = {
  Active: "badge-green", Expired: "badge-grey", "Pending Review": "badge-amber",
  "AI Processing": "badge-blue", "On Hold": "badge-amber",
};

export default function ContractDetailPage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("details");

  useEffect(() => {
    setLoading(true);
    fetchContractById(id)
      .then((c) => {
        setContract(c);
        return fetchContractAgentStatus(id).catch(() => null);
      })
      .then(setAgentStatus)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="empty"><span className="spinner" style={{ width: 24, height: 24 }} /></div>;
  if (error) return <div className="shell-page"><div className="alert alert-error">{error}</div></div>;
  if (!contract) return null;

  const phase = agentStatus?.agent_pipeline_phase;
  const stepIdx = agentPipelinePhaseToStepIndex(phase);

  return (
    <div className="shell-page">
      <button className="btn btn-sm mb-4" style={{ display: "flex", alignItems: "center", gap: 6 }}
        onClick={() => navigate(`/projects/${projectId}/entities/contracts`)}>
        ← Back to Contracts
      </button>

      {/* Header */}
      <div className="card mb-4">
        <div className="card-header">
          <div>
            <h1 className="shell-page-title" style={{ marginBottom: 6 }}>{contract.title}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className={`badge ${STATUS_COLORS[contract.status] || "badge-grey"}`}>{contract.status}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{contract.type}</span>
              {contract.vendor_name && <span style={{ fontSize: 12, color: "var(--text-2)" }}>{contract.vendor_name}</span>}
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 0 }}>
          {[
            { label: "Total Value", value: contract.total_value ? `$${Number(contract.total_value).toLocaleString()}` : "—" },
            { label: "Extracted Terms", value: contract.extracted_terms },
            { label: "Start Date", value: new Date(contract.start_date).toLocaleDateString() },
            { label: "End Date", value: new Date(contract.end_date).toLocaleDateString() },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ padding: "12px 16px" }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="kb-detail-tabs mb-2">
        {["details", "agent pipeline"].map((t) => (
          <button key={t} className={`kb-detail-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="card">
          <h3 className="card-title mb-4">Contract Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
            {[
              ["Contract ID", contract.id],
              ["Vendor", contract.vendor_name || "—"],
              ["Uploaded By", contract.uploaded_by_name || "—"],
              ["Uploaded At", new Date(contract.uploaded_at).toLocaleString()],
              ["Last Modified", new Date(contract.last_modified).toLocaleString()],
              ["AI Confidence", contract.ai_confidence != null ? `${contract.ai_confidence}%` : "—"],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, color: "var(--text)", wordBreak: "break-all" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "agent pipeline" && (
        <div className="card">
          <h3 className="card-title mb-4">Contract Agent Pipeline</h3>
          {/* Pipeline steps */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 20 }}>
            {CONTRACT_AGENT_PIPELINE_STEPS.map((step, idx) => {
              const isDone = phase === "complete" || idx < stepIdx;
              const isCurrent = idx === stepIdx && phase !== "complete" && phase !== "failed";
              const isError = phase === "failed" && idx === stepIdx;
              return (
                <div key={step.id} style={{ textAlign: "center" }} title={step.purpose}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, margin: "0 auto 6px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid",
                    borderColor: isError ? "var(--red)" : isDone ? "var(--green)" : isCurrent ? "var(--primary)" : "var(--border-2)",
                    background: isError ? "var(--red-dim)" : isDone ? "var(--green-dim)" : isCurrent ? "var(--primary-light)" : "var(--surface-2)",
                  }}>
                    {isDone ? "✓" : isCurrent ? <span className="spinner" style={{ width: 14, height: 14 }} /> : isError ? "✕" : idx + 1}
                  </div>
                  <div style={{ fontSize: 10, color: isCurrent ? "var(--primary)" : isDone ? "var(--green)" : "var(--text-3)" }}>
                    {step.shortLabel}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Trace */}
          {agentStatus?.agent_graph_trace?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 8 }}>Graph Trace</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {agentStatus.agent_graph_trace.map((t, i) => (
                  <div key={i} style={{ fontSize: 12, padding: "4px 10px", background: "var(--surface-2)", borderRadius: 6, border: "1px solid var(--border)", color: "var(--text-2)" }}>{t}</div>
                ))}
              </div>
            </div>
          )}
          {agentStatus?.agent_cross_check_warnings?.length > 0 && (
            <div className="alert alert-warn mt-3">
              <strong>Cross-check warnings:</strong>
              <ul style={{ margin: "4px 0 0 16px" }}>
                {agentStatus.agent_cross_check_warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          {!agentStatus && <div className="empty-sub">No agent pipeline data available for this contract.</div>}
        </div>
      )}
    </div>
  );
}
