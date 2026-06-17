import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import EntityInstanceForm from "../components/entities/EntityInstanceForm";

export default function EntityInstanceDetailPage() {
  const { projectId, instanceId } = useParams();
  const navigate = useNavigate();
  const [instance, setInstance] = useState(null);
  const [tab, setTab] = useState("form");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getEntityInstance(instanceId)
      .then(setInstance)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [instanceId]);

  if (loading) {
    return (
      <div className="shell-page empty">
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="shell-page">
        <div className="alert alert-error">{error || "Not found"}</div>
      </div>
    );
  }

  const def = instance.definition;

  return (
    <div className="shell-page">
      <button
        type="button"
        className="btn btn-ghost btn-sm mb-2"
        onClick={() =>
          navigate(`/projects/${projectId}/entities/definitions/${def?.id}`)
        }
      >
        ← {def?.name || "Entity"}
      </button>
      <h1 className="shell-page-title">Instance</h1>
      <p className="shell-page-sub">
        <span className="badge badge-grey">{instance.status}</span>
        {" · "}
        Created {new Date(instance.created_at).toLocaleString()}
      </p>

      <div className="kb-detail-tabs mb-2">
        <button type="button" className={`kb-detail-tab ${tab === "form" ? "active" : ""}`} onClick={() => setTab("form")}>
          Form view
        </button>
        <button type="button" className={`kb-detail-tab ${tab === "json" ? "active" : ""}`} onClick={() => setTab("json")}>
          Raw JSON
        </button>
      </div>

      {instance.source_document_id && (
        <p className="text-sm text-muted mb-2">
          Source document: {instance.source_document_id}
        </p>
      )}

      {tab === "form" ? (
        <div className="card" style={{ padding: 20 }}>
          <EntityInstanceForm
            schema={def?.schema}
            data={instance.data}
            onChange={() => {}}
          />
        </div>
      ) : (
        <pre className="kb-api-pre">{JSON.stringify(instance.data, null, 2)}</pre>
      )}

      <div className="card mt-2" style={{ padding: 16 }}>
        <h4 className="kb-settings-title">Audit</h4>
        <dl className="kb-settings-list">
          <dt>Created</dt><dd>{instance.created_at}</dd>
          <dt>Updated</dt><dd>{instance.updated_at}</dd>
          <dt>Confidence</dt><dd>{instance.extraction_confidence ?? "—"}</dd>
        </dl>
      </div>
    </div>
  );
}
