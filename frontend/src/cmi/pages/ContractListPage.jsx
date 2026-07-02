import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchContracts, deleteContract } from "../api/cmiApi";
import { agentPipelinePhaseToStepIndex, CONTRACT_AGENT_PIPELINE_STEPS } from "../utils/contractAgentPipeline";

// ── Icons ──────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconMore = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-3)" }}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconFileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#2563eb" }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconList = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconRefreshCw = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ── Utils ──────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Active: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Pending Review": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "On Hold": { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  "AI Processing": { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  Done: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function contractMatchesStatusFilter(status, filter) {
  if (!filter) return true;
  const t = (status || "").trim().toLowerCase();
  switch (filter) {
    case "Active": return t === "active";
    case "Pending Review": return t === "pending review";
    case "On Hold": return t === "on hold";
    default: return (status || "") === filter;
  }
}

function agentPipelinePhaseToShortLabel(phase) {
  const idx = agentPipelinePhaseToStepIndex(phase);
  return CONTRACT_AGENT_PIPELINE_STEPS[idx]?.shortLabel || "Upload";
}

function contractAgentHoverVisible(c) {
  if (c.status === "AI Processing") return true;
  const p = c.contract_metadata?.agent_pipeline_phase;
  return p && typeof p === "string";
}

function contractAgentPipelineFinishedSuccess(c) {
  const p = c.contract_metadata?.agent_pipeline_phase;
  return p === "complete";
}

// ── Components ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || { color: "#4b5563", bg: "#f3f4f6", border: "#e5e7eb" };
  return (
    <span style={{ 
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 500,
      color: style.color, backgroundColor: style.bg, border: `1px solid ${style.border}`,
      whiteSpace: "nowrap"
    }}>
      {status}
    </span>
  );
};

