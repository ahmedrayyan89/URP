import { useState } from "react";
import { api } from "../../lib/api";

const AUTH_TYPES = [
  { value: "none", label: "None" },
  { value: "api_key", label: "API Key" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
];

const PLATFORM_META = {
  gcp: {
    title: "Import from GCP",
    helper: "Connect a Vertex AI or Cloud Run agent by its HTTP invoke endpoint.",
    endpointPlaceholder: "https://your-service-abc.run.app/invoke",
    endpointLabel: "Agent endpoint URL",
    fields: [
      { key: "project_id", label: "GCP project ID", placeholder: "my-project" },
      { key: "region", label: "Region", placeholder: "us-central1" },
    ],
  },
  aws: {
    title: "Import from AWS",
    helper: "Connect a Bedrock Agent alias or Lambda function URL.",
    endpointPlaceholder: "https://bedrock-agent-runtime.us-east-1.amazonaws.com/...",
    endpointLabel: "Agent endpoint URL",
    fields: [
      { key: "agent_id", label: "Agent ID / alias", placeholder: "ABCDEF123" },
      { key: "region", label: "Region", placeholder: "us-east-1" },
    ],
  },
  azure: {
    title: "Import from Azure",
    helper: "Connect an Azure AI Foundry or AI Services agent endpoint.",
    endpointPlaceholder: "https://your-resource.services.ai.azure.com/...",
    endpointLabel: "Agent endpoint URL",
    fields: [
      { key: "resource_name", label: "Resource name", placeholder: "my-ai-resource" },
      { key: "deployment", label: "Deployment", placeholder: "agent-deployment" },
    ],
  },
  a2a: {
    title: "Import via A2A",
    helper: "Connect an external agent using the Agent-to-Agent (A2A) protocol invoke URL or agent card.",
    endpointPlaceholder: "https://agent.example.com/.well-known/agent.json",
    endpointLabel: "A2A agent card or invoke URL",
    fields: [
      { key: "agent_name", label: "Remote agent name", placeholder: "support-agent" },
    ],
  },
};

export default function ImportAgentModal({ projectId, platform = "gcp", onClose, onSuccess }) {
  const meta = PLATFORM_META[platform] || PLATFORM_META.gcp;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [platformConfig, setPlatformConfig] = useState({});
  const [authType, setAuthType] = useState("none");
  const [credentials, setCredentials] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);

  const setPlatformField = (key, value) => {
    setPlatformConfig((prev) => ({ ...prev, [key]: value }));
  };

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
        import_platform: platform,
        platform_config: platformConfig,
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
          <h3 className="modal-title">{meta.title}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="text-sm text-muted mb-2">{meta.helper}</p>

        <form onSubmit={handleSave}>
          <div className="form-row">
            <label className="form-label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea className="input textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {meta.fields.map((f) => (
            <div key={f.key} className="form-row">
              <label className="form-label">{f.label}</label>
              <input
                className="input"
                value={platformConfig[f.key] || ""}
                onChange={(e) => setPlatformField(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <div className="form-row">
            <label className="form-label">{meta.endpointLabel}</label>
            <input
              className="input"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder={meta.endpointPlaceholder}
              required
            />
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
