import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchContracts, bulkArchiveContracts } from "../api/cmiApi";

// ── Icons ──────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-3)" }}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconFilter = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
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

const IconFileDoc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#2563eb" }}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const IconArchive = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

const STATUS_COLORS = {
  Active: "badge-green",
  Expired: "badge-grey",
  "Pending Review": "badge-amber",
  "AI Processing": "badge-blue",
  "On Hold": "badge-amber",
  "Under Negotiation": "badge-blue",
  Superseded: "badge-grey",
};

function agentPipelinePhaseToShortLabel(phase) {
  switch ((phase || "").toLowerCase()) {
    case "queued": return "Queued";
    case "uploaded": return "Upload";
    case "extraction_running": return "Extract";
    case "reevaluating": return "Parse";
    case "saving_terms": return "Terms";
    case "saving_ingredients": return "Lines";
    case "complete": return "Done";
    case "failed": return "Failed";
    default: return phase || "Pending";
  }
}

export default function ContractListPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [archiveScope, setArchiveScope] = useState("unarchived");
  const [viewMode, setViewMode] = useState("list");
  
  // Modals / Confirmations
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkArchiving, setBulkArchiving] = useState(false);

  const refreshList = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchContracts({ archived: archiveScope === "archived" })
      .then((res) => {
        setContracts(res.items || []);
        setSelectedIds(new Set()); // clear selection on refresh
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [archiveScope]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const filtered = contracts.filter((c) => {
    const s =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.vendor_name || "").toLowerCase().includes(search.toLowerCase());
    
    let st = true;
    if (statusFilter) {
      st = (c.status || "").trim().toLowerCase() === statusFilter.toLowerCase();
    }
    
    let tp = true;
    if (typeFilter) {
      tp = c.type === typeFilter;
    }
    
    return s && st && tp;
  });

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Contract", "Vendor", "Type", "Status", "Expires"].join(",");
    const rows = filtered.map(c => [
      `"${c.title.replace(/"/g, '""')}"`,
      `"${(c.vendor_name || "").replace(/"/g, '""')}"`,
      `"${c.type}"`,
      `"${c.status}"`,
      `"${c.end_date ? new Date(c.end_date).toLocaleDateString() : ""}"`
    ].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "contracts_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await bulkArchiveContracts([confirmDelete.id]);
      setContracts(prev => prev.filter(c => c.id !== confirmDelete.id));
      setSuccessMsg(`Contract "${confirmDelete.title}" successfully archived.`);
    } catch (err) {
      setError(err.message || "Failed to archive contract.");
    } finally {
      setConfirmDelete(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const toggleSelection = (id) => {
    const newSel = new Set(selectedIds);
    if (newSel.has(id)) newSel.delete(id);
    else newSel.add(id);
    setSelectedIds(newSel);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to archive ${selectedIds.size} contracts?`)) return;
    
    setBulkArchiving(true);
    try {
      await bulkArchiveContracts(Array.from(selectedIds));
      setContracts(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSuccessMsg(`Successfully archived ${selectedIds.size} contracts.`);
      setSelectedIds(new Set());
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || "Failed to bulk archive.");
    } finally {
      setBulkArchiving(false);
    }
  };

  return (
    <div className="shell-page">
      {/* ── Header Row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}>
            <span>Entities</span>
            <span style={{ color: "var(--border)" }}>/</span>
            <span style={{ color: "var(--text-2)", fontWeight: 500 }}>Contracts</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className="shell-page-title" style={{ margin: 0 }}>Contracts</h1>
            <span className="badge badge-blue" style={{ textTransform: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>Contracts</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "white", border: "1px solid var(--border)", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            <IconDownload /> Export
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/entities/contracts/upload`)}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "white", border: "none", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            <IconPlus /> Upload Contract
          </button>
        </div>
      </div>

      {/* Alert notifications */}
      {error && <div className="alert alert-error mb-2">{error}</div>}
      {successMsg && <div className="alert alert-success mb-2" style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#047857", padding: "12px 16px", borderRadius: 8, fontSize: 14 }}>{successMsg}</div>}

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && archiveScope === "unarchived" && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 16px", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#1e3a8a", fontWeight: 500 }}>{selectedIds.size} contracts selected</span>
          <button 
            className="btn btn-sm" 
            style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #bfdbfe", color: "#1e40af" }}
            onClick={handleBulkArchive}
            disabled={bulkArchiving}
          >
            {bulkArchiving ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <IconArchive />}
            Archive Selected
          </button>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, color: "var(--text-3)", fontWeight: 500 }}>
          Showing {filtered.length} of {contracts.length} contracts
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Search container */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 12px 8px 32px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13.5, width: 220, outline: "none" }}
            />
          </div>

          {/* Filters */}
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "white", fontSize: 13.5, minWidth: 120, outline: "none", height: "auto" }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending Review">Pending Review</option>
            <option value="On Hold">On Hold</option>
            <option value="AI Processing">AI Processing</option>
          </select>

          <select
            className="input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "white", fontSize: 13.5, minWidth: 120, outline: "none", height: "auto" }}
          >
            <option value="">All Types</option>
            <option value="Master Agreement">Master Agreement</option>
            <option value="Purchase Order">Purchase Order</option>
            <option value="Amendment">Amendment</option>
            <option value="Renewal">Renewal</option>
          </select>

          <select
            className="input"
            value={archiveScope}
            onChange={(e) => { setArchiveScope(e.target.value); setSelectedIds(new Set()); }}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "white", fontSize: 13.5, minWidth: 120, outline: "none", height: "auto" }}
          >
            <option value="unarchived">Unarchived</option>
            <option value="archived">Archived</option>
          </select>

          {/* View Toggles */}
          <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
            <button
              onClick={() => setViewMode("list")}
              style={{ background: viewMode === "list" ? "#f3f4f6" : "white", border: "none", padding: "8px 10px", display: "flex", cursor: "pointer", outline: "none" }}
              title="List View"
            >
              <IconList />
            </button>
            <button
              onClick={() => setViewMode("card")}
              style={{ background: viewMode === "card" ? "#f3f4f6" : "white", border: "none", padding: "8px 10px", display: "flex", cursor: "pointer", outline: "none" }}
              title="Grid View"
            >
              <IconGrid />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <div className="empty" style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <span className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ background: "white", border: "1px solid var(--border)", padding: "64px 32px", borderRadius: 8, textAlign: "center" }}>
          <div className="empty-title" style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>No data available</div>
          <div className="empty-sub" style={{ fontSize: 14, color: "var(--text-3)" }}>No contracts found matching the active filters.</div>
        </div>
      ) : viewMode === "list" ? (
        <div className="card" style={{ padding: 0, border: "1px solid var(--border)", borderRadius: 8, background: "white", overflow: "hidden" }}>
          <div className="data-table-wrap">
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fcfcfc", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ width: "5%", padding: "12px 16px", textAlign: "center" }}>
                    <input 
                      type="checkbox" 
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleAll}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th style={{ width: "35%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "left", letterSpacing: "0.05em" }}>Contract</th>
                  <th style={{ width: "15%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "left", letterSpacing: "0.05em" }}>Type</th>
                  <th style={{ width: "15%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "left", letterSpacing: "0.05em" }}>Status</th>
                  <th style={{ width: "15%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "left", letterSpacing: "0.05em" }}>Agent Status</th>
                  <th style={{ width: "10%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "left", letterSpacing: "0.05em" }}>Expires</th>
                  <th style={{ width: "5%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "right", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`clickable-row ${selectedIds.has(c.id) ? "selected" : ""}`}
                    style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s", background: selectedIds.has(c.id) ? "#eff6ff" : "white" }}
                  >
                    <td style={{ padding: "12px 16px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelection(c.id)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    {/* Contract Details */}
                    <td 
                      style={{ padding: "12px 16px", cursor: "pointer" }}
                      onClick={() => navigate(`/projects/${projectId}/entities/contracts/${c.id}`)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <IconFileDoc />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13.5 }}>{c.title}</div>
                          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{c.vendor_name || "—"}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Type */}
                    <td style={{ padding: "12px 16px", fontSize: 13.5, color: "var(--text-2)" }}>
                      {c.type}
                    </td>
                    
                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      {c.status === "AI Processing" ? (
                        <span className="text-muted-foreground" style={{ fontSize: 12, color: "var(--text-3)" }}>—</span>
                      ) : (
                        <span className={`badge ${STATUS_COLORS[c.status] || "badge-grey"}`}>{c.status}</span>
                      )}
                    </td>
                    
                    {/* Agent Status */}
                    <td style={{ padding: "12px 16px", fontSize: 13.5 }}>
                      {c.status === "AI Processing" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="spinner" style={{ width: 12, height: 12, borderTopColor: "#2563eb" }} />
                            <span className="badge badge-blue">Processing</span>
                          </div>
                          <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                            Stage: {agentPipelinePhaseToShortLabel(c.contract_metadata?.agent_pipeline_phase)}
                          </span>
                        </div>
                      ) : c.status === "Active" || c.status === "Pending Review" || c.status === "On Hold" ? (
                        <span className="badge badge-green">Done</span>
                      ) : (
                        <span style={{ color: "var(--text-3)" }}>—</span>
                      )}
                    </td>
                    
                    {/* Expires */}
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-2)" }}>
                      {c.end_date ? new Date(c.end_date).toLocaleDateString() : "—"}
                    </td>
                    
                    {/* Actions */}
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => navigate(`/projects/${projectId}/entities/contracts/${c.id}`)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "6px 8px", borderRadius: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", color: "var(--text-2)" }}
                          title="View details"
                        >
                          <IconEye />
                        </button>
                        {archiveScope === "unarchived" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(c);
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "6px 8px", borderRadius: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", color: "var(--red)" }}
                            title="Archive"
                          >
                            <IconArchive />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/projects/${projectId}/entities/contracts/${c.id}`)}
              style={{ background: "white", border: "1px solid var(--border)", borderRadius: 8, padding: 18, cursor: "pointer", transition: "all 0.2s" }}
              className="project-card"
            >
              <div style={{ display: "flex", alignItems: "start", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconFileDoc />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{c.vendor_name || "—"}</div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {c.status === "AI Processing" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="spinner" style={{ width: 12, height: 12, borderTopColor: "#2563eb" }} />
                    <span className="badge badge-blue">Stage: {agentPipelinePhaseToShortLabel(c.contract_metadata?.agent_pipeline_phase)}</span>
                  </div>
                ) : (
                  <>
                    <span className={`badge ${STATUS_COLORS[c.status] || "badge-grey"}`}>{c.status}</span>
                    {c.status === "Active" && <span className="badge badge-green">Done</span>}
                  </>
                )}
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-3)", display: "block" }}>Type</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>{c.type}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", display: "block" }}>Expires</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                    {c.end_date ? new Date(c.end_date).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8, width: "100%", maxWidth: 440, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 10px 0" }}>Archive contract?</h3>
            <p style={{ fontSize: 14, color: "var(--text-2)", margin: "0 0 20px 0", lineHeight: 1.5 }}>
              Archive "{confirmDelete.title}"? It will move to archived contracts and can no longer be edited.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(null)}
                style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13.5, cursor: "pointer", border: "1px solid var(--border)", background: "white" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmDelete}
                style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13.5, cursor: "pointer", background: "var(--red)", color: "white", border: "none" }}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
