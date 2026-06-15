export default function ChunkViewer({ doc, chunks }) {
  return (
    <div className="card">
      <div className="card-title">
        🔬 Chunks — {doc.title}
        <span className="tag tag-blue" style={{ marginLeft: "auto" }}>
          {chunks.length} chunks
        </span>
      </div>

      <div className="pipeline-info" style={{ marginBottom: 16 }}>
        <div className="pipeline-stat">
          <span className="pipeline-stat-label">Total Chunks</span>
          <span className="pipeline-stat-val accent">{chunks.length}</span>
        </div>
        <div className="pipeline-stat">
          <span className="pipeline-stat-label">Avg Words</span>
          <span className="pipeline-stat-val">
            {Math.round(
              chunks.reduce((sum, chunk) => sum + chunk.content.split(" ").length, 0) /
                chunks.length
            )}
          </span>
        </div>
        <div className="pipeline-stat">
          <span className="pipeline-stat-label">Source</span>
          <span className="pipeline-stat-val" style={{ fontSize: 13, fontFamily: "var(--mono)" }}>
            {doc.source}
          </span>
        </div>
      </div>

      <div className="chunk-list">
        {chunks.map((chunk, index) => (
          <div key={chunk.chunk_id} className="chunk-item">
            <div className="chunk-item-header">
              <span className="chunk-index">#{chunk.metadata.chunk_index ?? index}</span>
              <span>{chunk.content.split(" ").length} words</span>
              <span style={{ marginLeft: "auto" }}>
                char {chunk.metadata.start_char}–{chunk.metadata.end_char}
              </span>
            </div>
            <div className="chunk-content">{chunk.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}