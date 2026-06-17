import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import EntityInstanceForm from "../components/entities/EntityInstanceForm";

export default function EntityDefinitionDetailPage() {
  const { projectId, defId } = useParams();
  const navigate = useNavigate();
  const [definition, setDefinition] = useState(null);
  const [instances, setInstances] = useState([]);
  const [connectedAgents, setConnectedAgents] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [instanceData, setInstanceData] = useState({});

  const load = () => {
    api
      .getEntityDefinition(defId)
      .then((def) => {
        setDefinition(def);
        return Promise.all([
          api.listEntityInstances(def.slug, projectId),
          api.listAgents(projectId),
        ]);
      })
      .then(([instRes, agentsRes]) => {
        setInstances(instRes.instances || []);
        const agents = (agentsRes.agents || []).filter((a) =>
          (a.attached_entities || []).includes(defId)
        );
        setConnectedAgents(agents);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [defId, projectId]);

  const handleCreateInstance = async () => {
    try {
      await api.createEntityInstance(definition.slug, {
        project_id: projectId,
        data: instanceData,
        status: "draft",
      });
      setShowCreate(false);
      setInstanceData({});
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="shell-page empty">
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  if (error && !definition) {
    return (
      <div className="shell-page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const curl = `curl -X POST "http://localhost:8000/api/entities/${definition.slug}" \\
  -H "Content-Type: application/json" \\
  -d '{"project_id": "${projectId}", "data": {...}, "status": "draft"}'`;

  return (
    <div className="shell-page">
      <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate(`/projects/${projectId}/entities`)}>
        ← Entities
      </button>
      <h1 className="shell-page-title">{definition.name}</h1>
      <p className="shell-page-sub">{definition.description}</p>

      <div className="kb-detail-tabs mb-2">
        {["overview", "instances", "api"].map((t) => (
          <button
            key={t}
            type="button"
            className={`kb-detail-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {tab === "overview" && (
        <div className="card" style={{ padding: 20 }}>
          <dl className="kb-settings-list">
            <dt>Slug</dt><dd>{definition.slug}</dd>
            <dt>Source</dt><dd>{definition.source_type}</dd>
            <dt>Version</dt><dd>{definition.version}</dd>
            <dt>Instances</dt><dd>{definition.instance_count}</dd>
          </dl>
          <h4 className="kb-settings-title mt-2">Schema</h4>
          <pre className="kb-api-pre">{JSON.stringify(definition.schema, null, 2)}</pre>
          <h4 className="kb-settings-title mt-2">Connected agents</h4>
          {connectedAgents.length === 0 ? (
            <p className="text-sm text-muted">No agents linked yet.</p>
          ) : (
            <ul>{connectedAgents.map((a) => <li key={a.id}>{a.name}</li>)}</ul>
          )}
        </div>
      )}

      {tab === "instances" && (
        <>
          <div className="flex-between mb-2">
            <span className="text-sm text-muted">{instances.length} instance(s)</span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              + New instance
            </button>
          </div>
          {showCreate && (
            <div className="card mb-2" style={{ padding: 20 }}>
              <EntityInstanceForm
                schema={definition.schema}
                data={instanceData}
                onChange={setInstanceData}
              />
              <div className="modal-actions mt-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateInstance}>Create</button>
              </div>
            </div>
          )}
          <div className="card">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Status</th><th>Data</th><th>Created</th></tr>
                </thead>
                <tbody>
                  {instances.map((inst) => (
                    <tr
                      key={inst.id}
                      className="clickable-row"
                      onClick={() => navigate(`/projects/${projectId}/entities/instances/${inst.id}`)}
                    >
                      <td><span className="badge badge-grey">{inst.status}</span></td>
                      <td>{JSON.stringify(inst.data).slice(0, 100)}</td>
                      <td>{new Date(inst.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "api" && (
        <div className="card kb-api-block">
          <h4 className="kb-api-label">Create instance</h4>
          <pre className="kb-api-pre">{curl}</pre>
          <h4 className="kb-api-label mt-2">List instances</h4>
          <code className="kb-api-code">GET /api/entities/{definition.slug}?project_id={projectId}</code>
        </div>
      )}
    </div>
  );
}
