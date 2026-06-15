export default function PipelineStats({ pipeline, rerank_applied }) {
  return (
    <div className="pipeline-bar">
      <div className="pipeline-bar-item">
        <div className="pipeline-bar-label">Vector candidates</div>
        <div className="pipeline-bar-val accent">
          {pipeline.vector_candidates}
        </div>
      </div>
      <div className="pipeline-bar-item">
        <div className="pipeline-bar-label">After fusion</div>
        <div className="pipeline-bar-val">{pipeline.after_fusion}</div>
      </div>
      <div className="pipeline-bar-item">
        <div className="pipeline-bar-label">Final results</div>
        <div className="pipeline-bar-val green">{pipeline.final}</div>
      </div>
      <div className="pipeline-bar-item">
        <div className="pipeline-bar-label">Reranking</div>
        <div
          className={`pipeline-bar-val ${rerank_applied ? "applied green" : ""}`}
        >
          {rerank_applied ? "✓ Applied" : "Skipped"}
        </div>
      </div>
    </div>
  );
}
