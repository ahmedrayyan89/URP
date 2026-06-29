import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchVendorById, fetchVendorContracts } from "../api/cmiApi";

const STATUS_COLORS = { Active: "badge-green", Inactive: "badge-grey", Pending: "badge-amber" };
const CONTRACT_STATUS_COLORS = {
  Active: "badge-green", Expired: "badge-grey", "Pending Review": "badge-amber",
  "AI Processing": "badge-blue", "On Hold": "badge-amber", "Under Negotiation": "badge-blue",
};

export default function VendorProfilePage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchVendorById(id), fetchVendorContracts(id)])
      .then(([v, c]) => { setVendor(v); setContracts(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="empty"><span className="spinner" style={{ width: 24, height: 24 }} /></div>;
  if (error) return <div className="shell-page"><div className="alert alert-error">{error}</div></div>;
  if (!vendor) return null;

  const totalSpend = Object.values(vendor.total_spend || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="shell-page">
      {/* Back + header */}
      <button className="btn btn-sm mb-4" style={{ display: "flex", alignItems: "center", gap: 6 }}
        onClick={() => navigate(`/projects/${projectId}/entities/vendors`)}>
        ← Back to Vendors
      </button>

      <div className="card mb-4">
        <div className="card-header">
          <div>
            <h1 className="shell-page-title" style={{ marginBottom: 4 }}>{vendor.name}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{vendor.code}</span>
              <span className={`badge ${STATUS_COLORS[vendor.status] || "badge-grey"}`}>{vendor.status}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{vendor.category}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 0 }}>
          {[
            { label: "Contracts", value: vendor.contract_count },
            { label: "Risk Score", value: `${vendor.risk_score}/100` },
            { label: "Total Spend", value: totalSpend ? `$${(totalSpend / 1000).toFixed(0)}K` : "—" },
            { label: "Country", value: vendor.country || "—" },
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
        {["overview", "contracts"].map((t) => (
          <button key={t} className={`kb-detail-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Contact Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {[
              ["Contact Name", vendor.contact_name || "—"],
              ["Email", vendor.contact_email || "—"],
              ["Phone", vendor.phone || "—"],
              ["Address", vendor.address || "—"],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, color: "var(--text)" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "contracts" && (
        <div className="card" style={{ padding: 0 }}>
          {contracts.length === 0 ? (
            <div className="empty" style={{ padding: 32 }}>
              <div className="empty-title">No contracts</div>
              <div className="empty-sub">No active contracts for this vendor.</div>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Value</th><th>End Date</th></tr></thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr key={c.id} className="clickable-row"
                      onClick={() => navigate(`/projects/${projectId}/entities/contracts/${c.id}`)}>
                      <td style={{ fontWeight: 500 }}>{c.title}</td>
                      <td>{c.type}</td>
                      <td><span className={`badge ${CONTRACT_STATUS_COLORS[c.status] || "badge-grey"}`}>{c.status}</span></td>
                      <td>{c.total_value ? `$${Number(c.total_value).toLocaleString()}` : "—"}</td>
                      <td style={{ fontSize: 12 }}>{new Date(c.end_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
