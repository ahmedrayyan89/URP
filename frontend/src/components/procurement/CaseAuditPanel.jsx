import { useMemo } from "react";

export default function CaseAuditPanel({ caseData }) {
  const extraction = useMemo(() => {
    const items = caseData.extractions || [];
    return (
      items.find((e) => e.field === "escalation_cap_pct") ||
      items.find((e) => e.field === "contract_unit_price") ||
      items[0]
    );
  }, [caseData]);

  const contractSnippet = extraction?.snippet || "No contract excerpt available.";
  const highlightStart = extraction?.start_char ?? 0;
  const highlightEnd = extraction?.end_char ?? highlightStart + contractSnippet.length;

  const before = contractSnippet.slice(0, Math.max(0, highlightStart - (extraction?.start_char ? 0 : 0)));
  const highlight = contractSnippet.slice(
    Math.max(0, highlightStart - (extraction?.snippet ? extraction.start_char : 0)),
    Math.min(contractSnippet.length, highlightEnd - (extraction?.snippet ? extraction.start_char : 0) + 40)
  );
  const after = contractSnippet.slice(highlight.length);

  return (
    <div className="kb-doc-split">
      <div className="kb-doc-split-panes">
        <div className="kb-doc-pane kb-doc-pane-left">
          <h4 className="kb-doc-pane-label">
            Contract source
            {extraction?.page && ` — Page ${extraction.page}`}
            {extraction?.section && ` · ${extraction.section}`}
          </h4>
          <pre className="kb-doc-content-pre audit-contract-pre">
            {before}
            <mark className="audit-highlight">{highlight || contractSnippet}</mark>
            {after}
          </pre>
        </div>
        <div className="kb-doc-pane kb-doc-pane-right">
          <h4 className="kb-doc-pane-label">LexAI reasoning</h4>
          <div className="audit-reasoning-box">
            <p>{caseData.narrative}</p>
            {extraction && (
              <p className="text-sm text-muted mt-2">
                Citation: {extraction.section} — confidence {(extraction.confidence * 100).toFixed(0)}%
              </p>
            )}
          </div>
          <h4 className="kb-doc-pane-label mt-2">Extracted fields</h4>
          <div className="chunk-list">
            {(caseData.extractions || []).map((ext) => (
              <div key={ext.id} className="chunk-item kb-chunk-card">
                <strong>{ext.field}</strong>: {ext.value}
                {ext.page != null && <span className="chunk-meta"> · p.{ext.page}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
