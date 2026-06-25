import { useRef, useState } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ── Icons ──────────────────────────────────────────────────────────────────
function IconCopy({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function IconCheckCircle({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function IconUploadCloud({ size = 36, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 13v8" />
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="m8 17 4-4 4 4" />
    </svg>
  );
}

function IconFileDoc({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────
const PARSERS = [
  {
    id: "invoice",
    icon: "📄",
    name: "Invoice Parser",
    description: "Extract vendor, line items, totals and payment terms from invoices.",
    status: "available",
  },
  {
    id: "contract",
    icon: "📝",
    name: "Contract Parser",
    description: "Parse parties, clauses, obligations and expiry dates from legal contracts.",
    status: "coming_soon",
  },
  {
    id: "po",
    icon: "🛒",
    name: "Purchase Order Parser",
    description: "Extract PO number, line items, delivery dates and approval signatures.",
    status: "available",
  },
  {
    id: "w2",
    icon: "📊",
    name: "W2 / Annual Report Parser",
    description: "Structured extraction of tax fields, income statements and financials.",
    status: "coming_soon",
  },
  {
    id: "custom",
    icon: "⚙️",
    name: "Custom Parser",
    description: "Define a custom schema and let the agent extract any structured entity.",
    status: "coming_soon",
  },
];

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/document-intelligence/upload",
    description:
      "Upload a document. Agent extracts structured JSON based on selected parser type.",
  },
  {
    method: "POST",
    path: "/api/document-intelligence/extract",
    description:
      "Extract clauses and pricing from raw text (contract or email).",
  },
];

const MOCK_RESULTS = {
  invoice: {
    invoice_number: "INV-2024-0042",
    vendor: "Acme Supplies Ltd",
    amount: 14250.0,
    currency: "USD",
    date: "2024-03-15",
    due_date: "2024-04-14",
    line_items: [
      { description: "Office Furniture - Ergonomic Chair x10", qty: 10, unit_price: 850.0, total: 8500.0 },
      { description: "Standing Desk - Adjustable x5", qty: 5, unit_price: 1100.0, total: 5500.0 },
      { description: "Delivery & Assembly", qty: 1, unit_price: 250.0, total: 250.0 },
    ],
    tax: 855.0,
    subtotal: 14250.0,
    status: "pending_approval",
  },
  po: {
    po_number: "PO-2024-00891",
    buyer: "TechCorp Inc.",
    supplier: "Global Parts Warehouse",
    issue_date: "2024-03-10",
    delivery_date: "2024-03-28",
    line_items: [
      { sku: "GPU-4090-OC", description: "NVIDIA RTX 4090 OC Edition", qty: 4, unit_price: 1999.99, total: 7999.96 },
      { sku: "RAM-64GB-DDR5", description: "64GB DDR5 ECC RAM Kit", qty: 8, unit_price: 420.0, total: 3360.0 },
    ],
    subtotal: 11359.96,
    tax: 1022.4,
    total: 12382.36,
    approved_by: "Sarah Chen",
    status: "approved",
  },
};

const AVAILABLE_PARSERS = [
  { id: "invoice", label: "Invoice Parser" },
  { id: "po", label: "Purchase Order Parser" },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Section Components ─────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <div className="section-header-accent" />
      <div>
        <div className="section-header-title">{title}</div>
        {subtitle && <div className="section-header-sub">{subtitle}</div>}
      </div>
    </div>
  );
}

function ParserCard({ parser }) {
  const isAvailable = parser.status === "available";
  return (
    <div className="di-parser-card">
      <div className="di-parser-card-top">
        <span className="di-parser-icon">{parser.icon}</span>
        <span className={`badge ${isAvailable ? "badge-green" : "badge-grey"}`}>
          {isAvailable ? "Available" : "Coming Soon"}
        </span>
      </div>
      <div className="di-parser-name">{parser.name}</div>
      <div className="di-parser-desc">{parser.description}</div>
    </div>
  );
}

function EndpointRow({ endpoint }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(endpoint.path).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="di-endpoint-row">
      <span className="di-method-badge">POST</span>
      <div className="di-endpoint-path-wrap">
        <code className="di-endpoint-path">{endpoint.path}</code>
        <button
          type="button"
          className="di-copy-btn"
          onClick={handleCopy}
          title="Copy path"
        >
          {copied ? <IconCheckCircle size={14} /> : <IconCopy size={14} />}
        </button>
      </div>
      <div className="di-endpoint-desc">{endpoint.description}</div>
    </div>
  );
}

function UploadSection() {
  const [parser, setParser] = useState("invoice");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [extractResult, setExtractResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const acceptedTypes = ".pdf,.docx,.png,.jpg,.jpeg";

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setSuccess(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setSuccess(false);
    setError(null);
    setExtractResult(null);
    try {
      const docType = parser === "po" ? "contract" : parser;
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(
        `${BASE}/document-intelligence/upload?doc_type=${encodeURIComponent(docType)}`,
        { method: "POST", body: form }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Extraction failed");
      }
      const data = await res.json();
      setExtractResult(data);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const result = extractResult || (success ? null : MOCK_RESULTS[parser]);

  return (
    <div className="di-upload-section">
      {/* Parser selector */}
      <div className="form-row">
        <label className="form-label" htmlFor="di-parser-select">
          Parser Type
        </label>
        <select
          id="di-parser-select"
          className="input select di-parser-select"
          value={parser}
          onChange={(e) => {
            setParser(e.target.value);
            setSuccess(false);
          }}
          style={{ maxWidth: 340 }}
        >
          {AVAILABLE_PARSERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        className={`di-drop-zone${dragging ? " dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
          id="di-file-input"
        />
        <IconUploadCloud size={38} className="di-drop-icon" />
        <div className="di-drop-text">
          <span className="di-drop-primary">Drag &amp; drop your file here</span>
          <span className="di-drop-secondary">
            or{" "}
            <span className="di-browse-link">browse files</span>
            {" — "}PDF, DOCX, PNG, JPG accepted
          </span>
        </div>
      </div>

      {/* File info */}
      {file && (
        <div className="di-file-info">
          <IconFileDoc size={16} />
          <span className="di-file-name">{file.name}</span>
          <span className="di-file-size">{formatBytes(file.size)}</span>
          <button
            type="button"
            className="di-file-remove"
            onClick={(e) => { e.stopPropagation(); setFile(null); setSuccess(false); }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Process button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button
          id="di-process-btn"
          type="button"
          className="btn btn-primary"
          disabled={!file || loading}
          onClick={handleProcess}
          style={{ minWidth: 160, justifyContent: "center" }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />
              Processing…
            </>
          ) : (
            "Process Document"
          )}
        </button>
      </div>

      {error && <div className="alert alert-error mt-2">{error}</div>}

      {/* Success state */}
      {success && (
        <div className="di-success-area">
          <div className="di-success-banner">
            <IconCheckCircle size={17} />
            Document processed successfully
          </div>

          <div className="di-result-card">
            <div className="di-result-header">
              <span className="di-result-label">Extracted Entity — {AVAILABLE_PARSERS.find(p => p.id === parser)?.label}</span>
              <button type="button" className="btn btn-ghost btn-sm" id="di-view-entity-btn">
                View Entity
              </button>
            </div>
            <pre className="di-result-json">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DocumentIntelligencePage() {
  return (
    <div className="shell-page di-page">
      {/* Page header */}
      <div className="shell-page-header di-page-header">
        <div className="di-page-title-row">
          <div>
            <h1 className="shell-page-title">Document Intelligence</h1>
            <p className="shell-page-sub">
              Upload documents and let AI agents extract structured entities automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1 — Parser Types */}
      <section className="di-section" id="di-parsers-section">
        <SectionHeader
          title="Parser Types"
          subtitle="Choose a specialized parser optimized for each document category."
        />
        <div className="di-parsers-grid">
          {PARSERS.map((p) => (
            <ParserCard key={p.id} parser={p} />
          ))}
        </div>
      </section>

      {/* Section 2 — Endpoints */}
      <section className="di-section" id="di-endpoints-section">
        <SectionHeader
          title="API Endpoints"
          subtitle="Integrate document intelligence directly into your workflows via REST."
        />
        <div className="di-endpoints-list">
          {ENDPOINTS.map((ep) => (
            <EndpointRow key={ep.path} endpoint={ep} />
          ))}
        </div>
      </section>

      {/* Section 3 — Upload & Process */}
      <section className="di-section" id="di-upload-section">
        <SectionHeader
          title="Upload &amp; Process"
          subtitle="Select a parser, upload a document, and get structured JSON output instantly."
        />
        <div className="card" style={{ maxWidth: 780 }}>
          <UploadSection />
        </div>
      </section>
    </div>
  );
}
