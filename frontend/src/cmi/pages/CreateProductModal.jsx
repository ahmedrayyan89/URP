import { useState } from "react";
import { createProduct } from "../api/cmiApi";

export default function CreateProductModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    mapping_type: "INDEPENDENT",
    status: "Draft",
    target_cost: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.category) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    const body = {
      ...formData,
      target_cost: formData.target_cost ? parseFloat(formData.target_cost) : null,
    };

    try {
      const newProduct = await createProduct(body);
      onSuccess(newProduct);
    } catch (err) {
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
      <div style={{ background: "white", padding: 24, borderRadius: 8, width: "100%", maxWidth: 500, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Create Product</h3>
        
        {error && <div className="alert alert-error mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Product Name *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Premium Widget V2"
              style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}
              disabled={loading}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>SKU *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. WGT-002"
                style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}
                disabled={loading}
              />
            </div>
            <div>
              <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Category *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Hardware"
                style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Mapping Type</label>
              <select
                className="input"
                value={formData.mapping_type}
                onChange={(e) => setFormData({ ...formData, mapping_type: e.target.value })}
                style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "white" }}
                disabled={loading}
              >
                <option value="INDEPENDENT">Independent (BOM)</option>
                <option value="VENDOR_MAPPED">Vendor Mapped</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Status</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "white" }}
                disabled={loading}
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Discontinued">Discontinued</option>
              </select>
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Target Cost ($) (Optional)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={formData.target_cost}
              onChange={(e) => setFormData({ ...formData, target_cost: e.target.value })}
              placeholder="e.g. 15.50"
              style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}
              disabled={loading}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13.5, cursor: "pointer", border: "1px solid var(--border)", background: "white" }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13.5, cursor: "pointer", background: "#2563eb", color: "white", border: "none", display: "flex", alignItems: "center", gap: 6 }}
              disabled={loading}
            >
              {loading && <span className="spinner" style={{ width: 12, height: 12 }} />}
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
