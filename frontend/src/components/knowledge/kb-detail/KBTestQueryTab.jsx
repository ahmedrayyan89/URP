import { useState } from "react";
import { api } from "../../../lib/api";

const RETRIEVER_COLORS = {
  vector: "badge-blue",
  bm25: "badge-green",
  graph: "badge-grey",
  "vector+bm25": "badge-blue",
};

export default function KBTestQueryTab({ kbId }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.queryKnowledgeBase(kbId, { query: query.trim(), top_k: 5 });
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kb-tab-panel">
      <p className="text-sm text-muted mb-2">
        Test retrieval across this knowledge base. Each chunk shows which retriever found it.
      </p>

      <form onSubmit={handleSubmit} className="kb-test-query-form">
        <textarea
          className="input textarea"
          rows={3}
          placeholder="Ask a question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm mt-1" disabled={loading}>
          {loading ? "Searching..." : "Run query"}
        </button>
      </form>

      {error && <div className="alert alert-error mt-2">{error}</div>}

      {result && (
        <div className="kb-test-results mt-2">
          <div className="card kb-answer-card">
            <h4 className="kb-answer-title">Answer</h4>
            <p>{result.answer}</p>
          </div>

          {result.chunks?.length > 0 && (
            <div className="kb-chunks-list">
              <h4 className="kb-chunks-title">Retrieved chunks</h4>
              {result.chunks.map((chunk, i) => (
                <div key={chunk.chunk_id || i} className="card kb-chunk-card">
                  <div className="kb-chunk-header">
                    <span className={`badge ${RETRIEVER_COLORS[chunk.retriever] || "badge-grey"}`}>
                      {chunk.retriever}
                    </span>
                    <span className="text-sm text-muted">score: {chunk.score?.toFixed?.(3) ?? chunk.score}</span>
                  </div>
                  <p className="kb-chunk-content">{chunk.content}</p>
                </div>
              ))}
            </div>
          )}

          {result.rows?.length > 0 && (
            <div className="card mt-2">
              <h4>Sample rows (structured stub)</h4>
              <pre className="kb-json-preview">{JSON.stringify(result.rows, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
