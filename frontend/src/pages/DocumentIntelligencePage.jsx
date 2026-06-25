import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ── API base ───────────────────────────────────────────────────────────────
const API = "http://localhost:8000/api/v1/document-intelligence";

// ── Inline SVG icons ───────────────────────────────────────────────────────
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
function IconCheckCircle({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
function IconAlertCircle({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function IconX({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconArrowRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ── Parser icons map ───────────────────────────────────────────────────────
const PARSER_ICONS = {
  invoice:        "📄",
  purchase_order: "🛒",
};
function parserIcon(type) {
  return PARSER_ICONS[type] || "📑";
}

// ── Utilities ──────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Lightweight JSON tokeniser — no external library.
 * Returns HTML string with span-wrapped tokens.
 */
function tokeniseJson(jsonStr) {
  return jsonStr.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-num";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-str";
      } else if (/true|false/.test(match)) {
        cls = "json-bool";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

// ── Section header ─────────────────────────────────────────────────────────
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

// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return <div className="di-skeleton di-skeleton-card" />;
}

// ── Confidence bar ─────────────────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const pct = Math.round((value ?? 0) * 100);
  const isAmber = pct < 75;
  return (
    <div className="di-confidence-wrap" style={{ width: "100%", maxWidth: 260 }}>
      <div className="di-confidence-bar-bg">
        <div
          className={`di-confidence-bar-fill${isAmber ? " amber" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="di-confidence-val">{pct}%</span>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    complete:     { cls: "badge-green", label: "Complete" },
    needs_review: { cls: "badge-amber", label: "Needs Review" },
    failed:       { cls: "badge-red",   label: "Failed" },
  };
  const { cls, label } = map[status] || { cls: "badge-grey", label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Result section ─────────────────────────────────────────────────────────
function ResultSection({ result, parserLabel, onViewEntities }) {
  const jsonStr = JSON.stringify(result.entity, null, 2);
  const highlighted = tokeniseJson(jsonStr);

  return (
    <div className="di-success-area">
      <div className="di-success-banner">
        <IconCheckCircle size={17} />
        Document processed and saved successfully
      </div>

      <div className="di-result-card">
        {/* Meta row */}
        <div className="di-result-meta">
          <div className="di-meta-item">
            <span className="di-meta-label">Parser</span>
            <span className="di-meta-value">{parserLabel}</span>
          </div>
          <div className="di-meta-item">
            <span className="di-meta-label">Status</span>
            <StatusBadge status={result.status} />
          </div>
          <div className="di-meta-item">
            <span className="di-meta-label">Confidence</span>
            <ConfidenceBar value={result.overall_confidence} />
          </div>
          <div className="di-meta-item">
            <span className="di-meta-label">Entity ID</span>
            <span className="di-meta-value" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
              {result.entity_id?.slice(0, 8)}…
            </span>
          </div>
        </div>

        {/* JSON viewer header */}
        <div className="di-result-header">
          <span className="di-result-label">Extracted Entity JSON</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            id="di-view-entity-btn"
            onClick={onViewEntities}
          >
            View in Entities →
          </button>
        </div>

        {/* JSON body */}
        <pre
          className="di-result-json"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  );
}

// ── Inline Upload Panel (shown when a parser is selected) ──────────────────
function ParserUploadPanel({ parser, onClose }) {
  const [projectId, setProjectId] = useState("default_project");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef();
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleProcess = async () => {
    if (!file || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("parser_type", parser.type);
    formData.append("project_id", projectId.trim() || "default_project");

    try {
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const json = await res.json();
          if (json.detail) {
            if (typeof json.detail === "string") {
              detail = json.detail;
            } else if (Array.isArray(json.detail)) {
              detail = json.detail.map(d => `${d.loc?.join(".") || "error"}: ${d.msg}`).join(", ");
            } else {
              detail = JSON.stringify(json.detail);
            }
          }
        } catch { /* swallow */ }
        throw new Error(detail);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Build accept string from parser.accepts if available
  const acceptStr = parser.accepts?.map(ext => `.${ext.replace(/^\./, "")}`).join(",") || ".pdf,.jpg,.jpeg,.png";
  const acceptDisplay = parser.accepts?.join(", ") || "PDF, JPG, PNG";

  return (
    <div className="di-upload-panel" id={`di-upload-panel-${parser.type}`}>
      {/* Panel header */}
      <div className="di-upload-panel-header">
        <div className="di-upload-panel-title">
          <span className="di-upload-panel-icon">{parserIcon(parser.type)}</span>
          <div>
            <div className="di-upload-panel-name">{parser.label}</div>
            <div className="di-upload-panel-sub">{parser.description}</div>
          </div>
        </div>
        <button
          type="button"
          className="di-upload-panel-close"
          onClick={onClose}
          aria-label="Close upload panel"
          id={`di-close-panel-${parser.type}`}
        >
          <IconX size={15} />
        </button>
      </div>

      <div className="di-upload-panel-body">
        {/* Project ID */}
        <div className="form-row">
          <label className="form-label" htmlFor={`di-project-id-${parser.type}`}>Project ID</label>
          <input
            id={`di-project-id-${parser.type}`}
            type="text"
            className="input"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="default_project"
            style={{ maxWidth: 340 }}
            disabled={loading}
          />
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
            accept={acceptStr}
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
            id={`di-file-input-${parser.type}`}
          />
          <IconUploadCloud size={38} className="di-drop-icon" />
          <div className="di-drop-text">
            <span className="di-drop-primary">Drag &amp; drop your file here</span>
            <span className="di-drop-secondary">
              or <span className="di-browse-link">browse files</span>
              {" — "}{acceptDisplay} accepted
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
              onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setError(null); }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Process button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button
            id={`di-process-btn-${parser.type}`}
            type="button"
            className="btn btn-primary"
            disabled={!file || loading}
            onClick={handleProcess}
            style={{ minWidth: 180, justifyContent: "center", display: "flex", alignItems: "center", gap: 8 }}
          >
            {loading ? (
              <>
                <span className="di-btn-spinner" />
                Processing…
              </>
            ) : (
              "Process Document"
            )}
          </button>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="di-processing-state">
            <div className="di-processing-spinner" />
            Sending to Azure Document Intelligence… this may take a few seconds.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="di-error-banner" id={`di-error-banner-${parser.type}`}>
            <IconAlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <ResultSection
            result={result}
            parserLabel={parser.label}
            onViewEntities={() => navigate(`/projects/${routeProjectId}/entities`)}
          />
        )}
      </div>
    </div>
  );
}

// ── Parser card (clickable) ────────────────────────────────────────────────
function ParserCard({ parser, isSelected, onSelect }) {
  const isAvailable = parser.status === "available";
  return (
    <button
      type="button"
      className={`di-parser-card${isSelected ? " selected" : ""}${isAvailable ? " clickable" : " disabled"}`}
      onClick={() => isAvailable && onSelect(parser.type)}
      id={`di-parser-card-${parser.type}`}
      aria-pressed={isSelected}
      disabled={!isAvailable}
      title={isAvailable ? `Click to upload a ${parser.label}` : "Coming soon"}
    >
      <div className="di-parser-card-top">
        <span className="di-parser-icon">{parserIcon(parser.type)}</span>
        <span className={`badge ${isAvailable ? "badge-green" : "badge-grey"}`}>
          {isAvailable ? "Available" : "Coming Soon"}
        </span>
      </div>
      <div className="di-parser-name">{parser.label}</div>
      <div className="di-parser-desc">{parser.description}</div>
      {parser.accepts && (
        <div className="di-parser-accepts">
          {parser.accepts.map((ext) => (
            <span key={ext} className="di-file-chip">{ext}</span>
          ))}
        </div>
      )}
      {isAvailable && (
        <div className="di-parser-cta">
          <span>{isSelected ? "Panel open below ↓" : "Click to upload"}</span>
          {!isSelected && <IconArrowRight size={13} />}
        </div>
      )}
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DocumentIntelligencePage() {
  const [parsers, setParsers] = useState([]);
  const [parsersLoading, setParsersLoading] = useState(true);
  const [parsersError, setParsersError] = useState(null);
  const [selectedParserType, setSelectedParserType] = useState(null);

  const panelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setParsersLoading(true);
    fetch(`${API}/parsers`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setParsers(data);
          setParsersLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setParsersError(err.message);
          setParsersLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Scroll the panel into view when it opens
  useEffect(() => {
    if (selectedParserType && panelRef.current) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
    }
  }, [selectedParserType]);

  const handleSelectParser = (type) => {
    setSelectedParserType((prev) => (prev === type ? null : type));
  };

  const selectedParser = parsers.find((p) => p.type === selectedParserType);

  return (
    <div className="shell-page di-page">
      {/* Page header */}
      <div className="shell-page-header di-page-header">
        <div className="di-page-title-row">
          <div>
            <h1 className="shell-page-title">Document Intelligence</h1>
            <p className="shell-page-sub">
              Select a parser below, then upload a document to extract structured entities automatically using Azure AI.
            </p>
          </div>
        </div>
      </div>

      {/* Section — Parser cards (from API) */}
      <section className="di-section" id="di-parsers-section">
        <SectionHeader
          title="Available Parsers"
          subtitle="Click a parser to open its upload panel. Specialized extraction pipelines for each document category."
        />
        <div className="di-parsers-grid">
          {parsersLoading && [0, 1].map((i) => <SkeletonCard key={i} />)}
          {parsersError && (
            <div style={{ color: "var(--red)", fontSize: 13 }}>
              Could not load parsers: {parsersError}
            </div>
          )}
          {!parsersLoading && !parsersError && parsers.map((p) => (
            <ParserCard
              key={p.type}
              parser={p}
              isSelected={selectedParserType === p.type}
              onSelect={handleSelectParser}
            />
          ))}
        </div>

        {/* Inline upload panel — appears below the grid when a parser is selected */}
        {selectedParser && (
          <div ref={panelRef} className="di-upload-panel-wrap">
            <ParserUploadPanel
              key={selectedParser.type}
              parser={selectedParser}
              onClose={() => setSelectedParserType(null)}
            />
          </div>
        )}

        {/* Hint when nothing is selected */}
        {!parsersLoading && !parsersError && !selectedParser && parsers.length > 0 && (
          <div className="di-select-hint">
            <IconArrowRight size={14} />
            Select a parser above to upload and process a document
          </div>
        )}
      </section>
    </div>
  );
}
