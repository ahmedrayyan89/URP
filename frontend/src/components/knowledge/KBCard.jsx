import { IconBook, IconFileText } from "../layout/Icons";

const STATUS_COLORS = {
  ready: "kb-status-ready",
  indexing: "kb-status-indexing",
  initializing: "kb-status-indexing",
  error: "kb-status-error",
};

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function KBCard({ kb, onClick }) {
  const typeLabel =
    kb.type === "structured" ? "Structured" : "Unstructured";
  const status = kb.status || "ready";
  const statusClass = STATUS_COLORS[status] || "kb-status-ready";

  return (
    <button type="button" className="kb-card" onClick={onClick}>
      <div className="kb-card-top">
        <div className="kb-card-icon">
          {kb.type === "structured" ? (
            <IconFileText size={18} />
          ) : (
            <IconBook size={18} />
          )}
        </div>
        <span
          className={`kb-card-type-badge ${
            kb.type === "structured" ? "kb-card-type-structured" : ""
          }`}
        >
          {typeLabel}
        </span>
      </div>

      <div className="kb-card-title-row">
        <span className={`kb-card-status-dot ${statusClass}`} />
        <span className="kb-card-name">{kb.name}</span>
      </div>

      <p className="kb-card-desc">
        {kb.description || "No description provided."}
      </p>

      <div className="kb-card-footer">
        <span>{kb.document_count ?? 0} docs</span>
        {kb.updated_at && <span>Updated {formatDate(kb.updated_at)}</span>}
      </div>
    </button>
  );
}
