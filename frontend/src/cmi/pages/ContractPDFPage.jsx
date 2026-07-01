import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchContractById, fetchContractPdfObjectUrl, getContractDocumentUrl } from "../api/cmiApi";




// ── Icons ──────────────────────────────────────────────────────────────────
const IconExternalLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconFileText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#2563eb", marginRight: 6 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ContractPDFPage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [pdfSrc, setPdfSrc] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let blobRevoke = null;

    (async () => {
      setLoadError(null);
      setLoading(true);
      try {
        const c = await fetchContractById(id);
        if (cancelled) return;
        if (!c) {
          setLoadError("Contract not found");
          return;
        }
        setContract(c);

        // Fetch PDF blob matching CMI logic
        const blobUrl = await fetchContractPdfObjectUrl(id);
        if (cancelled) return;
        if (blobUrl) {
          blobRevoke = blobUrl;
          setPdfSrc(blobUrl);
        } else {
          try {
            const sas = await getContractDocumentUrl(id);
            if (sas && sas.document_url) {
              setPdfSrc(sas.document_url);
            }
          } catch {
            // No PDF available — leave pdfSrc null, show empty state
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.message || "Failed to load contract");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { 
      cancelled = true; 
      if (blobRevoke) URL.revokeObjectURL(blobRevoke);
    };
  }, [id]);

  if (loading || (!contract && !loadError)) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
        <span className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (!contract) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "var(--text-3)", fontSize: 15 }}>
        {loadError || "Contract not found"}
      </div>
    );
  }

  const isArchived = contract.is_archived === true;

  return (
    <div className="shell-page" style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* ── Breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20 }}>
        <span
          onClick={() => navigate(`/projects/${projectId}/entities/contracts`)}
          style={{ color: "#2563eb", cursor: "pointer", fontWeight: 500 }}
        >
          Contracts
        </span>
        <span style={{ color: "var(--border)" }}>›</span>
        <span
          onClick={() => navigate(`/projects/${projectId}/entities/contracts/${id}`)}
          style={{ color: "#2563eb", cursor: "pointer", fontWeight: 500, maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          title={contract.title}
        >
          {contract.title}
        </span>
        <span style={{ color: "var(--border)" }}>›</span>
        <span style={{ color: "var(--text-3)", fontWeight: 500 }}>PDF Viewer</span>
      </div>

      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 4px 0" }}>Contract PDF</h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, maxWidth: 560 }}>{contract.title}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => navigate(`/projects/${projectId}/entities/contracts/${id}`)}
            style={{ display: "inline-flex", alignItems: "center", background: "white", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", color: "var(--text-2)" }}
          >
            <IconArrowLeft /> Back to contract
          </button>
          {pdfSrc && (
            <a href={pdfSrc} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", background: "white", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", color: "var(--text-2)" }}>
                <IconExternalLink /> Open in new tab
              </button>
            </a>
          )}
          {pdfSrc && (
            <a href={pdfSrc} download={`${contract.title}.pdf`} style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", background: "white", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", color: "var(--text-2)" }}>
                <IconDownload /> Download
              </button>
            </a>
          )}
        </div>
      </div>

      {/* ── Archived Warning ── */}
      {isArchived && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, border: "1px solid #fde68a", background: "#fef3c7", color: "#92400e", fontSize: 13 }}>
          This contract is <strong>archived</strong>. PDF is view-only.
        </div>
      )}

      {/* ── Load Error Notice ── */}
      {loadError && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "var(--text-3)", fontSize: 13 }}>
          {loadError}
        </div>
      )}

      {/* ── PDF Viewer Card ── */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "white" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <IconFileText />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Document preview</span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>
            {contract.vendor_name} · {formatDate(contract.start_date)} – {formatDate(contract.end_date)}
          </span>
        </div>

        {/* PDF iframe or empty state */}
        <div style={{ background: "#525659", minHeight: "75vh" }}>
          {pdfSrc ? (
            <iframe
              title="Contract PDF"
              src={pdfSrc}
              style={{ width: "100%", minHeight: "75vh", border: "none", display: "block" }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, color: "#cbd5e1", fontSize: 14 }}>
              No PDF URL available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
