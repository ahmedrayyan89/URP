import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, fetchProducts } from "../api/cmiApi";

// ── Icons ──────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-3)" }}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ── CategoryCombobox ──
function CategoryCombobox({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        if (searchValue.trim() && searchValue !== value) {
          onChange(searchValue.trim());
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchValue, value, onChange]);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={searchValue}
          onChange={e => { setSearchValue(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={e => {
            if (e.key === "Enter" && searchValue.trim()) {
              e.preventDefault();
              onChange(searchValue.trim());
              setIsOpen(false);
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder="Select or type a category..."
          style={{
            width: "100%",
            padding: "10px 36px 10px 12px",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 13.5,
            outline: "none",
            background: "white"
          }}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: 4
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: "var(--text-3)",
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.15s"
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      {isOpen && (
        <div style={{
          position: "absolute",
          zIndex: 50,
          width: "100%",
          marginTop: 4,
          background: "white",
          border: "1px solid var(--border)",
          borderRadius: 8,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          maxHeight: 200,
          overflowY: "auto"
        }}>
          {filteredOptions.length > 0 ? (
            <div style={{ padding: "4px 0" }}>
              {filteredOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setSearchValue(option);
                    setIsOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--text)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  <span>{option}</span>
                  {value === option && <span style={{ color: "#2563eb", fontWeight: "bold" }}>✓</span>}
                </button>
              ))}
            </div>
          ) : searchValue.trim() ? (
            <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-3)" }}>
              Press Enter to add "{searchValue.trim()}"
            </div>
          ) : (
            <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-3)" }}>
              No categories found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreateProductPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingCategories, setExistingCategories] = useState([
    "Extracts", "Cocoa Products", "Sweeteners", "Proteins", "Starches", "Flavors", "Acids", "Vitamins", "Blends"
  ]);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    target_cost: "",
    description: "",
  });

  const [touched, setTouched] = useState({
    name: false,
    sku: false
  });

  const [isNotAssociated, setIsNotAssociated] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState("");

  // Load existing categories and extend defaults
  useEffect(() => {
    fetchProducts()
      .then((res) => {
        const cats = Array.from(new Set((res.items || []).map(p => p.category).filter(Boolean)));
        setExistingCategories(prev => Array.from(new Set([...prev, ...cats])));
      })
      .catch(() => {});
  }, []);

  // Completion calculation (0 to 5)
  const getCompletionCount = () => {
    let count = 0;
    if (formData.name.trim()) count++;
    if (formData.sku.trim()) count++;
    if (formData.category.trim()) count++;
    if (formData.target_cost.trim()) count++;
    if (formData.description.trim()) count++;
    return count;
  };

  const completionCount = getCompletionCount();

  const isDetailsComplete =
    formData.name.trim() &&
    formData.sku.trim() &&
    formData.category.trim() &&
    formData.target_cost.trim() &&
    formData.description.trim();

  // Validation states
  const nameError = touched.name && !formData.name.trim();
  const skuError = touched.sku && !formData.sku.trim();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Mark fields as touched on submit to trigger visual red error states if empty
    setTouched({ name: true, sku: true });

    if (!formData.name.trim() || !formData.sku.trim()) {
      setError("Product Name and SKU are required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    const body = {
      name: formData.name,
      sku: formData.sku,
      category: formData.category || "General",
      mapping_type: isNotAssociated ? "INDEPENDENT" : "VENDOR_MAPPED",
      status: "Draft",
      target_cost: formData.target_cost ? parseFloat(formData.target_cost) : null,
      description: formData.description,
    };

    try {
      await createProduct(body);
      navigate(`/projects/${projectId}/entities/products`);
    } catch (err) {
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const renderCheckmark = (isComplete) => {
    if (isComplete) {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#10b981",
          color: "white",
          fontSize: 9,
          fontWeight: "bold",
          flexShrink: 0
        }}>
          ✓
        </span>
      );
    }
    return (
      <span style={{
        display: "inline-flex",
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: "1px solid var(--border)",
        background: "#f8fafc",
        flexShrink: 0
      }} />
    );
  };

  return (
    <div className="shell-page" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", overflow: "hidden", paddingBottom: 16 }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ── Breadcrumbs ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-3)", marginBottom: 8, flexShrink: 0 }}>
        <span
          onClick={() => navigate(`/projects/${projectId}/entities/products`)}
          style={{ cursor: "pointer", color: "var(--text-2)", fontWeight: 500 }}
        >
          Products
        </span>
        <span style={{ color: "var(--border)" }}>&gt;</span>
        <span style={{ color: "#2563eb", fontWeight: 500 }}>Add Product</span>
      </div>

      {/* ── Header Title Row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexShrink: 0 }}>
        <div>
          <h1 className="shell-page-title" style={{ margin: "0 0 4px 0" }}>Add New Product</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-3)" }}>Create a new product with vendor and ingredient associations</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => navigate(`/projects/${projectId}/entities/products`)}
            className="btn btn-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "white", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            ← Back
          </button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "white", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            disabled={loading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Create Product
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4" style={{ borderRadius: 8, flexShrink: 0 }}>{error}</div>}

      {/* ── Main Layout Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24, alignItems: "start", flex: 1, minHeight: 0, overflow: "hidden" }}>
        
        {/* Left Column Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Completion tracker card */}
          <div className="card" style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 8, background: "white" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.05em", marginBottom: 12 }}>COMPLETION</div>
            <div style={{ position: "relative", height: 8, background: "#f1f5f9", borderRadius: 9999, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${(completionCount / 5) * 100}%`, background: "#2563eb", transition: "width 0.2s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>
              {completionCount}/5
            </div>
          </div>

          {/* Sections checklist card */}
          <div className="card" style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 8, background: "white" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.05em", marginBottom: 12 }}>SECTIONS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: isDetailsComplete ? "var(--text)" : "var(--text-3)", fontWeight: 500 }}>
                {renderCheckmark(isDetailsComplete)} Details
              </div>
              
              {isNotAssociated ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", fontWeight: 500 }}>
                  {renderCheckmark(true)} Contract
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>
                  {renderCheckmark(false)} Vendors
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: selectedIngredients.length > 0 ? "var(--text)" : "var(--text-3)", fontWeight: 500 }}>
                {renderCheckmark(selectedIngredients.length > 0)} Ingredients
              </div>
            </div>
          </div>

          {/* Contract status badge card */}
          <div className="card" style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 8, background: "white" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.05em", marginBottom: 12 }}>CONTRACT STATUS</div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: isNotAssociated ? "#fffbeb" : "#ecfdf5",
              border: isNotAssociated ? "1px solid #fde68a" : "1px solid #a7f3d0",
              color: isNotAssociated ? "#b45309" : "#047857",
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              transition: "all 0.2s"
            }}>
              {isNotAssociated ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                    <line x1="9" y1="11" x2="15" y2="11" />
                  </svg>
                  Contract Unmapped
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Contract Linked
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column Main Workspace Forms (Scrollable, no scrollbar layout) */}
        <div className="no-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%", overflowY: "auto" }}>
          
          {/* Card 1: Product Details */}
          <div className="card" style={{ padding: 24, border: "1px solid var(--border)", borderRadius: 8, background: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 4, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="15" y2="17" />
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>Product Details</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Product Name */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  Product Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vanilla Extract Premium"
                  value={formData.name}
                  onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: nameError ? "1.5px solid #ef4444" : "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 13.5,
                    outline: "none"
                  }}
                  disabled={loading}
                />
                {nameError && (
                  <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                    Product name is required
                  </div>
                )}
              </div>

              {/* SKU & Category side-by-side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                    SKU <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VEP-2024-001"
                    value={formData.sku}
                    onBlur={() => setTouched(prev => ({ ...prev, sku: true }))}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: skuError ? "1.5px solid #ef4444" : "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 13.5,
                      outline: "none"
                    }}
                    disabled={loading}
                  />
                  {skuError && (
                    <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                      SKU is required
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Category</label>
                  <CategoryCombobox
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    options={existingCategories}
                  />
                </div>
              </div>

              {/* Target Cost (half width) */}
              <div style={{ width: "calc(50% - 8px)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  $ Target Cost
                </label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={formData.target_cost}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Strict regex to allow only numeric entries (digits and max one decimal point)
                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                      setFormData({ ...formData, target_cost: val });
                    }
                  }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13.5, outline: "none" }}
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Description</label>
                <textarea
                  placeholder="Brief product description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13.5, outline: "none", resize: "vertical", fontFamily: "inherit" }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Contract Association */}
          <div className="card" style={{ padding: 24, border: "1px solid var(--border)", borderRadius: 8, background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  background: isNotAssociated ? "#fffbeb" : "#ecfdf5",
                  border: isNotAssociated ? "1px solid #fde68a" : "1px solid #a7f3d0",
                  color: isNotAssociated ? "#b45309" : "#10b981",
                  transition: "all 0.2s"
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>Contract Association</h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "var(--text-3)" }}>Define whether this product is linked to a contract</p>
                </div>
              </div>
              <span style={{
                background: isNotAssociated ? "#fffbeb" : "#ecfdf5",
                border: isNotAssociated ? "1px solid #fde68a" : "1px solid #a7f3d0",
                color: isNotAssociated ? "#b45309" : "#047857",
                padding: "3px 10px",
                borderRadius: 9999,
                fontSize: 11.5,
                fontWeight: 500,
                transition: "all 0.2s"
              }}>
                {isNotAssociated ? "Contract Unmapped Product" : "Contract Linked Product"}
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: 16,
              border: isNotAssociated ? "1.5px solid #fbbf24" : "1px solid var(--border)",
              borderRadius: 8,
              background: isNotAssociated ? "#fffbeb" : "#f8fafc",
              transition: "all 0.2s"
            }}>
              <input
                type="checkbox"
                checked={isNotAssociated}
                onChange={(e) => setIsNotAssociated(e.target.checked)}
                style={{ marginTop: 3, cursor: "pointer", width: 16, height: 16 }}
              />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13.5, color: isNotAssociated ? "#b45309" : "var(--text)" }}>
                  Product is NOT associated with any contract
                  <span style={{ color: "var(--text-3)", cursor: "help" }} title="When checked, this product can be mapped directly to BOM raw materials without vendor contracts">ⓘ</span>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: 12, color: isNotAssociated ? "#b45309" : "var(--text-3)", opacity: 0.9, lineHeight: 1.45 }}>
                  If enabled, the product can be created without vendor mapping. Ingredients can be added independently.
                </p>
              </div>
            </div>

            {/* Warning Box visible when checked */}
            {isNotAssociated && (
              <div style={{
                marginTop: 12,
                padding: "12px 16px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 6,
                color: "#b45309",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                fontSize: 12.5,
                lineHeight: 1.45,
                animation: "fadeIn 0.2s ease"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>Vendor mapping disabled</div>
                  <div>The vendor association section is hidden. Ingredients will be added without vendor restrictions.</div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Ingredients */}
          <div className="card" style={{ padding: 24, border: "1px solid var(--border)", borderRadius: 8, background: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 4, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5h20s-1-2.25-2.5-3.5" />
                  <path d="M12 2v10" />
                  <path d="M18 8H6" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>Ingredients</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "var(--text-3)" }}>
                  Only ingredients with a contract-linked vendor source are listed — each row needs a vendor
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                  <IconSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search contract-linked ingredients..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && ingredientSearch.trim()) {
                      e.preventDefault();
                      if (!selectedIngredients.includes(ingredientSearch.trim())) {
                        setSelectedIngredients(prev => [...prev, ingredientSearch.trim()]);
                      }
                      setIngredientSearch("");
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    fontSize: 13,
                    outline: "none",
                    background: "white"
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (ingredientSearch.trim()) {
                    if (!selectedIngredients.includes(ingredientSearch.trim())) {
                      setSelectedIngredients(prev => [...prev, ingredientSearch.trim()]);
                    }
                    setIngredientSearch("");
                  }
                }}
                className="btn btn-ghost"
                style={{
                  padding: "0 16px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  height: 38
                }}
              >
                Add
              </button>
            </div>

            {selectedIngredients.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {selectedIngredients.map((ing, idx) => (
                  <div key={idx} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#f1f5f9",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: "4px 12px",
                    fontSize: 12.5,
                    color: "var(--text-2)"
                  }}>
                    {ing}
                    <button
                      onClick={() => setSelectedIngredients(prev => prev.filter((_, i) => i !== idx))}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-3)",
                        padding: 0,
                        fontSize: 14,
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
