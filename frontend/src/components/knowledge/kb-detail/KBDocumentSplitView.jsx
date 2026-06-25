import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { IconTrash } from "../../layout/Icons";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function KBDocumentSplitView({
  kbId,
  docId,
  docMeta,
  onBack,
  onReindex,
  onRemove,
}) {
  const [content, setContent] = useState("");
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getKbDocumentContent(kbId, docId),
      api.getKbDocumentChunks(kbId, docId),
    ])
      .then(([contentRes, chunksRes]) => {
        setContent(contentRes.content || "");
        setChunks(chunksRes.chunks || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [kbId, docId]);

  const toggleChunk = (chunkId) => {
    setExpanded((prev) => ({ ...prev, [chunkId]: !prev[chunkId] }));
  };

  if (loading) {
    return (
      <div className="empty">
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  return (
    <div className="kb-doc-split">
      <div className="kb-doc-split-header">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back to documents
        </button>
        <div className="kb-doc-split-title-row">
          <h3 className="kb-doc-split-title">{docMeta?.title || "Document"}</h3>
          <span className={`badge badge-grey`}>{docMeta?.status}</span>
          {docMeta?.chunk_count != null && (
            <span className="text-sm text-muted">{docMeta.chunk_count} chunks</span>
          )}
        </div>
        <div className="kb-doc-split-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onReindex}>
            Re-index
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}>
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      <div className="kb-doc-split-panes">
        <div className="kb-doc-pane kb-doc-pane-left">
          <h4 className="kb-doc-pane-label">Document</h4>
          {content ? (
            <pre className="kb-doc-content-pre">{content}</pre>
          ) : (
            <div className="empty">
              <div className="empty-sub">
                No extracted text available.
                {docMeta?.mime_type === "application/pdf"
                  ? " Re-index after uploading to extract PDF text."
                  : ""}
              </div>
            </div>
          )}
        </div>

        <div className="kb-doc-pane kb-doc-pane-right">
          <h4 className="kb-doc-pane-label">Chunks ({chunks.length})</h4>
          {chunks.length === 0 ? (
            <div className="empty">
              <div className="empty-sub">No chunks indexed yet.</div>
            </div>
          ) : (
            <div className="chunk-list">
              {chunks.map((chunk) => {
                const meta = chunk.metadata || {};
                const idx = meta.chunk_index ?? 0;
                const summary =
                  chunk.summary ||
                  meta.summary ||
                  (chunk.content?.length > 160
                    ? `${chunk.content.slice(0, 157)}...`
                    : chunk.content);
                const isOpen = expanded[chunk.chunk_id];

                return (
                  <div key={chunk.chunk_id} className="chunk-item kb-chunk-card">
                    <div className="kb-chunk-card-header">
                      <span className="chunk-index">#{idx + 1}</span>
                      <span className="chunk-meta">
                        {meta.start_char != null && meta.end_char != null
                          ? `chars ${meta.start_char}–${meta.end_char}`
                          : ""}
                        {chunk.content ? ` · ${chunk.content.split(/\s+/).length} words` : ""}
                      </span>
                    </div>
                    <p className="kb-chunk-summary">{summary}</p>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm kb-chunk-toggle"
                      onClick={() => toggleChunk(chunk.chunk_id)}
                    >
                      {isOpen ? "Hide full content" : "Show full content"}
                    </button>
                    {isOpen && (
                      <pre className="chunk-content kb-chunk-full">{chunk.content}</pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {docMeta?.indexed_at && (
        <p className="text-sm text-muted mt-2">Indexed {formatDate(docMeta.indexed_at)}</p>
      )}
    </div>
  );
}
