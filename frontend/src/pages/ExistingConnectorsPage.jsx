import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { IconCloudUpload } from "../components/layout/Icons";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExistingConnectorsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listConnectors(projectId)
      .then((data) => setConnectors(data.connectors || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="shell-page">
      <div className="flex-between mb-2">
        <div>
          <button
            type="button"
            className="btn btn-ghost btn-sm mb-1"
            onClick={() => navigate(`/projects/${projectId}/connectors`)}
          >
            ← Add Connector
          </button>
          <h1 className="shell-page-title">Existing Connectors</h1>
          <p className="shell-page-sub">
            Configured data source connectors for this project.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => navigate(`/projects/${projectId}/connectors`)}
        >
          <IconCloudUpload size={16} />
          Add Connector
        </button>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {loading ? (
        <div className="empty">
          <span className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      ) : connectors.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No connectors configured</div>
          <div className="empty-sub">
            Add a File connector or configure an integration.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>File</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {connectors.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <span className="badge badge-grey">{c.type}</span>
                    </td>
                    <td>{c.file_name || "—"}</td>
                    <td>{formatBytes(c.size_bytes)}</td>
                    <td>
                      <span className="badge badge-green">{c.status}</span>
                    </td>
                    <td>{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
