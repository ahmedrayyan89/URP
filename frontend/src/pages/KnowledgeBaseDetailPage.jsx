import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import UnstructuredPanel from "../components/knowledge/UnstructuredPanel";
import StructuredPanel from "../components/knowledge/StructuredPanel";
import { useProject } from "../layouts/ProjectShell";
import { IconSettings } from "../components/layout/Icons";

function ConfigChip({ label }) {
  return <span className="kb-config-chip">{label}</span>;
}

export default function KnowledgeBaseDetailPage() {
  const { projectId, kbId } = useParams();
  const navigate = useNavigate();
  const { refreshStats } = useProject();
  const [kb, setKb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    api
      .getKnowledgeBase(kbId)
      .then(setKb)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [kbId]);

  if (loading) {
    return (
      <div className="shell-page">
        <div className="empty">
          <span className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      </div>
    );
  }

  if (error || !kb) {
    return (
      <div className="shell-page">
        <div className="alert alert-error">{error || "Knowledge base not found"}</div>
        <button
          type="button"
          className="btn btn-ghost btn-sm mt-2"
          onClick={() => navigate(`/projects/${projectId}/knowledge`)}
        >
          ← Back to catalog
        </button>
      </div>
    );
  }

  const typeLabel =
    kb.type === "structured" ? "Structured" : "Unstructured";

  return (
    <div className="shell-page shell-page--flush kb-detail-page">
      <div className="kb-detail-header">
        <div className="kb-detail-header-left">
          <button
            type="button"
            className="btn btn-ghost btn-sm kb-detail-back"
            onClick={() => navigate(`/projects/${projectId}/knowledge`)}
          >
            ← Knowledge Bases
          </button>
          <h1 className="kb-detail-title">{kb.name}</h1>
          <div className="kb-detail-chips">
            <ConfigChip label={typeLabel} />
            <ConfigChip label={kb.vector_db} />
            <ConfigChip label={kb.embedding_model} />
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setShowSettings(!showSettings)}
          title="View configuration"
        >
          <IconSettings size={18} />
        </button>
      </div>

      {showSettings && (
        <div className="card kb-settings-card mb-2">
          <h3 className="kb-settings-title">Configuration</h3>
          <dl className="kb-settings-list">
            <dt>Description</dt>
            <dd>{kb.description || "—"}</dd>
            <dt>Indexing Strategy</dt>
            <dd>{kb.indexing_strategy}</dd>
            <dt>Knowledge Graph</dt>
            <dd>{kb.knowledge_graph ? "Enabled" : "Disabled"}</dd>
            <dt>Data Source</dt>
            <dd>
              {kb.data_source?.kind === "connectors"
                ? `Connectors (${(kb.data_source.connector_ids || []).length})`
                : kb.data_source?.kind === "file_upload"
                  ? `File: ${kb.data_source.file_name || "—"}`
                  : kb.data_source?.kind || "—"}
            </dd>
          </dl>
        </div>
      )}

      <div className="kb-detail-body">
        {kb.type === "structured" ? (
          <StructuredPanel />
        ) : (
          <UnstructuredPanel onRefresh={refreshStats} />
        )}
      </div>
    </div>
  );
}
