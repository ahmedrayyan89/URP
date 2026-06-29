import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import AgentCard from "../components/agents/AgentCard";
import ImportAgentDropdown from "../components/agents/ImportAgentDropdown";
import ImportAgentModal from "../components/agents/ImportAgentModal";
import { IconBot, IconPlus, IconSearch } from "../components/layout/Icons";

export default function AgentsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [importPlatform, setImportPlatform] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .listAgents(projectId)
      .then((d) => setAgents(d.agents || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const q = query.trim().toLowerCase();
  const filtered = agents.filter((a) => {
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchQ && matchStatus;
  });

  const handleDuplicate = async (id) => {
    try {
      await api.duplicateAgent(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this agent?")) return;
    try {
      await api.deleteAgent(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="shell-page">
      <div className="kb-catalog-header-ref">
        <div className="kb-catalog-header-left">
          <h1 className="shell-page-title">AI Agents</h1>
          <p className="shell-page-sub">Manage and access your AI-powered agents.</p>
        </div>
        <div className="kb-catalog-header-right">
          <div className="kb-catalog-search-ref">
            <IconSearch size={16} />
            <input
              className="connectors-search-input"
              placeholder="Search agents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="input agent-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Status filter</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="building">Building</option>
            <option value="error">Error</option>
          </select>
          <div className="header-actions-group">
            <ImportAgentDropdown onSelect={(platform) => setImportPlatform(platform)} />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/projects/${projectId}/agents/new`)}
            >
              <IconPlus size={16} />
              Create from scratch
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {loading ? (
        <div className="empty"><span className="spinner" style={{ width: 24, height: 24 }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No agents yet</div>
          <div className="empty-sub">Import an existing agent or create one from scratch.</div>
        </div>
      ) : (
        <div className="agent-card-grid">
          {/* Contract Agent integrated from CMI */}
          <div
            className="agent-card"
            onClick={() => navigate(`/projects/${projectId}/entities/contracts`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/projects/${projectId}/entities/contracts`)}
            style={{ border: "1px solid var(--primary-2)", background: "var(--hero-bg)" }}
          >
            <div className="agent-card-header">
              <div
                className="agent-pill-icon"
                style={{ background: "var(--primary-light)", color: "var(--primary-2)" }}
              >
                <IconBot size={18} />
              </div>
              <span className="agent-card-name">Contract Agent</span>
              <span className="agent-status-badge agent-status-active">
                ACTIVE
              </span>
            </div>
            <p className="agent-card-desc">
              AI agent for supplier contract document ingestion, OCR text processing, clause mapping, and structured database extraction.
            </p>
            <div className="agent-card-footer">
              <IconBot size={12} />
              <span>LANGGRAPH · INTEGRATED</span>
            </div>
          </div>

          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => navigate(`/projects/${projectId}/agents/${agent.id}`)}
              onEdit={() => navigate(`/projects/${projectId}/agents/${agent.id}?edit=1`)}
              onTest={() => navigate(`/projects/${projectId}/agents/${agent.id}?tab=test`)}
              onDuplicate={() => handleDuplicate(agent.id)}
              onDelete={() => handleDelete(agent.id)}
            />
          ))}
        </div>
      )}

      {importPlatform && (
        <ImportAgentModal
          projectId={projectId}
          platform={importPlatform}
          onClose={() => setImportPlatform(null)}
          onSuccess={(agent) => {
            setImportPlatform(null);
            navigate(`/projects/${projectId}/agents/${agent.id}`);
          }}
        />
      )}
    </div>
  );
}
