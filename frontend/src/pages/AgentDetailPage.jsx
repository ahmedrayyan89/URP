import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

const TABS = ["overview", "test", "api", "logs", "settings"];

export default function AgentDetailPage() {
  const { projectId, agentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [invocations, setInvocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.getAgent(agentId),
      api.listAgentInvocations(agentId),
    ])
      .then(([a, inv]) => {
        setAgent(a);
        setInvocations(inv.invocations || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [agentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTest = async () => {
    if (!testQuery.trim()) return;
    setTesting(true);
    try {
      const result = await api.invokeAgent(agentId, { query: testQuery });
      setTestResult(result);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleActivate = async () => {
    await api.updateAgent(agentId, { status: "active" });
    load();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this agent?")) return;
    await api.deleteAgent(agentId);
    navigate(`/projects/${projectId}/agents`);
  };

  if (loading) {
    return (
      <div className="shell-page empty">
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="shell-page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const curl = `curl -X POST "http://localhost:8000/api/agents/${agentId}/invoke" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Your question here"}'`;

  return (
    <div className="shell-page kb-detail-page">
      <div className="kb-detail-header">
        <button type="button" className="btn btn-ghost btn-sm kb-detail-back" onClick={() => navigate(`/projects/${projectId}/agents`)}>
          ← Agents
        </button>
        <h1 className="kb-detail-title">{agent.name}</h1>
        <p className="kb-detail-sub">
          <span className={`agent-status-badge agent-status-${agent.status}`}>{agent.status?.toUpperCase()}</span>
          {" · "}
          {agent.source === "built" ? "AI AGENT" : "IMPORTED"}
        </p>
      </div>

      <div className="kb-detail-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`kb-detail-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="kb-detail-content">
        {error && <div className="alert alert-error mb-2">{error}</div>}

        {activeTab === "overview" && (
          <div className="card" style={{ padding: 20 }}>
            <p>{agent.description || "No description."}</p>
            <dl className="kb-settings-list mt-2">
              <dt>Source</dt><dd>{agent.source}</dd>
              <dt>Framework</dt><dd>{agent.framework}</dd>
              {agent.source === "imported" && (
                <>
                  <dt>Endpoint</dt><dd>{agent.endpoint_url}</dd>
                </>
              )}
              {agent.source === "built" && (
                <>
                  <dt>Model</dt><dd>{agent.model}</dd>
                  <dt>KBs attached</dt><dd>{(agent.attached_knowledge_bases || []).join(", ") || "—"}</dd>
                  <dt>Entities</dt><dd>{(agent.attached_entities || []).join(", ") || "—"}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        {activeTab === "test" && (
          <div className="kb-tab-panel">
            <textarea className="input textarea" rows={3} value={testQuery} onChange={(e) => setTestQuery(e.target.value)} placeholder="Ask the agent..." />
            <button type="button" className="btn btn-primary btn-sm mt-1" onClick={handleTest} disabled={testing}>
              {testing ? "Running..." : "Invoke"}
            </button>
            {testResult && (
              <div className="card kb-answer-card mt-2">
                <p>{testResult.answer}</p>
                <span className="text-sm text-muted">{testResult.latency_ms}ms</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "api" && (
          <div className="card kb-api-block">
            <code className="kb-api-code">POST /api/agents/{agentId}/invoke</code>
            <pre className="kb-api-pre mt-2">{curl}</pre>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="card">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Time</th><th>Input</th><th>Output</th><th>Latency</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {invocations.length === 0 ? (
                    <tr><td colSpan={5} className="text-muted">No invocations yet</td></tr>
                  ) : (
                    invocations.map((inv) => (
                      <tr key={inv.id}>
                        <td>{new Date(inv.created_at).toLocaleString()}</td>
                        <td>{inv.input?.slice(0, 60)}</td>
                        <td>{inv.output?.slice(0, 60)}</td>
                        <td>{inv.latency_ms}ms</td>
                        <td><span className="badge badge-grey">{inv.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="card kb-danger-zone" style={{ padding: 20 }}>
            {agent.status !== "active" && (
              <button type="button" className="btn btn-primary btn-sm mb-2" onClick={handleActivate}>Activate agent</button>
            )}
            <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>Delete agent</button>
          </div>
        )}
      </div>
    </div>
  );
}
