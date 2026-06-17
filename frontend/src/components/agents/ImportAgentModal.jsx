import { useState } from "react";
import { api } from "../../lib/api";

const AUTH_TYPES = [
  { value: "none", label: "None" },
  { value: "api_key", label: "API Key" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
];

export default function ImportAgentModal({ projectId, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [authType, setAuthType] = useState("none");
  const [credentials, setCredentials] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      const result = await api.testAgentConnectionPreview({
        endpoint_url: endpointUrl.trim(),
        auth_config: { type: authType, credentials },
      });
      setTestResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !endpointUrl.trim()) {
      setError("Name and endpoint URL are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const agent = await api.createImportedAgent({
        project_id: projectId,
        name: name.trim(),
        description: description.trim(),
        endpoint_url: endpointUrl.trim(),
        auth_config: { type: authType, credentials },
        status: "active",
      });
      onSuccess(agent);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal kb-wizard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Import Existing Agent</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="text-sm text-muted mb-2">Connect an external agent by endpoint URL.</p>

        <form onSubmit={handleSave}>
          <div className="form-row">
            <label className="form-label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea className="input textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-row">
            <label className="form-label">Endpoint URL</label>
            <input className="input" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} placeholder="https://..." required />
          </div>
          <div className="form-row">
            <label className="form-label">Auth method</label>
            <select className="input" value={authType} onChange={(e) => setAuthType(e.target.value)}>
              {AUTH_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {authType !== "none" && (
            <div className="form-row">
              <label className="form-label">Credentials</label>
              <input className="input" type="password" value={credentials} onChange={(e) => setCredentials(e.target.value)} />
            </div>
          )}

          {testResult && (
            <div className={`alert ${testResult.ok ? "alert-success" : "alert-error"} mb-2`}>
              {testResult.ok ? "Connection OK" : "Connection failed"} — {testResult.status_code} ({testResult.latency_ms}ms)
            </div>
          )}
          {error && <div className="alert alert-error mb-2">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-ghost" onClick={handleTest} disabled={testing || !endpointUrl.trim()}>
              {testing ? "Testing..." : "Test connection"}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
