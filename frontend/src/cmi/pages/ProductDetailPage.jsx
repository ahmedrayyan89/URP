import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductById, updateProduct, fetchProductVendors, fetchProductBOM } from "../api/cmiApi";

const STATUS_COLORS = {
  Active: "badge-green",
  Discontinued: "badge-grey",
  Draft: "badge-amber",
};

export default function ProductDetailPage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [bomItems, setBomItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("details");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setLoading(true);
    fetchProductById(id)
      .then((p) => {
        setProduct(p);
        setEditForm({ name: p.name, sku: p.sku, category: p.category, status: p.status, target_cost: p.target_cost });
        return Promise.all([
          fetchProductVendors(id).catch(() => []),
          fetchProductBOM(id).catch(() => []),
        ]);
      })
      .then(([v, b]) => {
        setVendors(v);
        setBomItems(b);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    try {
      const updated = await updateProduct(id, editForm);
      setProduct(updated);
      setIsEditing(false);
    } catch (e) {
      alert("Failed to update product: " + e.message);
    }
  };

  if (loading) return <div className="empty"><span className="spinner" style={{ width: 24, height: 24 }} /></div>;
  if (error) return <div className="shell-page"><div className="alert alert-error">{error}</div></div>;
  if (!product) return null;

  return (
    <div className="shell-page">
      <button
        className="btn btn-sm mb-4"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
        onClick={() => navigate(`/projects/${projectId}/entities/products`)}
      >
        ← Back to Products
      </button>

      {/* Header Card */}
      <div className="card mb-4">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            {isEditing ? (
              <input 
                className="input" 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, padding: "4px 8px", width: "100%", minWidth: 300 }}
              />
            ) : (
              <h1 className="shell-page-title" style={{ marginBottom: 6 }}>
                {product.name}
              </h1>
            )}
            
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
              {isEditing ? (
                <>
                  <select className="input" style={{ padding: "4px 8px", height: 28, fontSize: 12 }} value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                  <input className="input" placeholder="SKU" style={{ padding: "4px 8px", height: 28, fontSize: 12, width: 100 }} value={editForm.sku} onChange={(e) => setEditForm({...editForm, sku: e.target.value})} />
                  <input className="input" placeholder="Category" style={{ padding: "4px 8px", height: 28, fontSize: 12, width: 120 }} value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} />
                </>
              ) : (
                <>
                  <span className={`badge ${STATUS_COLORS[product.status] || "badge-grey"}`}>{product.status}</span>
                  <span className="badge badge-grey">SKU: {product.sku}</span>
                  <span className="badge badge-grey">Category: {product.category}</span>
                </>
              )}
            </div>
          </div>
          <div>
            {isEditing ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => {setIsEditing(false); setEditForm({name: product.name, sku: product.sku, category: product.category, status: product.status, target_cost: product.target_cost});}}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleUpdate}>Save</button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>Edit Product</button>
            )}
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 0 }}>
          {[
            { label: "Unit Cost", value: product.unit_cost != null ? `$${Number(product.unit_cost).toFixed(2)}` : "—" },
            { 
              label: "Target Cost", 
              value: isEditing ? (
                <input type="number" step="0.01" className="input" style={{ width: 100, padding: 4 }} value={editForm.target_cost || ""} onChange={(e) => setEditForm({...editForm, target_cost: e.target.value})} />
              ) : (product.target_cost != null ? `$${Number(product.target_cost).toFixed(2)}` : "—")
            },
            { label: "Margin", value: product.margin != null ? `${Number(product.margin).toFixed(1)}%` : "—" },
            { label: "Raw Materials", value: bomItems.length },
          ].map((s, idx) => (
            <div key={idx} className="stat-card" style={{ padding: "12px 16px" }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 20 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="kb-detail-tabs mb-2">
        {["details", "bill of materials (BOM)", "vendors"].map((t) => (
          <button key={t} className={`kb-detail-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="card">
          <h3 className="card-title mb-4">Product Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
            {[
              ["Product ID", product.id],
              ["Mapping Type", product.mapping_type],
              ["Primary Vendor", product.primary_vendor_name || "—"],
              ["Ingredient Count", bomItems.length],
              ["Created At", new Date(product.created_at).toLocaleString()],
              ["Last Updated", new Date(product.last_updated).toLocaleString()],
            ].map(([label, val]) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-3)",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 14, color: "var(--text)", wordBreak: "break-all" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "bill of materials (BOM)" && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="card-title" style={{ margin: 0 }}>Bill of Materials</h3>
            <button className="btn btn-primary btn-sm">Add Ingredient</button>
          </div>
          {bomItems.length === 0 ? (
            <div className="empty" style={{ padding: 40 }}>
              <div className="empty-title">No Ingredients</div>
              <div className="empty-sub">No raw materials or components have been added to this product's BOM.</div>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>UoM</th>
                    <th style={{ textAlign: "right" }}>Unit Cost</th>
                    <th style={{ textAlign: "right" }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {bomItems.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 500 }}>{b.name}</td>
                      <td>{b.quantity}</td>
                      <td>{b.unit_of_measure}</td>
                      <td style={{ textAlign: "right" }}>{b.unit_cost != null ? `$${b.unit_cost.toFixed(4)}` : "—"}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{b.total_cost != null ? `$${b.total_cost.toFixed(4)}` : "—"}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "var(--surface-2)", borderTop: "2px solid var(--border)" }}>
                    <td colSpan="4" style={{ textAlign: "right", fontWeight: 600, padding: "12px 16px" }}>Total Material Cost:</td>
                    <td style={{ textAlign: "right", fontWeight: 700, padding: "12px 16px" }}>
                      ${bomItems.reduce((acc, curr) => acc + (curr.total_cost || 0), 0).toFixed(4)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "vendors" && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="card-title" style={{ margin: 0 }}>Mapped Vendors</h3>
            <button className="btn btn-primary btn-sm">Map Vendor</button>
          </div>
          {vendors.length === 0 ? (
            <div className="empty" style={{ padding: 40 }}>
              <div className="empty-title">No Vendors</div>
              <div className="empty-sub">No vendors have been mapped to supply this product.</div>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Status</th>
                    <th>Mapped At</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 500 }}>
                        {v.vendor_name}
                        {v.is_primary && <span className="badge badge-blue" style={{ marginLeft: 8, fontSize: 10 }}>Primary</span>}
                      </td>
                      <td><span className="badge badge-green">Active</span></td>
                      <td>{new Date(v.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-ghost btn-sm" disabled={v.is_primary}>Set Primary</button>
                      </td>
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
