import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchVendors,
  deleteVendor,
  sumVendorSpendByPeriod,
  formatCurrency,
  formatDate,
} from "../api/cmiApi";

// ── Icons ─────────────────────────────────────────────────────────
const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const Download = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const Building2 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="16"/><line x1="15" y1="22" x2="15" y2="16"/><line x1="9" y1="16" x2="15" y2="16"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9 6h.01"/><path d="M15 6h.01"/></svg>
);
const Trash2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);
const MapPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const Mail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
);
const Eye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const Edit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);
const Search = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const Filter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);
const LayoutList = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="2"/><rect x="3" y="11" width="18" height="2"/><rect x="3" y="17" width="18" height="2"/></svg>
);
const LayoutGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
);
const X = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);
const Key = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
);
const ShieldAlert = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
const Loader2 = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
);
const CheckCircle2 = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

// ── Status badge ──────────────────────────────────────────────────
const STATUS_STYLES = {
  Active: { bg: "#ecfdf5", color: "#059669", border: "#6ee7b7" },
  Inactive: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  Pending: { bg: "#fffbeb", color: "#d97706", border: "#fcd34d" },
};
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "var(--surface)", borderRadius: 12, padding: 28, width: 420, boxShadow: "0 16px 48px rgba(0,0,0,0.18)", border: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: "var(--text)" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13, cursor: "pointer", color: "var(--text)" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── RowActions (three-dot menu) ───────────────────────────────────
function RowActions({ actions }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--text-3)" }}
      >
        ⋯
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", right: 0, top: 34, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 101, minWidth: 160, overflow: "hidden" }}>
            {actions.map((a, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setOpen(false); a.onClick(); }}
                style={{
                  width: "100%", padding: "9px 14px", border: "none", background: "transparent",
                  textAlign: "left", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  color: a.variant === "danger" ? "#dc2626" : "var(--text)",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Import Modal data ─────────────────────────────────────────────
const connectors = [
  { id: "archer-grc", name: "Archer GRC", description: "Connect to Archer GRC to import vendor risk data", iconColor: "#9333ea", iconBg: "#faf5ff" },
  { id: "vendor-api", name: "Vendor API (Nutrisource)", description: "Connect to Nutrisource API to sync vendor information", iconColor: "#059669", iconBg: "#ecfdf5" },
];
const mockFiles = {
  "archer-grc": [
    { id: "ag-1", name: "Archer_Vendor_Risk_Report_2024.xlsx", date: "2024-03-16", size: "1.9 MB" },
    { id: "ag-2", name: "Archer_Compliance_Assessment.xlsx", date: "2024-03-15", size: "2.2 MB" },
    { id: "ag-3", name: "Archer_Third_Party_Risk.xlsx", date: "2024-03-14", size: "1.7 MB" },
  ],
  "vendor-api": [
    { id: "va-1", name: "Nutrisource_Vendor_Data_Export.json", date: "2024-03-16", size: "1.9 MB" },
    { id: "va-2", name: "Nutrisource_Supplier_Catalog.json", date: "2024-03-15", size: "2.2 MB" },
    { id: "va-3", name: "Nutrisource_Vendor_Contacts.json", date: "2024-03-14", size: "1.7 MB" },
  ],
};

// ── Main Component ─────────────────────────────────────────────────
export default function VendorListPage({ embed = false }) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const vendorsBase = `/projects/${projectId}/entities/vendors`;

  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState("select");
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [importedCount, setImportedCount] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [archerBaseUrl, setArcherBaseUrl] = useState("");
  const [archerUsername, setArcherUsername] = useState("");
  const [archerPassword, setArcherPassword] = useState("");
  const [vendorApiUrl, setVendorApiUrl] = useState("");
  const [vendorApiKey, setVendorApiKey] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setLoading(true);
    fetchVendors().then(data => {
      setVendors(data.items || []);
      setLoading(false);
    }).catch(e => { showToast(e.message || "Failed to load vendors", "error"); setLoading(false); });
  }, []);

  const categories = [...new Set(vendors.map(v => v.category))];
  const filtered = vendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || v.status === statusFilter;
    const matchCategory = !categoryFilter || v.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVendor(deleteTarget.id);
      setVendors(prev => prev.filter(v => v.id !== deleteTarget.id));
      showToast(`Vendor "${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
    } catch (e) {
      showToast(e.message || "Failed to delete vendor", "error");
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Vendor", "Code", "Category", "Status", "Contracts", "Risk Score", "Last Activity"],
      ...filtered.map(v => [v.name, v.code, v.category, v.status, v.contract_count, v.risk_score, formatDate(v.last_activity)]),
    ];
    const csv = rows.map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "vendors.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Import modal helpers
  const availableFiles = selectedConnector ? (mockFiles[selectedConnector] || []) : [];
  const selectedConnectorData = connectors.find(c => c.id === selectedConnector);

  const handleConnectorSelect = id => { setSelectedConnector(id); setCurrentStep("setup"); };
  const handleBackToSelection = () => { setCurrentStep("select"); setSelectedConnector(null); resetConnectorForm(); };
  const resetConnectorForm = () => { setArcherBaseUrl(""); setArcherUsername(""); setArcherPassword(""); setVendorApiUrl(""); setVendorApiKey(""); };
  const handleConnect = () => { setCurrentStep("connecting"); setTimeout(() => setCurrentStep("files"), 2000); };
  const handleFileToggle = id => { const s = new Set(selectedFiles); s.has(id) ? s.delete(id) : s.add(id); setSelectedFiles(s); };
  const handleSelectAll = () => {
    if (selectedFiles.size === availableFiles.length) setSelectedFiles(new Set());
    else setSelectedFiles(new Set(availableFiles.map(f => f.id)));
  };
  const handleImportSelected = () => {
    setCurrentStep("importing"); setImportedCount(selectedFiles.size);
    let p = 0;
    const iv = setInterval(() => {
      p += 10; setImportProgress(p);
      if (p >= 100) { clearInterval(iv); setCurrentStep("success"); showToast(`Successfully imported ${selectedFiles.size} vendor record(s)`); }
    }, 300);
  };
  const handleCloseModal = () => {
    setImportModalOpen(false); setCurrentStep("select"); setSelectedConnector(null);
    setSelectedFiles(new Set()); resetConnectorForm(); setImportProgress(0);
  };

  return (
    <div className={embed ? "" : "shell-page"} style={embed ? { padding: 0 } : undefined}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "12px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: toast.type === "error" ? "#fef2f2" : "#ecfdf5", border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#6ee7b7"}`, color: toast.type === "error" ? "#dc2626" : "#059669", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: embed ? "flex-end" : "space-between", marginBottom: 8 }}>
        {!embed && (
          <nav style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface)", padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, color: "var(--primary-2)", fontWeight: 600 }}>Vendors</span>
          </nav>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Download /> Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`${vendorsBase}/new`)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus /> Add Vendor
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setImportModalOpen(true); setCurrentStep("select"); }} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Download /> Import Vendors
          </button>
        </div>
      </div>

      {/* ── Count line (matches CMI screenshot) ── */}
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
        Showing <strong style={{ color: "var(--text-2)" }}>{filtered.length}</strong> of <strong style={{ color: "var(--text-2)" }}>{vendors.length}</strong> vendors
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, background: "var(--surface)", padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}><Search /></span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search vendors by name, code..."
              className="input" style={{ paddingLeft: 34, height: 36 }}
            />
          </div>
          {/* Filter icon button */}
          <button
            className="btn btn-ghost btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 36, padding: "0 12px" }}
          >
            <Filter /> Filter
          </button>
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 36, width: 140 }}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
          <select className="select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ height: 36, width: 160 }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: "flex", gap: 2, background: "var(--surface-2)", borderRadius: 6, padding: 2, border: "1px solid var(--border)" }}>
            {[{ mode: "list", Icon: LayoutList }, { mode: "card", Icon: LayoutGrid }].map(({ mode, Icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: "5px 8px", borderRadius: 5, border: "none", cursor: "pointer",
                background: viewMode === mode ? "var(--surface)" : "transparent",
                color: viewMode === mode ? "var(--text)" : "var(--text-3)",
                boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                display: "flex", alignItems: "center",
              }}>
                <Icon />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Vendor List / Card ── */}
      {loading ? (
        <div className="empty"><div style={{ fontSize: 14, color: "var(--text-3)" }}>Loading vendors…</div></div>
      ) : viewMode === "list" ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Contracts</th>
                  <th>Last Activity</th>
                  <th style={{ width: 50 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--text-3)" }}>No vendors match your current filtering criteria.</td></tr>
                ) : (
                  filtered.map(v => (
                    <tr key={v.id} className="clickable-row" onClick={() => navigate(`${vendorsBase}/${v.id}`)}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--primary)" }}>
                            <Building2 />
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: "var(--text)" }}>{v.name}</div>
                            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{v.code}</div>
                          </div>
                        </div>
                      </td>
                      <td>{v.category}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td>{v.contract_count}</td>
                      <td style={{ color: "var(--text-3)" }}>{formatDate(v.last_activity)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <RowActions actions={[
                          { label: "View Profile", icon: <Eye />, onClick: () => navigate(`${vendorsBase}/${v.id}`) },
                          { label: "Edit Vendor", icon: <Edit />, onClick: () => navigate(`${vendorsBase}/${v.id}/edit`) },
                          { label: "Delete Vendor", icon: <Trash2 />, onClick: () => setDeleteTarget(v), variant: "danger" },
                        ]} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && vendors.length > 0 && null}
          {vendors.length === 0 && (
            <div className="empty" style={{ padding: 48 }}>
              <Building2 />
              <div className="empty-title" style={{ marginTop: 12 }}>No vendors yet</div>
              <div className="empty-sub">Add your first vendor to get started</div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`${vendorsBase}/new`)} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Plus /> Add Vendor
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Card View */
        filtered.length === 0 ? (
          <div className="empty" style={{ padding: 64 }}>
            <div style={{ fontSize: 14, color: "var(--text-3)" }}>No vendors match your current filtering criteria.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map(v => (
              <div
                key={v.id}
                className="card"
                onClick={() => navigate(`${vendorsBase}/${v.id}`)}
                style={{ padding: 20, cursor: "pointer", transition: "box-shadow 0.15s, transform 0.15s", position: "relative" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(77,174,201,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
              >
                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); setDeleteTarget(v); }}
                  style={{ position: "absolute", top: 10, right: 10, padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-3)", opacity: 0, transition: "opacity 0.15s" }}
                  className="card-delete-btn"
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <Trash2 />
                </button>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                      <Building2 />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{v.code}</div>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-3)", fontSize: 12 }}>
                    <MapPin /> {v.country || "—"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-3)", fontSize: 12 }}>
                    <Mail /> {v.contact_email || "—"}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Spend</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{formatCurrency(sumVendorSpendByPeriod(v.total_spend))}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Contracts</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{v.contract_count}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Risk</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: v.risk_score > 25 ? "#dc2626" : v.risk_score > 15 ? "#d97706" : "#059669" }}>{v.risk_score}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Associated products and ingredients will not be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Import Modal ── */}
      {importModalOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", zIndex: 9990 }}
            onClick={currentStep === "importing" ? undefined : handleCloseModal}
          />
          {/* Modal */}
          <div style={{ position: "fixed", inset: 0, zIndex: 9991, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", width: "100%", maxWidth: 700, maxHeight: "85vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Step 1: Select Connector */}
              {currentStep === "select" && (
                <>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0, marginBottom: 4 }}>Import Vendor Data</h3>
                      <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>Choose a source to import vendor data</p>
                    </div>
                    <button onClick={handleCloseModal} style={{ padding: 8, border: "none", background: "transparent", cursor: "pointer", borderRadius: 8, color: "var(--text-3)" }}><X /></button>
                  </div>
                  <div style={{ padding: 24, overflowY: "auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {connectors.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleConnectorSelect(c.id)}
                          style={{ padding: 20, borderRadius: 12, border: "2px solid var(--border)", cursor: "pointer", transition: "border-color 0.15s, transform 0.15s", background: "var(--surface)" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary-2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = ""; }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 10, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {c.id === "archer-grc" ? <ShieldAlert style={{ color: c.iconColor }} /> : <Building2 style={{ color: c.iconColor }} />}
                            </div>
                            <div>
                              <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4, margin: 0 }}>{c.name}</h4>
                              <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.5 }}>{c.description}</p>
                              <button style={{ padding: "6px 14px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Connect</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Setup */}
              {currentStep === "setup" && selectedConnectorData && (
                <>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={handleBackToSelection} style={{ padding: 8, border: "none", background: "transparent", cursor: "pointer", borderRadius: 8, color: "var(--text-3)" }}><ArrowLeft /></button>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0, marginBottom: 4 }}>Connect to {selectedConnectorData.name}</h3>
                      <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>Authorize access to import vendor data</p>
                    </div>
                    <button onClick={handleCloseModal} style={{ padding: 8, border: "none", background: "transparent", cursor: "pointer", borderRadius: 8, color: "var(--text-3)" }}><X /></button>
                  </div>
                  <div style={{ padding: 24, overflowY: "auto" }}>
                    <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
                      {selectedConnector === "archer-grc" && (
                        <>
                          {[["Base URL", archerBaseUrl, setArcherBaseUrl, "https://your-instance.archer.com", "text"],
                            ["Username", archerUsername, setArcherUsername, "Enter your Archer GRC username", "text"],
                            ["Password", archerPassword, setArcherPassword, "Enter your Archer GRC password", "password"],
                          ].map(([label, val, setter, ph, type]) => (
                            <div key={label}>
                              <label className="form-label">{label}</label>
                              <input type={type} className="input" value={val} onChange={e => setter(e.target.value)} placeholder={ph} />
                            </div>
                          ))}
                          <button className="btn btn-primary" onClick={handleConnect} disabled={!archerBaseUrl || !archerUsername || !archerPassword} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <Key /> Connect to Archer GRC
                          </button>
                        </>
                      )}
                      {selectedConnector === "vendor-api" && (
                        <>
                          {[["API URL", vendorApiUrl, setVendorApiUrl, "https://api.nutrisource.com", "text"],
                            ["API Key", vendorApiKey, setVendorApiKey, "Enter your Nutrisource API key", "password"],
                          ].map(([label, val, setter, ph, type]) => (
                            <div key={label}>
                              <label className="form-label">{label}</label>
                              <input type={type} className="input" value={val} onChange={e => setter(e.target.value)} placeholder={ph} />
                            </div>
                          ))}
                          <button className="btn btn-primary" onClick={handleConnect} disabled={!vendorApiUrl || !vendorApiKey} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <Key /> Connect to Vendor API
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Connecting */}
              {currentStep === "connecting" && selectedConnectorData && (
                <div style={{ padding: 64, textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: selectedConnectorData.iconBg, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <Loader2 />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Connecting to {selectedConnectorData.name}...</h3>
                  <p style={{ fontSize: 13, color: "var(--text-2)" }}>Authenticating and retrieving your vendor files</p>
                </div>
              )}

              {/* Step 4: File Selection */}
              {currentStep === "files" && (
                <>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={handleBackToSelection} style={{ padding: 8, border: "none", background: "transparent", cursor: "pointer", borderRadius: 8, color: "var(--text-3)" }}><ArrowLeft /></button>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0, marginBottom: 4 }}>Select Vendor Files to Import</h3>
                      <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>{selectedFiles.size} of {availableFiles.length} files selected</p>
                    </div>
                    <button onClick={handleCloseModal} style={{ padding: 8, border: "none", background: "transparent", cursor: "pointer", borderRadius: 8, color: "var(--text-3)" }}><X /></button>
                  </div>
                  <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={handleSelectAll} style={{ fontSize: 13, color: "var(--primary-2)", fontWeight: 500, border: "none", background: "transparent", cursor: "pointer" }}>
                      {selectedFiles.size === availableFiles.length ? "Deselect All" : "Select All"}
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleImportSelected} disabled={selectedFiles.size === 0} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Download /> Import Selected ({selectedFiles.size})
                    </button>
                  </div>
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {availableFiles.map(file => (
                      <div key={file.id} onClick={() => handleFileToggle(file.id)} style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <input type="checkbox" checked={selectedFiles.has(file.id)} onChange={() => handleFileToggle(file.id)} onClick={e => e.stopPropagation()} style={{ width: 16, height: 16, cursor: "pointer" }} />
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                          <Building2 />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{file.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{file.date} · {file.size}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Step 5: Importing */}
              {currentStep === "importing" && (
                <div style={{ padding: 64, textAlign: "center" }}>
                  <div style={{ margin: "0 auto 24px" }}><Loader2 /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Importing vendor data...</h3>
                  <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24 }}>Processing {importedCount} {importedCount === 1 ? "file" : "files"}. This may take a moment.</p>
                  <div style={{ maxWidth: 320, margin: "0 auto" }}>
                    <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${importProgress}%`, background: "var(--primary-2)", borderRadius: 99, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>{importProgress}% complete</div>
                  </div>
                </div>
              )}

              {/* Step 6: Success */}
              {currentStep === "success" && (
                <>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0 }}>Import Complete</h3>
                    <button onClick={handleCloseModal} style={{ padding: 8, border: "none", background: "transparent", cursor: "pointer", borderRadius: 8, color: "var(--text-3)" }}><X /></button>
                  </div>
                  <div style={{ padding: 64, textAlign: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: 999, background: "#ecfdf5", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 style={{ color: "#059669" }} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Vendor data imported successfully</h3>
                    <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 32 }}>{importedCount} {importedCount === 1 ? "record has" : "records have"} been added to your list</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                      <button className="btn btn-ghost" onClick={handleCloseModal}>Close</button>
                      <button className="btn btn-primary" onClick={handleCloseModal} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Eye /> View Vendors
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
