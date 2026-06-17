import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import KBCard from "../components/knowledge/KBCard";
import CreateKBWizard from "../components/knowledge/CreateKBWizard";
import { IconPlus, IconSearch } from "../components/layout/Icons";

export default function KnowledgeBaseCatalogPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [kbs, setKbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadKbs = () => {
    setLoading(true);
    api
      .listKnowledgeBases(projectId)
      .then((data) => setKbs(data.knowledge_bases || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadKbs();
  }, [projectId]);

  const q = query.trim().toLowerCase();
  const filtered = kbs.filter(
    (kb) =>
      !q ||
      kb.name.toLowerCase().includes(q) ||
      kb.description?.toLowerCase().includes(q)
  );

  const handleCreated = (kb) => {
    setShowCreate(false);
    navigate(`/projects/${projectId}/knowledge/${kb.id}`);
  };

  return (
    <div className="shell-page kb-catalog-page">
      <div className="kb-catalog-header-ref">
        <div className="kb-catalog-header-left">
          <h1 className="shell-page-title">Knowledge Bases</h1>
          <p className="shell-page-sub">
            Manage and organize your knowledge base content for agent retrieval.
          </p>
        </div>
        <div className="kb-catalog-header-right">
          <div className="kb-catalog-search-ref">
            <IconSearch size={16} />
            <input
              type="text"
              className="connectors-search-input"
              placeholder="Search knowledge base..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreate(true)}
          >
            <IconPlus size={16} />
            New Knowledge Base
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {loading ? (
        <div className="empty">
          <span className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-title">
            {kbs.length === 0 ? "No knowledge bases yet" : "No matches found"}
          </div>
          <div className="empty-sub">
            {kbs.length === 0
              ? "Create your first knowledge base to get started."
              : "Try a different search term."}
          </div>
          {kbs.length === 0 && (
            <button
              type="button"
              className="btn btn-primary mt-2"
              onClick={() => setShowCreate(true)}
            >
              <IconPlus size={16} />
              Create Knowledge Base
            </button>
          )}
        </div>
      ) : (
        <div className="kb-card-grid">
          {filtered.map((kb) => (
            <KBCard
              key={kb.id}
              kb={kb}
              onClick={() =>
                navigate(`/projects/${projectId}/knowledge/${kb.id}`)
              }
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateKBWizard
          projectId={projectId}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
