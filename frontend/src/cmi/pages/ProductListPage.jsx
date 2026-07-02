import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProducts } from "../api/cmiApi";
import CreateProductModal from "./CreateProductModal";

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

const IconBox = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#2563eb" }}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
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

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const STATUS_COLORS = {
  Active: "badge-green",
  Discontinued: "badge-grey",
  Draft: "badge-amber",
};

export default function ProductListPage({ embed = false }) {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [sortField, setSortField] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const refreshList = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchProducts()
      .then((res) => setProducts(res.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filtered = products
    .filter((p) => {
      const s =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.primary_vendor_name || "").toLowerCase().includes(search.toLowerCase());
      
      let st = true;
      if (statusFilter) {
        st = (p.status || "").trim().toLowerCase() === statusFilter.toLowerCase();
      }

      let cat = true;
      if (categoryFilter) {
        cat = (p.category || "").trim().toLowerCase() === categoryFilter.toLowerCase();
      }
      
      return s && st && cat;
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortField === "name") {
        valA = a.name || "";
        valB = b.name || "";
      } else if (sortField === "category") {
        valA = a.category || "";
        valB = b.category || "";
      } else if (sortField === "vendor") {
        valA = a.primary_vendor_name || "";
        valB = b.primary_vendor_name || "";
      } else if (sortField === "status") {
        valA = a.status || "";
        valB = b.status || "";
      } else if (sortField === "unit_cost") {
        valA = a.unit_cost != null ? a.unit_cost : -Infinity;
        valB = b.unit_cost != null ? b.unit_cost : -Infinity;
      } else if (sortField === "margin") {
        valA = a.margin != null ? a.margin : -Infinity;
        valB = b.margin != null ? b.margin : -Infinity;
      } else if (sortField === "ingredient_count") {
        valA = a.ingredient_count != null ? a.ingredient_count : 0;
        valB = b.ingredient_count != null ? b.ingredient_count : 0;
      } else {
        valA = a[sortField] || "";
        valB = b[sortField] || "";
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Product Name", "Category", "Vendor", "Status", "Unit Cost", "Margin", "Raw Materials"].join(",");
    const rows = filtered.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.primary_vendor_name || ""}"`,
      `"${p.status}"`,
      `"${p.unit_cost != null ? p.unit_cost : ""}"`,
      `"${p.margin != null ? p.margin : ""}"`,
      `"${p.ingredient_count != null ? p.ingredient_count : 0}"`
    ].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSuccess = (newProduct) => {
    setShowAddModal(false);
    setProducts(prev => [newProduct, ...prev]);
    setSuccessMsg(`Product "${newProduct.name}" successfully created.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const renderSortableHeader = (label, field, width) => {
    const isSorted = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        style={{
          width,
          textTransform: "uppercase",
          fontSize: 11,
          fontWeight: 600,
          color: isSorted ? "var(--text)" : "var(--text-3)",
          padding: "12px 16px",
          textAlign: "left",
          letterSpacing: "0.05em",
          cursor: "pointer",
          userSelect: "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {label}
          {isSorted ? (
            <span style={{ fontSize: 10, color: "#2563eb" }}>{sortAsc ? "▲" : "▼"}</span>
          ) : (
            <span style={{ fontSize: 10, color: "var(--border)", opacity: 0.5 }}>▲</span>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className={embed ? "" : "shell-page"} style={embed ? { padding: 0 } : undefined}>
      {/* ── Header Row ── */}
      <div style={{ display: "flex", justifyContent: embed ? "flex-end" : "space-between", alignItems: "center", marginBottom: 20 }}>
        {!embed && (
          <div>
            <div style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#2563eb",
              padding: "6px 16px",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center"
            }}>
              Products
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
          <button
            onClick={() => navigate(`/projects/${projectId}/entities/products/new`)}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "white", border: "none", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            <IconPlus /> Add Product
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}
      {successMsg && <div className="alert alert-success mb-2" style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#047857", padding: "12px 16px", borderRadius: 8, fontSize: 14 }}>{successMsg}</div>}

      {/* ── Search & Filter Controls ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>
          Showing {filtered.length} of {products.length} products
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          {/* Expanded Search Input */}
          {isSearchOpen && (
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                fontSize: 13,
                width: 200,
                outline: "none",
                background: "white"
              }}
              autoFocus
            />
          )}

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            style={{
              background: isSearchOpen ? "#eff6ff" : "white",
              border: isSearchOpen ? "1px solid #bfdbfe" : "1px solid var(--border)",
              color: isSearchOpen ? "#2563eb" : "var(--text-2)",
              borderRadius: 6,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              outline: "none"
            }}
            title="Search products"
          >
            <IconSearch />
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            style={{
              background: isFilterOpen ? "#eff6ff" : "white",
              border: isFilterOpen ? "1px solid #bfdbfe" : "1px solid var(--border)",
              color: isFilterOpen ? "#2563eb" : "var(--text-2)",
              borderRadius: 6,
              padding: "8px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              outline: "none",
              height: 36
            }}
          >
            <IconFilter /> Filter
          </button>

          {/* Filter Dropdown Menu */}
          {isFilterOpen && (
            <div style={{
              position: "absolute",
              top: 42,
              right: 80,
              background: "white",
              border: "1px solid var(--border)",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              padding: 12,
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 160
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase" }}>Status</div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, background: "white", width: "100%", outline: "none" }}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Discontinued">Discontinued</option>
              </select>
              
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", marginTop: 4 }}>Category</div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, background: "white", width: "100%", outline: "none" }}
              >
                <option value="">All Categories</option>
                {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* View Toggles */}
          <button
            onClick={() => setViewMode("list")}
            style={{
              background: viewMode === "list" ? "#eff6ff" : "white",
              border: viewMode === "list" ? "1px solid #bfdbfe" : "1px solid var(--border)",
              color: viewMode === "list" ? "#2563eb" : "var(--text-3)",
              borderRadius: 6,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              outline: "none"
            }}
            title="List View"
          >
            <IconList />
          </button>
          <button
            onClick={() => setViewMode("card")}
            style={{
              background: viewMode === "card" ? "#eff6ff" : "white",
              border: viewMode === "card" ? "1px solid #bfdbfe" : "1px solid var(--border)",
              color: viewMode === "card" ? "#2563eb" : "var(--text-3)",
              borderRadius: 6,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              outline: "none"
            }}
            title="Grid View"
          >
            <IconGrid />
          </button>
        </div>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <div className="empty" style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <span className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ background: "white", border: "1px solid var(--border)", padding: "64px 32px", borderRadius: 8, textAlign: "center" }}>
          <div className="empty-title" style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>No products found</div>
          <div className="empty-sub" style={{ fontSize: 14, color: "var(--text-3)" }}>No products match your current filters.</div>
        </div>
      ) : viewMode === "list" ? (
        <div className="card" style={{ padding: 0, border: "1px solid var(--border)", borderRadius: 8, background: "white", overflow: "hidden" }}>
          <div className="data-table-wrap">
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fcfcfc", borderBottom: "1px solid var(--border)" }}>
                  {renderSortableHeader("Product", "name", "22%")}
                  {renderSortableHeader("Category", "category", "12%")}
                  {renderSortableHeader("Vendor", "vendor", "15%")}
                  {renderSortableHeader("Status", "status", "12%")}
                  {renderSortableHeader("Unit Cost", "unit_cost", "12%")}
                  {renderSortableHeader("Margin", "margin", "10%")}
                  {renderSortableHeader("Raw Materials", "ingredient_count", "10%")}
                  <th style={{ width: "7%", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-3)", padding: "12px 16px", textAlign: "right", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="clickable-row"
                    onClick={() => navigate(`/projects/${projectId}/entities/products/${p.id}`)}
                    style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s", background: "white" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <IconBox />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13.5 }}>{p.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-2)" }}>{p.category}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-2)" }}>{p.primary_vendor_name || "No Primary Vendor"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`badge ${STATUS_COLORS[p.status] || "badge-grey"}`}>{p.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 500, color: "var(--text-2)" }}>
                      {p.unit_cost != null ? `$${Number(p.unit_cost).toFixed(2)}` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 500, color: "var(--text-2)" }}>
                      {p.margin != null ? `${Number(p.margin).toFixed(1)}%` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 500, color: "var(--text-2)" }}>
                      {p.ingredient_count != null ? p.ingredient_count : 0}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${projectId}/entities/products/${p.id}`);
                        }}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${projectId}/entities/products/${p.id}`)}
              style={{ background: "white", border: "1px solid var(--border)", borderRadius: 8, padding: 18, cursor: "pointer", transition: "all 0.2s" }}
              className="project-card"
            >
              <div style={{ display: "flex", alignItems: "start", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconBox />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{p.sku}</div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span className={`badge ${STATUS_COLORS[p.status] || "badge-grey"}`}>{p.status}</span>
                <span className="badge badge-grey">{p.category}</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-3)", display: "block" }}>Vendor</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>{p.primary_vendor_name || "—"}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", display: "block" }}>Unit Cost</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>
                    {p.unit_cost != null ? `$${Number(p.unit_cost).toFixed(2)}` : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <CreateProductModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
