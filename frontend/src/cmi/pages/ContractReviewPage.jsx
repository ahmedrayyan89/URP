import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchContractById, fetchContractTerms, updateContractTerm, fetchContractPdfObjectUrl, getContractDocumentUrl } from "../api/cmiApi";

const FALLBACK_PDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

// ── Icons ──────────────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconFileText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IconMsg = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconChevronUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────
const TERM_PREVIEW_CHARS = 260;

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_STYLES = {
  "Needs Review": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Verified:       { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  Disputed:       { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || { color: "#4b5563", bg: "#f3f4f6", border: "#e5e7eb" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 500, color: s.color, background: s.bg, border: `1px solid ${s.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
      {status}
    </span>
  );
};

// ── Component ──────────────────────────────────────────────────────────────
export default function ContractReviewPage() {
  const { projectId, id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [terms, setTerms] = useState([]);
  const [pdfSrc, setPdfSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [expandedContextId, setExpandedContextId] = useState(null);
  const [expandedValueId, setExpandedValueId] = useState(null);

  useEffect(() => {
    if (!id) return;
    let blobRevoke = null;

    (async () => {
      setLoading(true);
      try {
        const [c, t] = await Promise.all([
          fetchContractById(id),
          fetchContractTerms(id).catch(() => []),
        ]);
        setContract(c);
        setTerms(t);
        
        // Match exact CMI logic: fetch blob directly
        const blobUrl = await fetchContractPdfObjectUrl(id);
        if (blobUrl) {
          blobRevoke = blobUrl;
          setPdfSrc(blobUrl);
        } else {
          try {
            const sas = await getContractDocumentUrl(id);
            if (sas && sas.document_url) {
              setPdfSrc(sas.document_url);
            } else {
              setPdfSrc(FALLBACK_PDF);
            }
          } catch {
            setPdfSrc(FALLBACK_PDF);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    
    return () => {
      if (blobRevoke) URL.revokeObjectURL(blobRevoke);
    };
  }, [id]);

  const refreshTerms = async () => {
    const t = await fetchContractTerms(id).catch(() => []);
    setTerms(t);
  };

  const handleVerify = async (termId) => {
    if (saving || readOnly) return;
    setSaving(true);
    try {
      await updateContractTerm(id, termId, "Verified");
      await refreshTerms();
    } catch (e) {
      alert("Update failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDispute = async (termId) => {
    if (saving || readOnly) return;
    setSaving(true);
    try {
      await updateContractTerm(id, termId, "Disputed");
      await refreshTerms();
    } catch (e) {
      alert("Update failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAll = async () => {
    if (saving || readOnly || !id) return;
    setSaving(true);
    try {
      for (const t of terms) {
        if (t.status !== "Verified") {
          await updateContractTerm(id, t.id, "Verified");
        }
      }
      await refreshTerms();
      const c = await fetchContractById(id);
      if (c) setContract(c);
    } catch (e) {
      alert("Approve failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisputeAll = async () => {
    if (saving || readOnly || !id) return;
    setSaving(true);
    try {
      for (const t of terms) {
        await updateContractTerm(id, t.id, "Disputed");
      }
      await refreshTerms();
    } catch (e) {
      alert("Dispute failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !contract) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
        <span className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  const isArchived     = contract.is_archived === true;
  const contractActive = contract.status === "Active";
  const contractOnHold = contract.status === "On Hold";
  const readOnly       = isArchived || contractActive;

  const disputeAllDisabled = readOnly || saving || terms.length === 0;
  const approveAllDisabled = readOnly || saving || contractOnHold;

  return (
    <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20 }}>
        <span onClick={() => navigate(`/projects/${projectId}/entities/contracts`)} style={{ color: "#2563eb", cursor: "pointer", fontWeight: 500 }}>Contracts</span>
        <span style={{ color: "#cbd5e1" }}>›</span>
        <span onClick={() => navigate(`/projects/${projectId}/entities/contracts/${id}`)} style={{ color: "#2563eb", cursor: "pointer", fontWeight: 500, maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={contract.title}>{contract.title}</span>
        <span style={{ color: "#cbd5e1" }}>›</span>
        <span style={{ color: "#64748b", fontWeight: 500 }}>Review &amp; confirm</span>
      </div>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px 0" }}>Review &amp; confirm</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0, maxWidth: 560 }}>{contract.title}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(`/projects/${projectId}/entities/contracts/${id}`)}
            style={{ padding: "8px 16px", background: "white", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151" }}
          >
            Back
          </button>
          <button
            onClick={handleDisputeAll}
            disabled={disputeAllDisabled}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: disputeAllDisabled ? "#fef2f2" : "#ef4444", color: disputeAllDisabled ? "#fca5a5" : "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: disputeAllDisabled ? "not-allowed" : "pointer", transition: "background 0.15s" }}
          >
            <IconX /> Dispute all
          </button>
          <button
            onClick={handleApproveAll}
            disabled={approveAllDisabled}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: approveAllDisabled ? "#f0fdf4" : "#16a34a", color: approveAllDisabled ? "#86efac" : "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: approveAllDisabled ? "not-allowed" : "pointer", transition: "background 0.15s" }}
          >
            <IconCheck /> Approve all
          </button>
        </div>
      </div>

      {/* ── On Hold banner ── */}
      {contractOnHold && !isArchived && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, border: "1px solid #fde68a", background: "#fef3c7", color: "#92400e", fontSize: 13 }}>
          <strong>On hold</strong> — required Materials &amp; ingredients fields could not be extracted reliably. You can still review terms; <strong>approving the contract is disabled</strong> until extraction is fixed or the contract status is updated.
        </div>
      )}
      {isArchived && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, border: "1px solid #fde68a", background: "#fef3c7", color: "#92400e", fontSize: 13 }}>
          <strong>Archived contract</strong> — review actions are disabled. You can still view terms and extracted ingredients.
        </div>
      )}
      {contractActive && !isArchived && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#14532d", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <IconCheck />
          <span>Contract activated on {formatDate(contract.last_modified)} — terms are locked.</span>
        </div>
      )}

      {/* ── Split panel ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, minHeight: "calc(100vh - 280px)" }}>

        {/* Left: Extracted terms list */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Card header */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>Extracted terms</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{terms.length} terms</span>
          </div>

          {/* Scrollable terms list */}
          <div style={{ flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 380px)" }}>
            {terms.length === 0 ? (
              <div style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No terms yet.</div>
            ) : terms.map((term) => {
              const long = term.extracted_value?.length > TERM_PREVIEW_CHARS;
              const showFull = expandedValueId === term.id;
              const valueDisplay = (!long || showFull) ? term.extracted_value : `${term.extracted_value.slice(0, TERM_PREVIEW_CHARS).trimEnd()}…`;
              const ctxOpen = expandedContextId === term.id;

              return (
                <div
                  key={term.id}
                  style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", transition: "background 0.12s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {/* Term header: title + status badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.4 }}>{term.clause}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        {term.page_ref?.trim()
                          ? <span>Source: <strong style={{ color: "#374151" }}>{term.page_ref}</strong></span>
                          : "Not cited — locate in PDF"}
                      </div>
                    </div>
                    <StatusBadge status={term.status} />
                  </div>

                  {/* Category + value */}
                  <div style={{ marginTop: 8 }}>
                    <span style={{ display: "inline-block", padding: "1px 8px", background: "#f1f5f9", borderRadius: 4, fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                      {term.category}
                    </span>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {valueDisplay}
                    </p>
                    {long && (
                      <button
                        onClick={() => setExpandedValueId(showFull ? null : term.id)}
                        style={{ fontSize: 12, color: "#2563eb", fontWeight: 500, marginTop: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        {showFull ? "Show less" : "Show full wording"}
                      </button>
                    )}
                  </div>

                  {/* Reviewer context toggle */}
                  <button
                    onClick={() => setExpandedContextId(ctxOpen ? null : term.id)}
                    style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, fontSize: 12, fontWeight: 500, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <IconMsg />
                    Reviewer context
                    {ctxOpen ? <IconChevronUp /> : <IconChevronDown />}
                  </button>
                  {ctxOpen && (
                    <div style={{ marginTop: 8, padding: "10px 12px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                      <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                        This row is filed under <strong style={{ color: "#374151" }}>{term.category}</strong>.
                        Use the <strong style={{ color: "#374151" }}>Source</strong> line to find the passage in the PDF,
                        then confirm the summary matches the contract before verifying.
                      </p>
                    </div>
                  )}

                  {/* Verify / Dispute buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => handleVerify(term.id)}
                      disabled={term.status === "Verified" || readOnly || saving}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px",
                        borderRadius: 6, fontSize: 12, fontWeight: 500, border: "1px solid",
                        cursor: (term.status === "Verified" || readOnly || saving) ? "not-allowed" : "pointer",
                        color: (term.status === "Verified" || readOnly) ? "#86efac" : "#15803d",
                        background: (term.status === "Verified" || readOnly) ? "#f0fdf4" : "#f0fdf4",
                        borderColor: (term.status === "Verified" || readOnly) ? "#bbf7d0" : "#86efac",
                        opacity: (term.status === "Verified" || readOnly || saving) ? 0.6 : 1,
                      }}
                    >
                      <IconCheck /> Verify
                    </button>
                    <button
                      onClick={() => handleDispute(term.id)}
                      disabled={readOnly || saving}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px",
                        borderRadius: 6, fontSize: 12, fontWeight: 500, border: "1px solid",
                        cursor: (readOnly || saving) ? "not-allowed" : "pointer",
                        color: readOnly ? "#fca5a5" : "#dc2626",
                        background: "#fef2f2",
                        borderColor: readOnly ? "#fecaca" : "#fca5a5",
                        opacity: (readOnly || saving) ? 0.6 : 1,
                      }}
                    >
                      <IconX /> Dispute
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Contract PDF */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* PDF card header */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <IconFileText />
              <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>Contract PDF</span>
            </div>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
              {contract.vendor_name} · {formatDate(contract.start_date)}
            </span>
          </div>

          {/* PDF viewer */}
          <div style={{ flex: 1, background: "#525659", minHeight: 420 }}>
            {pdfSrc ? (
              <iframe
                title="Contract PDF"
                src={pdfSrc}
                style={{ width: "100%", height: "100%", minHeight: "calc(100vh - 380px)", border: "none", display: "block" }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 420, gap: 12 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No PDF uploaded for this contract.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
