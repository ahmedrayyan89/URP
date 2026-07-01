import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchVendorById, createVendor, updateVendor } from "../api/cmiApi";

// ── Icons ──────────────────────────────────────────────────────────────────
const IconBuilding = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="22" x2="9" y2="16" /><line x1="15" y1="22" x2="15" y2="16" /><line x1="9" y1="16" x2="15" y2="16" /><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M9 6h.01" /><path d="M15 6h.01" />
  </svg>
);
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16.92z" />
  </svg>
);
const IconHash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);
const IconTag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IconGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);
const IconBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["Active", "Inactive", "Pending"];
const CATEGORY_OPTIONS = [
  "Ingredients Supplier", "Packaging Supplier", "Flavor House",
  "Chemical Supplier", "Logistics Partner", "Contract Manufacturer",
];
const DEFAULT_COUNTRY_OPTIONS = [
  "United States", "Germany", "Switzerland", "Japan", "Netherlands",
  "France", "United Kingdom", "China", "India", "Brazil", "Mexico", "Canada",
];

// ── Combobox (Category / Country) ─────────────────────────────────────────
function Combobox({ value, onChange, options, placeholder = "Select or type..." }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef(null);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        if (search.trim() && search !== value) onChange(search.trim());
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [search, value, onChange]);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const isNew = search.trim() && !options.some(o => o.toLowerCase() === search.trim().toLowerCase());

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          className="input"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === "Enter" && search.trim()) { e.preventDefault(); onChange(search.trim()); setOpen(false); }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          style={{ paddingRight: 32, fontSize: 13 }}
        />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "var(--text-3)",
            display: "flex", alignItems: "center",
          }}
        >
          <span style={{ transform: open ? "rotate(180deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}>
            <IconChevronDown />
          </span>
        </button>
      </div>
      {open && (
        <div style={{
          position: "absolute", zIndex: 1000, top: "100%", left: 0, right: 0, marginTop: 4,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)", maxHeight: 220, overflowY: "auto",
        }}>
          {filtered.map(opt => (
            <button
              key={opt} type="button"
              onClick={() => { onChange(opt); setSearch(opt); setOpen(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "9px 14px", background: "none",
                border: "none", cursor: "pointer", fontSize: 13, display: "flex",
                alignItems: "center", justifyContent: "space-between",
                color: "var(--text)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <span>{opt}</span>
              {value === opt && <span style={{ color: "var(--primary)" }}><IconCheck /></span>}
            </button>
          ))}
          {isNew && (
            <>
              {filtered.length > 0 && <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />}
              <button
                type="button"
                onClick={() => { onChange(search.trim()); setOpen(false); }}
                style={{
                  width: "100%", textAlign: "left", padding: "9px 14px", background: "none",
                  border: "none", cursor: "pointer", fontSize: 13, display: "flex",
                  alignItems: "center", gap: 8, color: "var(--primary)",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <IconPlus /> Add "{search.trim()}"
              </button>
            </>
          )}
          {filtered.length === 0 && !isNew && (
            <div style={{ padding: "9px 14px", fontSize: 12, color: "var(--text-3)" }}>No options found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── FormField ──────────────────────────────────────────────────────────────
function FormField({ label, required, hint, error, icon, children }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
        {icon && <span style={{ color: "var(--text-3)", display: "flex" }}>{icon}</span>}
        {label}
        {required && <span style={{ color: "var(--red)" }}>*</span>}
      </label>
      {children}
      {error ? (
        <p style={{ marginTop: 4, fontSize: 11, color: "var(--red)" }}>{error}</p>
      ) : hint ? (
        <p style={{ marginTop: 4, fontSize: 11, color: "var(--text-3)" }}>{hint}</p>
      ) : null}
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────
function ProgressBar({ value }) {
  return (
    <div style={{ height: 6, background: "var(--surface-3)", borderRadius: 99, overflow: "hidden" }}>
      <div
        style={{
          height: "100%", background: "var(--primary-2)", borderRadius: 99,
          width: `${value}%`, transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

// ── Section Status Dot ─────────────────────────────────────────────────────
function SectionRow({ label, done }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
        background: done ? "#ecfdf5" : "var(--surface-3)",
        border: `1px solid ${done ? "#6ee7b7" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {done && <span style={{ color: "#059669", display: "flex" }}><IconCheck /></span>}
      </div>
      <span style={{ fontSize: 13, color: done ? "var(--text)" : "var(--text-3)", fontWeight: done ? 500 : 400 }}>
        {label}
      </span>
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
function Spinner({ size = 14 }) {
  return (
    <div style={{
      width: size, height: size,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTop: "2px solid #fff",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
      flexShrink: 0,
    }} />
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
function SectionCard({ children }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      {children}
    </div>
  );
}

function SectionHeading({ icon, label, iconBg = "var(--primary-light)", iconColor = "var(--primary)" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        color: iconColor,
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>{label}</h3>
    </div>
  );
}

// ── VendorFormPage ─────────────────────────────────────────────────────────
const VALIDATION_FIELDS = ["name", "code", "contactEmail"];

function validateField(key, value) {
  if (key === "name" && !value.trim()) return "Vendor name is required";
  if (key === "code" && !value.trim()) return "Vendor code is required";
  if (key === "contactEmail" && !value.trim()) return "Contact email is required";
  if (key === "contactEmail" && value.trim() && !/\S+@\S+\.\S+/.test(value)) return "Invalid email format";
  return "";
}

export default function VendorFormPage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== "new";
  const nameRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null); // { msg, type }
  const [form, setForm] = useState({
    name: "", code: "", category: "", contactName: "",
    contactEmail: "", phone: "", address: "", country: "", status: "Active",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [countryOptions, setCountryOptions] = useState([...DEFAULT_COUNTRY_OPTIONS]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load existing vendor when editing
  useEffect(() => {
    if (!isEdit) {
      setTimeout(() => nameRef.current?.focus(), 100);
      return;
    }
    fetchVendorById(id)
      .then((v) => {
        if (!v) { setLoadError("Vendor not found."); return; }
        const country = (v.country ?? "").trim();
        if (country) {
          setCountryOptions(prev =>
            prev.some(c => c.toLowerCase() === country.toLowerCase()) ? prev : [...prev, country]
          );
        }
        setForm({
          name: v.name, code: v.code, category: v.category,
          contactName: v.contact_name ?? "", contactEmail: v.contact_email ?? "",
          phone: v.phone ?? "", address: v.address ?? "",
          country: v.country ?? "", status: v.status,
        });
      })
      .catch(e => setLoadError(e.message || "Failed to load vendor"));
  }, [id, isEdit]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (touched[key]) {
      const err = validateField(key, value);
      setErrors(prev => err ? { ...prev, [key]: err } : (() => { const n = { ...prev }; delete n[key]; return n; })());
    }
  };

  const handleBlur = (key) => {
    setTouched(prev => ({ ...prev, [key]: true }));
    const err = validateField(key, form[key]);
    setErrors(prev => err ? { ...prev, [key]: err } : (() => { const n = { ...prev }; delete n[key]; return n; })());
  };

  const handleCountryChange = (country) => {
    const trimmed = country.trim();
    handleChange("country", trimmed);
    if (trimmed) {
      setCountryOptions(prev =>
        prev.some(c => c.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed]
      );
    }
  };

  const handleSave = async () => {
    const allTouched = {};
    const allErrors = {};
    VALIDATION_FIELDS.forEach(k => {
      allTouched[k] = true;
      const err = validateField(k, form[k]);
      if (err) allErrors[k] = err;
    });
    setTouched(prev => ({ ...prev, ...allTouched }));
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      showToast("Please fix the highlighted errors before saving.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name, code: form.code, category: form.category,
        contact_name: form.contactName, contact_email: form.contactEmail,
        phone: form.phone, address: form.address,
        country: form.country, status: form.status,
      };
      if (isEdit) {
        await updateVendor(id, payload);
        showToast("Vendor updated successfully.");
      } else {
        await createVendor(payload);
        showToast("Vendor created successfully.");
      }
      setTimeout(() => navigate(`/projects/${projectId}/entities/vendors`), 600);
    } catch (e) {
      showToast(e.message || "An error occurred while saving.", "error");
    } finally {
      setSaving(false);
    }
  };

  const completedFields = Object.values(form).filter(v => v.trim() !== "").length;
  const totalFields = Object.keys(form).length;
  const progressPct = Math.round((completedFields / totalFields) * 100);

  const vendorsPath = `/projects/${projectId}/entities/vendors`;

  if (loadError) {
    return (
      <div className="shell-page">
        <div className="alert alert-error">{loadError}</div>
        <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => navigate(vendorsPath)}>
          ← Back to Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="shell-page" style={{ position: "relative" }}>
      {/* Spin keyframe */}
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
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>
        <span
          style={{ cursor: "pointer", color: "var(--primary)", textDecoration: "none" }}
          onClick={() => navigate(vendorsPath)}
        >
          Vendors
        </span>
        <span>/</span>
        <span style={{ color: "var(--text-2)", fontWeight: 500 }}>
          {isEdit ? "Edit Vendor" : "Add Vendor"}
        </span>
      </div>

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 className="shell-page-title" style={{ margin: 0 }}>
            {isEdit ? "Edit Vendor" : "Add New Vendor"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>
            {isEdit ? "Update vendor information" : "Register a new vendor in the system"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate(vendorsPath)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <IconBack /> Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--primary-2)" }}
          >
            {saving ? <Spinner /> : <IconSave />}
            {isEdit ? "Save Changes" : "Create Vendor"}
          </button>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* ── Left sidebar ── */}
        <aside style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Completion */}
          <SectionCard>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 10 }}>
              Completion
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <ProgressBar value={progressPct} />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                {completedFields}/{totalFields}
              </span>
            </div>
          </SectionCard>

          {/* Sections */}
          <SectionCard>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 8 }}>
              Sections
            </p>
            <SectionRow label="Company" done={!!(form.name && form.code)} />
            <SectionRow label="Contact" done={!!(form.contactName && form.contactEmail)} />
            <SectionRow label="Location" done={!!form.country} />
          </SectionCard>
        </aside>

        {/* ── Right form area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {/* Company Information */}
          <SectionCard>
            <SectionHeading icon={<IconBuilding />} label="Company Information" iconBg="var(--primary-light)" iconColor="var(--primary)" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Vendor Name" required error={errors.name} icon={<IconBuilding />}>
                <input
                  ref={nameRef}
                  type="text"
                  className={`input${errors.name ? " input-error" : ""}`}
                  value={form.name}
                  disabled={!!isEdit}
                  onChange={e => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="e.g. Cargill Inc."
                  style={{ fontSize: 13, opacity: isEdit ? 0.65 : 1 }}
                />
              </FormField>

              <FormField label="Vendor Code" required error={errors.code} hint={!errors.code ? "Unique identifier for this vendor" : undefined} icon={<IconHash />}>
                <input
                  type="text"
                  className={`input${errors.code ? " input-error" : ""}`}
                  value={form.code}
                  disabled={!!isEdit}
                  onChange={e => handleChange("code", e.target.value)}
                  onBlur={() => handleBlur("code")}
                  placeholder="e.g. CARG-001"
                  style={{ fontSize: 13, opacity: isEdit ? 0.65 : 1 }}
                />
              </FormField>

              <FormField label="Category" icon={<IconTag />}>
                <Combobox
                  value={form.category}
                  onChange={v => handleChange("category", v)}
                  options={CATEGORY_OPTIONS}
                  placeholder="Select or type a category..."
                />
              </FormField>

              <FormField label="Status">
                <select
                  className="input select"
                  value={form.status}
                  onChange={e => handleChange("status", e.target.value)}
                  style={{ fontSize: 13 }}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </SectionCard>

          {/* Contact Details */}
          <SectionCard>
            <SectionHeading
              icon={<IconUser />}
              label="Contact Details"
              iconBg="rgba(99,102,241,0.1)"
              iconColor="#6366f1"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Contact Name" icon={<IconUser />}>
                <input
                  type="text"
                  className="input"
                  value={form.contactName}
                  onChange={e => handleChange("contactName", e.target.value)}
                  placeholder="Primary contact full name"
                  style={{ fontSize: 13 }}
                />
              </FormField>

              <FormField label="Contact Email" required error={errors.contactEmail} icon={<IconMail />}>
                <input
                  type="email"
                  className={`input${errors.contactEmail ? " input-error" : ""}`}
                  value={form.contactEmail}
                  onChange={e => handleChange("contactEmail", e.target.value)}
                  onBlur={() => handleBlur("contactEmail")}
                  placeholder="contact@company.com"
                  style={{ fontSize: 13 }}
                />
              </FormField>

              <FormField label="Phone" icon={<IconPhone />}>
                <input
                  type="tel"
                  className="input"
                  value={form.phone}
                  onChange={e => handleChange("phone", e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  style={{ fontSize: 13 }}
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Location */}
          <SectionCard>
            <SectionHeading
              icon={<IconMapPin />}
              label="Location"
              iconBg="rgba(20,184,166,0.1)"
              iconColor="#14b8a6"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Address" icon={<IconMapPin />}>
                <input
                  type="text"
                  className="input"
                  value={form.address}
                  onChange={e => handleChange("address", e.target.value)}
                  placeholder="Full business address"
                  style={{ fontSize: 13 }}
                />
              </FormField>

              <FormField label="Country" icon={<IconGlobe />}>
                <Combobox
                  value={form.country}
                  onChange={handleCountryChange}
                  options={countryOptions}
                  placeholder="Select or type a country..."
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Bottom actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 32 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(vendorsPath)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--primary-2)" }}
            >
              {saving ? <Spinner /> : <IconSave />}
              {isEdit ? "Save Changes" : "Create Vendor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
