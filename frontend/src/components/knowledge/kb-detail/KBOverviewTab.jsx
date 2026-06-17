export default function KBOverviewTab({ kb, status }) {
  const chunking = kb.chunking_config || {};
  const retrieval = kb.retrieval_config || {};

  return (
    <div className="kb-tab-panel">
      <div className="kb-overview-grid">
        <div className="card kb-stat-card">
          <div className="kb-stat-label">Documents</div>
          <div className="kb-stat-value">{status?.document_count ?? kb.document_count ?? 0}</div>
        </div>
        <div className="card kb-stat-card">
          <div className="kb-stat-label">Chunks</div>
          <div className="kb-stat-value">{status?.chunk_count ?? kb.chunk_count ?? 0}</div>
        </div>
        <div className="card kb-stat-card">
          <div className="kb-stat-label">Status</div>
          <div className="kb-stat-value kb-stat-status">{status?.status ?? kb.status ?? "ready"}</div>
        </div>
      </div>

      {(status?.status === "indexing" || status?.status === "initializing") && (
        <div className="kb-progress-wrap">
          <div className="kb-progress-bar">
            <div
              className="kb-progress-fill"
              style={{ width: `${status?.progress ?? kb.indexing_progress ?? 0}%` }}
            />
          </div>
          <span className="text-sm text-muted">{status?.progress ?? 0}% indexed</span>
        </div>
      )}

      {status?.error && (
        <div className="alert alert-error mt-2">{status.error}</div>
      )}

      <div className="card mt-2">
        <h3 className="kb-settings-title">Configuration</h3>
        <dl className="kb-settings-list">
          <dt>Description</dt>
          <dd>{kb.description || "—"}</dd>
          <dt>Type</dt>
          <dd>{kb.type}</dd>
          {kb.type === "unstructured" && (
            <>
              <dt>Chunk strategy</dt>
              <dd>{chunking.strategy || "—"}</dd>
              <dt>Chunk size / overlap</dt>
              <dd>{chunking.chunk_size ?? "—"} / {chunking.overlap ?? "—"}</dd>
              <dt>Retrieval</dt>
              <dd>
                {[
                  retrieval.use_vector && "Vector",
                  retrieval.use_bm25 && "BM25",
                  retrieval.use_knowledge_graph && "Graph",
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </>
          )}
          {kb.type === "structured" && (
            <>
              <dt>Linked tables</dt>
              <dd>{(kb.structured_table_ids || []).join(", ") || "—"}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
