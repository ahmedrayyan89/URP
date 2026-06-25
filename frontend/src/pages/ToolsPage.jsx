import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import ToolCard from "../components/tools/ToolCard";
import AddToolModal from "../components/tools/AddToolModal";
import { IconPlus } from "../components/layout/Icons";

export default function ToolsPage() {
  const { projectId } = useParams();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .listTools(projectId)
      .then((d) => setTools(d.tools || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this tool?")) return;
    try {
      await api.deleteTool(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="shell-page">
      <div className="kb-catalog-header-ref">
        <div className="kb-catalog-header-left">
          <h1 className="shell-page-title">Tools</h1>
          <p className="shell-page-sub">
            Register tools available to agents and workflows — such as knowledge base retrieval endpoints.
          </p>
        </div>
        <div className="header-actions-group">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <IconPlus size={16} />
            Add tool
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {loading ? (
        <div className="empty"><span className="spinner" style={{ width: 24, height: 24 }} /></div>
      ) : tools.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No tools registered</div>
          <div className="empty-sub">
            Add a knowledge base retrieval tool to expose <code>POST /api/knowledge-bases/&#123;id&#125;/query</code> to agents.
          </div>
        </div>
      ) : (
        <div className="tool-card-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onDelete={() => handleDelete(tool.id)} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddToolModal
          projectId={projectId}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </div>
  );
}
