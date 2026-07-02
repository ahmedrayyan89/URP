import { useState, useEffect, useCallback } from "react";
import { fetchProducts, fetchProductBOM } from "../api/cmiApi";

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

const IconLeaf = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#16a34a", marginRight: 6 }}>
    <path d="M2 22c1.25-1.5 3.5-2.5 3.5-2.5S8 21 9 22" />
    <path d="M12 2v10" />
    <path d="M18 8H6" />
  </svg>
);

export default function RawMaterialsListPage({ embed = false }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all products
      const productsRes = await fetchProducts({ pageSize: 100 });
      const products = productsRes.items || [];

      // 2. Fetch BOM items for all products in parallel
      const bomPromises = products.map(p =>
        fetchProductBOM(p.id)
          .then(bomItems => ({ product: p, bomItems }))
          .catch(() => ({ product: p, bomItems: [] }))
      );
      const results = await bomPromises;

      // 3. Aggregate unique ingredients / raw materials
      const materialMap = new Map();

      results.forEach(({ product, bomItems }) => {
        bomItems.forEach(item => {
          const nameKey = item.name.trim();
          if (!nameKey) return;

          if (!materialMap.has(nameKey)) {
            materialMap.set(nameKey, {
              name: nameKey,
              unit_of_measure: item.unit_of_measure || "pcs",
              unit_cost: item.unit_cost || 0,
              total_qty: 0,
              products: []
            });
          }

          const existing = materialMap.get(nameKey);
          existing.total_qty += item.quantity;
          
          // Add product to list if not already added
          if (!existing.products.some(p => p.id === product.id)) {
            existing.products.push({
              id: product.id,
              name: product.name,
              category: product.category
            });
          }
          
          // Use the highest unit cost if they differ
          if (item.unit_cost && item.unit_cost > existing.unit_cost) {
            existing.unit_cost = item.unit_cost;
          }
        });
      });

      setMaterials(Array.from(materialMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      setError(e.message || "Failed to load raw materials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering
  const filtered = materials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ["Material Name", "Unit of Measure (UoM)", "Typical Unit Cost", "Total Qty Used", "Associated Products"].join(",");
    const rows = filtered.map(m => [
      m.name,
      m.unit_of_measure,
      m.unit_cost != null ? `$${m.unit_cost.toFixed(4)}` : "—",
      m.total_qty.toFixed(2),
      m.products.map(p => p.name).join("; ")
    ].map(val => `"${val}"`).join(","));

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `raw_materials_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={embed ? "" : "shell-page"} style={embed ? { padding: 0 } : undefined}>
      {/* ── Header Row ── */}
      <div style={{ display: "flex", justifyContent: embed ? "flex-end" : "space-between", alignItems: "center", marginBottom: 20 }}>
        {!embed && (
          <div>
            <div style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#16a34a",
              padding: "6px 16px",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center"
            }}>
              Raw Materials
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "white", border: "1px solid var(--border)", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            <IconDownload /> Export
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {/* ── Search bar and Count line ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>
          Showing <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{filtered.length}</span> of {materials.length} materials
        </div>
        <div style={{ position: "relative", width: 260 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Search raw materials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 30, height: 36, fontSize: 13 }}
          />
        </div>
      </div>

      {/* ── Data Table ── */}
      {loading ? (
        <div className="empty" style={{ padding: 40 }}>
          <span className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ padding: 40 }}>
          <div className="empty-title">No Raw Materials</div>
          <div className="empty-sub">Add raw materials inside product bill of materials (BOM) items to list them here.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>UoM</th>
                  <th style={{ textAlign: "right" }}>Typical Unit Cost</th>
                  <th>Total Usage Qty</th>
                  <th>Associated Products</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, display: "flex", alignItems: "center" }}>
                      <IconLeaf />
                      {m.name}
                    </td>
                    <td><span className="badge badge-grey">{m.unit_of_measure}</span></td>
                    <td style={{ textAlign: "right", fontWeight: 500 }}>
                      {m.unit_cost != null ? `$${m.unit_cost.toFixed(4)}` : "—"}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {m.total_qty.toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {m.products.map(p => (
                          <span
                            key={p.id}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              color: "#2563eb",
                              fontSize: 11,
                              fontWeight: 500
                            }}
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
