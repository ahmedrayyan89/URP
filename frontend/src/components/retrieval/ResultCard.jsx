import { highlight } from "../../lib/utils.jsx";

export default function ResultCard({ hit, rank, query }) {
  const rerank =
    hit.rerank_score !== undefined
      ? hit.rerank_score.toFixed(3)
      : null;
  const rrf =
    hit.rrf_score !== undefined ? hit.rrf_score.toFixed(4) : null;
  const vec =
    hit.score !== undefined ? hit.score.toFixed(3) : null;

  return (
    <div className="result-card">
      <div className="result-top">
        <div className="result-rank">{rank}</div>
        <div className="result-source">
          {hit.metadata?.doc_title || "Unknown Document"}
        </div>
        <div className="result-scores">
          {rerank && (
            <span className="score-tag primary">
              rerank {rerank}
            </span>
          )}
          {rrf && <span className="score-tag">rrf {rrf}</span>}
          {vec && <span className="score-tag">vec {vec}</span>}
        </div>
      </div>

      <div className="result-body">
        {highlight(hit.content, query)}
      </div>

      <div className="result-footer">
        <span>{hit.metadata?.source || ""}</span>
        {hit.metadata?.chunk_index !== undefined && (
          <>
            <span>·</span>
            <span>chunk #{hit.metadata.chunk_index}</span>
          </>
        )}
        {hit.metadata?.doc_type && (
          <>
            <span>·</span>
            <span className="badge badge-amber" style={{ fontSize: 10 }}>
              {hit.metadata.doc_type}
            </span>
          </>
        )}
      </div>
    </div>
  );
}