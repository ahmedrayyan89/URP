import { useState } from "react";
import { api } from "../../lib/api";
import PipelineStats from "./PipelineStats";
import ResultCard from "./ResultCard";
import PageHeader from "../layout/PageHeader";
import {
  IconSearch,
  IconSettings,
  IconLayers,
} from "../layout/Icons";

const EXAMPLES = [
  "How many PTO days do I get?",
  "What is the 401k employer match?",
  "Can I work from a coffee shop?",
  "What happens to unused PTO when I resign?",
  "How do I report workplace harassment?",
  "What equipment does the company provide for remote work?",
];

const HERO_CARDS = [
  {
    title: "Knowledge Base",
    desc: "Ingest and manage policy documents into the vector index",
    action: "knowledge",
  },
  {
    title: "Hybrid Retrieval",
    desc: "BM25 + vector search with cross-encoder reranking",
    action: "search",
  },
  {
    title: "Real-time Pipeline",
    desc: "Watch document ingestion and indexing execute live",
    action: "knowledge",
  },
];

export default function SearchPanel({ systemReady, onNavigate }) {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [useReranker, setUseReranker] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const search = async (q) => {
    const finalQuery = q || query;
    if (!finalQuery.trim() || !systemReady) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await api.search({
        query: finalQuery.trim(),
        top_k: topK,
        use_reranker: useReranker,
      });
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (ex) => {
    setQuery(ex);
    search(ex);
  };

  const showHero = !results;

  return (
    <div className="page">
      {showHero && (
        <div className="hero">
          <h1 className="hero-title">
            Your comprehensive platform for enterprise risk intelligence
          </h1>
          <p className="hero-sub">
            Search across indexed policy documents with hybrid retrieval,
            reranking, and real-time knowledge base management.
          </p>

          <div className="hero-cards">
            {HERO_CARDS.map((card) => (
              <button
                key={card.title}
                type="button"
                className="hero-card"
                onClick={() => onNavigate?.(card.action)}
              >
                <div className="hero-card-title">{card.title}</div>
                <div className="hero-card-desc">{card.desc}</div>
              </button>
            ))}
          </div>

          <form
            className="hero-search"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <span className="hero-search-icon">
              <IconSearch size={18} />
            </span>
            <input
              className="hero-search-input"
              placeholder={
                systemReady
                  ? "Search policies, risk assessments, compliance docs..."
                  : "Loading models, please wait..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!systemReady || loading}
            />
            <span className="hero-search-kbd">
              {loading ? <span className="spinner" /> : "Enter"}
            </span>
          </form>
        </div>
      )}

      {!showHero && (
        <PageHeader
          title="Retrieval Search"
          subtitle="Hybrid BM25 + vector retrieval with cross-encoder reranking across all indexed knowledge base documents."
        />
      )}

      <div
        className="search-layout"
        style={showHero ? { gridTemplateColumns: "1fr" } : undefined}
      >
        <div>
          {!showHero && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
            >
              <div className="search-wrap">
                <input
                  className="search-input"
                  placeholder={
                    systemReady
                      ? "Ask a question about company policy or risk..."
                      : "Loading models, please wait..."
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={!systemReady}
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading || !query.trim() || !systemReady}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Searching
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </form>
          )}

          {!results && !loading && showHero && (
            <div>
              <div className="text-xs text-muted fw-600 mb-1">
                SUGGESTED QUERIES
              </div>
              <div className="examples-wrap">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    className="example-btn"
                    onClick={() => handleExample(ex)}
                    disabled={!systemReady}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          {results && (
            <PipelineStats
              pipeline={results.pipeline}
              rerank_applied={results.rerank_applied}
            />
          )}

          {results && results.results.length === 0 && (
            <div className="empty">
              <div className="empty-icon-wrap">
                <IconSearch size={24} />
              </div>
              <div className="empty-title">No results found</div>
              <div className="empty-sub">
                Try rephrasing your query or ingest more documents in the
                Knowledge Base
              </div>
            </div>
          )}

          {results && results.results.length > 0 && (
            <div className="results-list">
              {results.results.map((hit, i) => (
                <ResultCard
                  key={hit.chunk_id}
                  hit={hit}
                  rank={i + 1}
                  query={results.query}
                />
              ))}
            </div>
          )}
        </div>

        {!showHero && <div className="settings-panel">
          <div className="settings-card">
            <div className="settings-title">
              <span className="settings-title-icon">
                <IconSettings size={15} />
              </span>
              Retrieval Settings
            </div>

            <div className="form-row">
              <label className="form-label">
                Top K Results — {topK}
              </label>
              <div className="range-wrap">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                />
                <div className="range-labels">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: 0 }}>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={useReranker}
                  onChange={(e) => setUseReranker(e.target.checked)}
                />
                <div className="toggle-text">
                  <span className="toggle-label">
                    Cross-encoder reranking
                  </span>
                  <span className="toggle-sub">
                    More accurate · slightly slower
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-title">
              <span className="settings-title-icon">
                <IconLayers size={15} />
              </span>
              Retrieval Pipeline
            </div>
            <div className="pipeline-steps">
              {[
                ["1", "Embed Query", "BAAI/bge-small-en-v1.5"],
                ["2", "Vector ANN Search", "ChromaDB / HNSW"],
                ["3", "BM25 Keyword Search", "rank-bm25 / Okapi"],
                ["4", "Reciprocal Rank Fusion", "α = 0.6"],
                ["5", "Cross-encoder Rerank", "ms-marco-MiniLM-L6"],
              ].map(([n, name, model]) => (
                <div key={n} className="pipeline-step">
                  <div className="step-num">{n}</div>
                  <div className="step-info">
                    <div className="step-name">{name}</div>
                    <div className="step-model">{model}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}