const ConfidenceBadge = ({ value }) => (
  <span style={{ fontSize: 11, background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4, color: "var(--text-3)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: value >= 90 ? "var(--green)" : value >= 70 ? "var(--amber)" : "var(--red)" }} />
    {Math.round(value)}%
  </span>
);

export default function ContractListPage({ embed = false }) {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [archiveScope, setArchiveScope] = useState("unarchived");
  const [viewMode, setViewMode] = useState("list");
  
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  const refreshList = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchContracts({ archived: archiveScope === "archived" })
      .then((res) => setContracts(res.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [archiveScope]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const filtered = contracts.filter((c) => {
    const s = c.title.toLowerCase().includes(search.toLowerCase()) || (c.vendor_name || "").toLowerCase().includes(search.toLowerCase());
    const st = contractMatchesStatusFilter(c.status, statusFilter);
    const tp = !typeFilter || c.type === typeFilter;
    return s && st && tp;
  });

  const isArchived = (c) => c.is_archived === true;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteContract(confirmDelete.id);
      setSuccessMsg(`Contract archived`);
      setConfirmDelete(null);
      setTimeout(() => setSuccessMsg(null), 4000);
      refreshList();
    } catch (e) {
      setError(e.message || "Failed to archive contract");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Contract Title", "Vendor", "Type", "Status", "Start Date", "End Date", "Total Spend"].join(",");
    const rows = filtered.map((c) => [
      c.title,
      c.vendor_name || "—",
      c.type || "—",
      c.status || "—",
      c.start_date ? new Date(c.start_date).toLocaleDateString() : "—",
      c.end_date ? new Date(c.end_date).toLocaleDateString() : "—",
      c.contract_metadata?.total_spend || "—"
    ].map(val => `"${val}"`).join(","));

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contracts_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={embed ? "" : "shell-page"} style={embed ? { padding: 0 } : { padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: embed ? "flex-end" : "space-between", alignItems: "center", marginBottom: 24 }}>
        {!embed && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ background: "white", padding: "6px 16px", borderRadius: 999, border: "1px solid #e2e8f0", fontSize: 13, fontWeight: 500, color: "#2563eb", display: "inline-flex" }}>
              Contracts
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleExportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", color: "var(--text-2)" }}
          >
            <IconDownload /> Export
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/entities/contracts/upload`)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "white", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            <IconPlus /> Upload Contract
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}
      {successMsg && <div className="alert alert-success mb-2">{successMsg}</div>}

      {/* ── Filter Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>
          Showing <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{filtered.length}</span> of {contracts.length} contracts
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showSearch && (
            <div style={{ position: "relative" }}>
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, width: 200, outline: "none" }}
              />
            </div>
          )}
          
          <button onClick={() => setShowSearch(!showSearch)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "white", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", color: "var(--text-2)" }}>
            <IconSearch />
          </button>

          <button onClick={() => setShowFilters(!showFilters)} style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #e2e8f0", padding: "0 12px", height: 32, borderRadius: 6, cursor: "pointer", color: "var(--text-2)", fontSize: 13, fontWeight: 500 }}>
            <IconFilter /> Filter
          </button>

          <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden", height: 32, background: "white" }}>
            <button onClick={() => setViewMode("list")} style={{ background: viewMode === "list" ? "#f1f5f9" : "transparent", border: "none", width: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)", borderRight: "1px solid #e2e8f0" }}>
              <IconList />
            </button>
            <button onClick={() => setViewMode("card")} style={{ background: viewMode === "card" ? "#f1f5f9" : "transparent", border: "none", width: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}>
              <IconGrid />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16, padding: "16px", background: "white", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase" }}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 13, minWidth: 150, outline: "none" }}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Review">Pending Review</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase" }}>Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 13, minWidth: 150, outline: "none" }}>
              <option value="">All Types</option>
              <option value="Master Agreement">Master Agreement</option>
              <option value="Purchase Order">Purchase Order</option>
              <option value="Amendment">Amendment</option>
              <option value="Renewal">Renewal</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase" }}>Archive Status</label>
            <select value={archiveScope} onChange={(e) => setArchiveScope(e.target.value)} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 13, minWidth: 120, outline: "none" }}>
              <option value="unarchived">Unarchived</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Content View ── */}
      {loading ? (
        <div className="empty" style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <span className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ background: "white", border: "1px solid var(--border)", padding: "64px 32px", borderRadius: 8, textAlign: "center" }}>
          <div className="empty-title" style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>No contracts found</div>
          <div className="empty-sub" style={{ fontSize: 14, color: "var(--text-3)" }}>No contracts match your current filters.</div>
        </div>
      ) : viewMode === "list" ? (
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contract</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Agent Status</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expires</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const arch = isArchived(c);
                const phase = typeof c.contract_metadata?.agent_pipeline_phase === "string" ? c.contract_metadata.agent_pipeline_phase : undefined;
                
                return (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${projectId}/entities/contracts/${c.id}`)}
                    style={{ borderBottom: "1px solid #f1f5f9", background: "white" }}
                  >
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <IconFileText />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>{c.title}</div>
                          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, textTransform: "uppercase" }}>{c.vendor_name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--text-2)" }}>{c.type}</td>
                    <td style={{ padding: "16px 20px" }}>
                      {c.status === "AI Processing" ? <span style={{ fontSize: 11, color: "var(--text-3)" }}>—</span> : <StatusBadge status={c.status} />}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      {c.status === "AI Processing" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="spinner" style={{ width: 12, height: 12 }} />
                            <StatusBadge status={c.status} />
                          </div>
                          <span style={{ fontSize: 10, color: "var(--text-3)" }}>Stage: {agentPipelinePhaseToShortLabel(phase)}</span>
                        </div>
                      ) : contractAgentPipelineFinishedSuccess(c) ? (
                        <StatusBadge status="Done" />
                      ) : contractAgentHoverVisible(c) ? (
                        <span style={{ fontSize: 10, color: "var(--text-3)" }}>Stage: {agentPipelinePhaseToShortLabel(phase)}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--text-3)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--text-3)" }}>
                      {formatDate(c.end_date)}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}/entities/contracts/${c.id}`); }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-3)", display: "inline-flex", padding: 4 }}
                      >
                        <IconMore />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map((c) => {
            const phase = typeof c.contract_metadata?.agent_pipeline_phase === "string" ? c.contract_metadata.agent_pipeline_phase : undefined;
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/projects/${projectId}/entities/contracts/${c.id}`)}
                style={{ background: "white", border: "1px solid var(--border)", borderRadius: 8, padding: 20, cursor: "pointer", transition: "all 0.2s" }}
                className="project-card"
              >
                <div style={{ display: "flex", alignItems: "start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IconFileText />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--text)", fontSize: 14 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{c.vendor_name}</div>
                  </div>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {c.status === "AI Processing" ? (
                      <span style={{ fontSize: 13, color: "var(--text-3)" }}>—</span>
                    ) : (
                      <>
                        <StatusBadge status={c.status} />
                        {c.ai_confidence != null && c.ai_confidence > 0 && <ConfidenceBadge value={c.ai_confidence} />}
                      </>
                    )}
                  </div>
                  
                  {c.status === "AI Processing" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="spinner" style={{ width: 14, height: 14 }} />
                        <StatusBadge status={c.status} />
                        {c.ai_confidence != null && c.ai_confidence > 0 && <ConfidenceBadge value={c.ai_confidence} />}
                      </div>
                      <span style={{ fontSize: 10, color: "var(--text-3)" }}>Stage: {agentPipelinePhaseToShortLabel(phase)}</span>
                    </div>
                  ) : contractAgentPipelineFinishedSuccess(c) ? (
                    <div style={{ marginTop: 4 }}><StatusBadge status="Done" /></div>
                  ) : contractAgentHoverVisible(c) ? (
                    <span style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>Stage: {agentPipelinePhaseToShortLabel(phase)}</span>
                  ) : null}
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-3)", display: "block" }}>Type</span>
                    <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{c.type}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "var(--text-3)", display: "block" }}>Expires</span>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>
                      {formatDate(c.end_date)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8, width: "100%", maxWidth: 400, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px 0", color: "#ef4444" }}>Archive contract?</h3>
            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.5 }}>
              Archive "{confirmDelete.title}"? It will move to archived contracts and can no longer be edited or reprocessed.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn btn-ghost"
                style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13.5, cursor: "pointer", border: "1px solid var(--border)", background: "white" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn btn-primary"
                style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13.5, cursor: "pointer", background: "#ef4444", color: "white", border: "none" }}
              >
                Archive Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
