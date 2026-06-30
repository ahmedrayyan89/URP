import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchContractById, fetchContractAgentStatus, updateContract, fetchContractTerms, fetchContractDocuments, updateContractTerm } from "../api/cmiApi";
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
  const [terms, setTerms] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("details");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setLoading(true);
    fetchContractById(id)
      .then((c) => {
        setContract(c);
        setEditForm({ title: c.title, status: c.status, type: c.type, total_value: c.total_value });
        return Promise.all([
          fetchContractAgentStatus(id).catch(() => null),
          fetchContractTerms(id).catch(() => []),
          fetchContractDocuments(id).catch(() => []),
        ]);
      })
      .then(([status, t, d]) => {
        setAgentStatus(status);
        setTerms(t);
        setDocuments(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    try {
      const updated = await updateContract(id, editForm);
      setContract(updated);
      setIsEditing(false);
    } catch (e) {
      alert("Failed to update contract: " + e.message);
    }
  };

  const handleTermStatusChange = async (termId, newStatus) => {
    try {
      const updatedTerm = await updateContractTerm(id, termId, newStatus);
      setTerms(prev => prev.map(t => t.id === termId ? updatedTerm : t));
    } catch (e) {
      alert("Failed to update term status: " + e.message);
    }
  };

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
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            {isEditing ? (
              <input 
                className="input" 
                value={editForm.title} 
                onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, padding: "4px 8px", width: "100%", minWidth: 300 }}
              />
            ) : (
              <h1 className="shell-page-title" style={{ marginBottom: 6 }}>{contract.title}</h1>
            )}
            
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
              {isEditing ? (
                <>
                  <select className="input" style={{ padding: "4px 8px", height: 28, fontSize: 12 }} value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                  <select className="input" style={{ padding: "4px 8px", height: 28, fontSize: 12 }} value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})}>
                    <option value="Master Agreement">Master Agreement</option>
                    <option value="Purchase Order">Purchase Order</option>
                    <option value="Amendment">Amendment</option>
                    <option value="Renewal">Renewal</option>
                  </select>
                </>
              ) : (
                <>
                  <span className={`badge ${STATUS_COLORS[contract.status] || "badge-grey"}`}>{contract.status}</span>
                  <span className="badge badge-grey">{contract.type}</span>
                </>
              )}
              {contract.vendor_name && <span style={{ fontSize: 13, color: "var(--text-2)" }}>{contract.vendor_name}</span>}
            </div>
          </div>
          <div>
            {isEditing ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => {setIsEditing(false); setEditForm({title: contract.title, status: contract.status, type: contract.type, total_value: contract.total_value});}}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleUpdate}>Save</button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>Edit Contract</button>
            )}
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 0 }}>
          {[
            { 
              label: "Total Value", 
              value: isEditing ? (
                <input type="number" className="input" style={{ width: 100, padding: 4 }} value={editForm.total_value || ""} onChange={(e) => setEditForm({...editForm, total_value: e.target.value})} />
              ) : (contract.total_value ? `$${Number(contract.total_value).toLocaleString()}` : "—")
            },
            { label: "Extracted Terms", value: contract.extracted_terms },
            { label: "Start Date", value: new Date(contract.start_date).toLocaleDateString() },
            { label: "End Date", value: new Date(contract.end_date).toLocaleDateString() },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ padding: "12px 16px" }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="kb-detail-tabs mb-2">
        {["details", "terms & clauses", "documents", "line items", "agent pipeline"].map((t) => (
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

      {tab === "terms & clauses" && (
        <div className="card" style={{ padding: 0 }}>
          {terms.length === 0 ? (
            <div className="empty" style={{ padding: 40 }}>
              <div className="empty-title">No Terms Found</div>
              <div className="empty-sub">No terms or clauses have been extracted for this contract yet.</div>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Clause</th>
                    <th>Category</th>
                    <th>Extracted Value</th>
                    <th>Confidence</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {terms.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 500 }}>{t.clause}</td>
                      <td><span className="badge badge-grey">{t.category}</span></td>
                      <td style={{ maxWidth: 300, whiteSpace: "normal" }}>{t.extracted_value}</td>
                      <td>
                        <span style={{ color: t.confidence >= 90 ? "var(--green)" : t.confidence >= 70 ? "var(--amber)" : "var(--red)" }}>
                          {t.confidence}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'Verified' ? 'badge-green' : t.status === 'Disputed' ? 'badge-grey' : 'badge-amber'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: "4px 8px", fontSize: 12, color: "var(--green)" }}
                            onClick={() => handleTermStatusChange(t.id, "Verified")}
                            disabled={t.status === "Verified"}
                          >✓ Verify</button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: "4px 8px", fontSize: 12, color: "var(--red)" }}
                            onClick={() => handleTermStatusChange(t.id, "Disputed")}
                            disabled={t.status === "Disputed"}
                          >✕ Dispute</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary btn-sm">Upload Document</button>
          </div>
          {documents.length === 0 ? (
            <div className="empty" style={{ padding: 40 }}>
              <div className="empty-title">No Documents</div>
              <div className="empty-sub">No files have been uploaded to this contract.</div>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Version</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Uploaded At</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 500, color: "var(--primary)" }}>{d.file_name}</td>
                      <td><span className="badge badge-grey">{d.version}</span></td>
                      <td>{(d.file_size / 1024).toFixed(1)} KB</td>
                      <td>{d.mime_type}</td>
                      <td>{new Date(d.uploaded_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-ghost btn-sm">Download</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "line items" && (
        <div className="card">
          <div className="empty" style={{ padding: 40, border: "1px dashed var(--border)", borderRadius: 8 }}>
            <div className="empty-title">Line Items Processing</div>
            <div className="empty-sub">Priced line items and ingredients have not been fully mapped for this contract yet.</div>
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
