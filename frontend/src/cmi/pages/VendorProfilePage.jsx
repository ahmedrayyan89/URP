import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchVendorById,
  fetchVendorContracts,
  fetchVendorCostModels,
  sumVendorSpendByPeriod,
  deleteVendor,
  formatCurrency,
  formatDate,
} from "../api/cmiApi";

// ── Icons ─────────────────────────────────────────────────────────
const Building2 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="16"/><line x1="15" y1="22" x2="15" y2="16"/><line x1="9" y1="16" x2="15" y2="16"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9 6h.01"/><path d="M15 6h.01"/>
  </svg>
);
const Globe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const Mail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const Phone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16.92z"/>
  </svg>
);
const MapPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const Edit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const Trash2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const FileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const TrendingDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
  </svg>
);
const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ── StatusBadge (mirrors CMI design) ─────────────────────────────
const STATUS_COLORS = {
  Active: { bg: "#ecfdf5", color: "#059669", border: "#6ee7b7" },
  Inactive: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  Pending: { bg: "#fffbeb", color: "#d97706", border: "#fcd34d" },
  Expired: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  "Pending Review": { bg: "#fffbeb", color: "#d97706", border: "#fcd34d" },
  "Under Negotiation": { bg: "#eff6ff", color: "#2563eb", border: "#93c5fd" },
  "On Hold": { bg: "#fff1f2", color: "#be123c", border: "#fca5a5" },
  "AI Processing": { bg: "#faf5ff", color: "#7c3aed", border: "#c4b5fd" },
  "System Processing": { bg: "#faf5ff", color: "#7c3aed", border: "#c4b5fd" },
  Done: { bg: "#ecfdf5", color: "#059669", border: "#6ee7b7" },
  Approved: { bg: "#ecfdf5", color: "#059669", border: "#6ee7b7" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 99,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 500,
    }}>
      {status}
    </span>
  );
}

// ── Info Row (icon + label + value) ──────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: "var(--surface-2)", display: "flex",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: "var(--text-3)",
      }}>
        <Icon />
      </div>
      <div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

// ── TabNav (mirrors CMI TabNav) ───────────────────────────────────
function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div style={{
      display: "flex", borderBottom: "2px solid var(--border)",
      marginBottom: 20, gap: 0,
    }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: "10px 20px", fontSize: 13, fontWeight: 500,
            border: "none", background: "none", cursor: "pointer",
            color: activeTab === t.key ? "var(--primary-2)" : "var(--text-2)",
            borderBottom: activeTab === t.key ? "2px solid var(--primary-2)" : "2px solid transparent",
            marginBottom: -2, transition: "all 0.15s",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          {t.label}
          {t.count !== undefined && (
            <span style={{
              padding: "1px 7px", borderRadius: 99, fontSize: 11,
              background: "var(--surface-2)", color: "var(--text-2)", fontWeight: 500,
            }}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
    }}>
      <div style={{
        background: "var(--surface)", borderRadius: 12, padding: 28,
        width: 420, boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        border: "1px solid var(--border)",
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: "var(--text)" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VendorProfilePage ─────────────────────────────────────────────
export default function VendorProfilePage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [models, setModels] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchVendorById(id),
      fetchVendorContracts(id),
      fetchVendorCostModels(id),
    ])
      .then(([v, c, m]) => {
        setVendor(v);
        setContracts(Array.isArray(c) ? c : []);
        setModels(Array.isArray(m) ? m : []);
      })
      .catch((e) => showToast(e.message || "Failed to load vendor", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleDeleteVendor = async () => {
    if (!vendor) return;
    setDeleting(true);
    try {
      await deleteVendor(id);
      showToast("Vendor deleted successfully");
      setShowDeleteDialog(false);
      setTimeout(() => navigate(`/projects/${projectId}/entities/vendors`), 600);
    } catch (e) {
      showToast(e.message || "Failed to delete vendor", "error");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="shell-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <div style={{ fontSize: 14, color: "var(--text-3)" }}>Loading…</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="shell-page">
        <div style={{ color: "var(--red)" }}>Vendor not found.</div>
      </div>
    );
  }

  const vendorsPath = `/projects/${projectId}/entities/vendors`;

  return (
    <div className="shell-page" style={{ position: "relative" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          padding: "12px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: toast.type === "error" ? "#fef2f2" : "#ecfdf5",
          border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#6ee7b7"}`,
          color: toast.type === "error" ? "#dc2626" : "#059669",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <nav style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8, background: "var(--surface)", padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
        <span onClick={() => navigate(vendorsPath)} style={{ cursor: "pointer", fontSize: 13, color: "var(--primary-2)", fontWeight: 500 }}>
          Vendors
        </span>
        <ChevronRight />
        <span style={{ fontSize: 13, color: "var(--primary-2)", fontWeight: 600 }}>{vendor.name}</span>
      </nav>

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>
            {vendor.name}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>
            {vendor.code} · {vendor.category}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigate(`${vendorsPath}/${id}/edit`)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Edit /> Edit
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setShowDeleteDialog(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--red)" }}
          >
            <Trash2 /> Delete Vendor
          </button>
        </div>
      </div>

      {/* Tabs */}
      <TabNav
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "contracts", label: "Contracts", count: contracts.length },
          { key: "costmodels", label: "Cost Models", count: models.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          {/* Left: Vendor Information */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 18 }}>
              Vendor Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <InfoRow icon={Building2} label="Company" value={vendor.name} />
              <InfoRow icon={Globe} label="Country" value={vendor.country} />
              <InfoRow icon={Mail} label="Contact Email" value={vendor.contact_email} />
              <InfoRow icon={Phone} label="Phone" value={vendor.phone} />
              <InfoRow icon={MapPin} label="Address" value={vendor.address} />
            </div>
          </div>

          {/* Right: Stats Card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>Status</span>
              <StatusBadge status={vendor.status} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>Total Spend</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  {formatCurrency(sumVendorSpendByPeriod(vendor.total_spend))}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>Contracts</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{vendor.contract_count}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>Risk Score</span>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: vendor.risk_score > 25 ? "#dc2626" : vendor.risk_score > 15 ? "#d97706" : "#059669",
                }}>
                  {vendor.risk_score}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>Member Since</span>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{formatDate(vendor.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Contracts Tab ── */}
      {activeTab === "contracts" && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ borderBottom: "1px solid var(--border)" }}>
            {contracts.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                No contracts found
              </div>
            ) : (
              contracts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/projects/${projectId}/entities/contracts/${c.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 20px", cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ color: "var(--primary)" }}><FileText /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                      {c.type} · {c.total_value ? `$${Number(c.total_value).toLocaleString()}` : "—"}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Cost Models Tab ── */}
      {activeTab === "costmodels" && (
        <div className="card" style={{ padding: 0 }}>
          <div>
            {models.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                No cost models found
              </div>
            ) : (
              models.map((m) => {
                const total = m.total_cost ?? m.totalCost;
                const ver = m.version ?? "";
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 20px", cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ color: "#7c3aed" }}><TrendingDown /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                        {ver}{total != null ? ` · $${Number(total).toFixed(2)}/unit` : ""}
                      </div>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${vendor.name}"? Products and ingredients associated with this vendor will NOT be deleted.`}
        onConfirm={handleDeleteVendor}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
