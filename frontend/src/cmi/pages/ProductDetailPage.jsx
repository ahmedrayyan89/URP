import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductById } from "../api/cmiApi";

const STATUS_COLORS = {
  Active: "badge-green",
  Discontinued: "badge-grey",
  Draft: "badge-amber",
};

export default function ProductDetailPage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchProductById(id)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="empty">
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="shell-page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }
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
        <div className="card-header">
          <div>
            <h1 className="shell-page-title" style={{ marginBottom: 6 }}>
              {product.name}
            </h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className={`badge ${STATUS_COLORS[product.status] || "badge-grey"}`}>{product.status}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>SKU: {product.sku}</span>
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>Category: {product.category}</span>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 0 }}>
          {[
            { label: "Unit Cost", value: product.unit_cost != null ? `$${Number(product.unit_cost).toFixed(2)}` : "—" },
            { label: "Target Cost", value: product.target_cost != null ? `$${Number(product.target_cost).toFixed(2)}` : "—" },
            { label: "Margin", value: product.margin != null ? `${Number(product.margin).toFixed(1)}%` : "—" },
            { label: "Raw Materials", value: product.ingredient_count },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ padding: "12px 16px" }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 20 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Card */}
      <div className="card">
        <h3 className="card-title mb-4">Product Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
          {[
            ["Product ID", product.id],
            ["SKU", product.sku],
            ["Mapping Type", product.mapping_type],
            ["Primary Vendor", product.primary_vendor_name || "—"],
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
    </div>
  );
}
