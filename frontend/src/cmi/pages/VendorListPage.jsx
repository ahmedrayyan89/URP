import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchVendors, createVendor } from "../api/cmiApi";

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

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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

const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#2563eb" }}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="9" y1="22" x2="9" y2="16" />
    <line x1="15" y1="22" x2="15" y2="16" />
    <line x1="9" y1="16" x2="15" y2="16" />
    <path d="M9 10h.01" />
    <path d="M15 10h.01" />
    <path d="M9 14h.01" />
    <path d="M15 14h.01" />
    <path d="M9 6h.01" />
    <path d="M15 6h.01" />
  </svg>
);

const STATUS_COLORS = {
  Active: "badge-green",
  Inactive: "badge-grey",
  Pending: "badge-amber",
};

export default function VendorListPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("list");

  // Add Vendor Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: "", code: "", category: "Logistics", status: "Active", contact_name: "", contact_email: "", phone: "", address: "", country: "United States" });
  const [successMsg, setSuccessMsg] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const refreshList = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchVendors()
      .then((res) => {
        setVendors(res.items || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  // Client-side filtering
  const filtered = vendors.filter((v) => {
    const s =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.category || "").toLowerCase().includes(search.toLowerCase());

    let st = true;
    if (statusFilter) {
      st = (v.status || "").trim().toLowerCase() === statusFilter.toLowerCase();
    }

    return s && st;
  });

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Vendor", "Code", "Category", "Status", "Contracts", "Last Activity"].join(",");
    const rows = filtered.map(v => [
      `"${v.name.replace(/"/g, '""')}"`,
      `"${(v.code || "").replace(/"/g, '""')}"`,
      `"${v.category}"`,
      `"${v.status}"`,
      `"${v.contract_count || 0}"`,
      `"${v.last_activity ? new Date(v.last_activity).toLocaleDateString() : ""}"`
    ].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vendors_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!newVendor.name || !newVendor.code) return;

    setModalLoading(true);
    setModalError(null);
    try {
      const created = await createVendor(newVendor);
      // Insert to list locally so it displays immediately
      setVendors(prev => [created, ...prev]);
      setSuccessMsg(`Vendor "${newVendor.name}" successfully created.`);
      setShowAddModal(false);
      setNewVendor({ name: "", code: "", category: "Logistics", status: "Active", contact_name: "", contact_email: "", phone: "", address: "", country: "United States" });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to create vendor");
    } finally {
      setModalLoading(false);
    }
  };

  const handleImportMock = () => {
    setSuccessMsg("Successfully queued import of 4 vendors from cloud registry.");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="shell-page">
      {/* ── Header Row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}>
            <span>Entities</span>
            <span style={{ color: "var(--border)" }}>/</span>
            <span style={{ color: "var(--text-2)", fontWeight: 500 }}>Vendors</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className="shell-page-title" style={{ margin: 0 }}>Vendors</h1>
            <span className="badge badge-blue" style={{ textTransform: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>Vendors</span>
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
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "white", border: "none", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            <IconPlus /> Add Vendor
          </button>
          <button
            onClick={handleImportMock}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "white", border: "none", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Import Vendors
          </button>
        </div>
      </div>

      {/* Alert notifications */}
      {error && <div className="alert alert-error mb-2">{error}</div>}
      {successMsg && <div className="alert alert-success mb-2" style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#047857", padding: "12px 16px", borderRadius: 8, fontSize: 14 }}>{successMsg}</div>}

      {/* ── Search & Filter Controls ── */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, color: "var(--text-3)", fontWeight: 500 }}>
          Showing {filtered.length} of {vendors.length} vendors
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Search container */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Search vendors..."
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
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
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
          <div className="empty-sub" style={{ fontSize: 14, color: "var(--text-3)" }}>No vendors match your current filtering criteria.</div>
        </div>
      ) : viewMode === "list" ? (
        <div className="card" style={{ padding: 0, border: "1px solid var(--border)", borderRadius: 8, background: "white", overflow: "hidden" }}>
          <div className="data-table-wrap">
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fcfcfc", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ width: "35%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "left", letterSpacing: "0.05em" }}>Vendor</th>
                  <th style={{ width: "20%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "left", letterSpacing: "0.05em" }}>Category</th>
                  <th style={{ width: "15%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "left", letterSpacing: "0.05em" }}>Status</th>
                  <th style={{ width: "10%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "center", letterSpacing: "0.05em" }}>Contracts</th>
                  <th style={{ width: "15%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "left", letterSpacing: "0.05em" }}>Last Activity</th>
                  <th style={{ width: "5%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "right", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="clickable-row"
                    style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                  >
                    {/* Vendor Name / Code */}
                    <td 
                      style={{ padding: "12px 16px", cursor: "pointer" }}
                      onClick={() => navigate(`/projects/${projectId}/entities/vendors/${v.id}`)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContext: "center", justifyContent: "center", flexShrink: 0 }}>
                          <IconBuilding />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13.5 }}>{v.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{v.code || "—"}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "12px 16px", fontSize: 13.5, color: "var(--text-2)" }}>
                      {v.category}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`badge ${STATUS_COLORS[v.status] || "badge-grey"}`}>{v.status}</span>
                    </td>

                    {/* Contracts Count */}
                    <td style={{ padding: "12px 16px", fontSize: 13.5, color: "var(--text-2)", textAlign: "center" }}>
                      {v.contract_count || 0}
                    </td>

                    {/* Last Activity */}
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-2)" }}>
                      {v.last_activity ? new Date(v.last_activity).toLocaleDateString() : "—"}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => navigate(`/projects/${projectId}/entities/vendors/${v.id}`)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "6px 8px", borderRadius: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", color: "var(--text-2)" }}
                        title="View details"
                      >
                        <IconEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map((v) => (
            <div
              key={v.id}
              onClick={() => navigate(`/projects/${projectId}/entities/vendors/${v.id}`)}
              style={{ background: "white", border: "1px solid var(--border)", borderRadius: 8, padding: 18, cursor: "pointer", transition: "all 0.2s" }}
              className="project-card"
            >
              <div style={{ display: "flex", alignItems: "start", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconBuilding />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{v.code || "—"}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span className={`badge ${STATUS_COLORS[v.status] || "badge-grey"}`}>{v.status}</span>
                <span className="badge badge-grey" style={{ textTransform: "none" }}>{v.category}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-3)", display: "block" }}>Contracts</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>{v.contract_count || 0}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", display: "block" }}>Last Activity</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                    {v.last_activity ? new Date(v.last_activity).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8, width: "100%", maxWidth: 460, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Add Vendor</h3>
            {modalError && <div className="alert alert-error mb-2">{modalError}</div>}
            <form onSubmit={handleAddVendor}>
              <div className="form-row" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Vendor Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="e.g. Acme Raw Materials Inc."
                  style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}
                  disabled={modalLoading}
                />
              </div>

              <div className="form-row" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Vendor Code *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={newVendor.code}
                  onChange={(e) => setNewVendor({ ...newVendor, code: e.target.value })}
                  placeholder="e.g. VND-ACM-01"
                  style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}
                  disabled={modalLoading}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Category</label>
                  <select
                    className="input"
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                    style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "white" }}
                    disabled={modalLoading}
                  >
                    <option value="Raw Ingredients">Raw Ingredients</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Services">Services</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Status</label>
                  <select
                    className="input"
                    value={newVendor.status}
                    onChange={(e) => setNewVendor({ ...newVendor, status: e.target.value })}
                    style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "white" }}
                    disabled={modalLoading}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Contact Name</label>
                  <input
                    type="text"
                    className="input"
                    value={newVendor.contact_name}
                    onChange={(e) => setNewVendor({ ...newVendor, contact_name: e.target.value })}
                    placeholder="John Doe"
                    style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}
                    disabled={modalLoading}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Contact Email</label>
                  <input
                    type="email"
                    className="input"
                    value={newVendor.contact_email}
                    onChange={(e) => setNewVendor({ ...newVendor, contact_email: e.target.value })}
                    placeholder="john@vendor.com"
                    style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}
                    disabled={modalLoading}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13.5, cursor: "pointer", border: "1px solid var(--border)", background: "white" }}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13.5, cursor: "pointer", background: "#2563eb", color: "white", border: "none", display: "flex", alignItems: "center", gap: 6 }}
                  disabled={modalLoading}
                >
                  {modalLoading && <span className="spinner" style={{ width: 12, height: 12 }} />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
