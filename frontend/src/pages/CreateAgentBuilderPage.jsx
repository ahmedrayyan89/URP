import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

const TABS = [
  "Identity",
  "Model & prompt",
  "Knowledge bases",
  "Tools",
  "MCP servers",
  "Entities",
  "Test",
  "Deploy",
];

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

export default function CreateAgentBuilderPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconColor, setIconColor] = useState("#3b82f6");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful risk management assistant.");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [kbIds, setKbIds] = useState([]);
  const [toolIds, setToolIds] = useState([]);
  const [entityIds, setEntityIds] = useState([]);
  const [webSearchKey, setWebSearchKey] = useState("");
  const [mcpServers, setMcpServers] = useState([]);
  const [mcpForm, setMcpForm] = useState({ name: "", url: "", credentials: "" });
  const [kbs, setKbs] = useState([]);
  const [registeredTools, setRegisteredTools] = useState([]);
  const [entities, setEntities] = useState([]);
  const [draftAgentId, setDraftAgentId] = useState(null);
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listKnowledgeBases(projectId).then((d) => setKbs(d.knowledge_bases || [])).catch(() => {});
    api.listEntityDefinitions(projectId).then((d) => setEntities(d.definitions || [])).catch(() => {});
    api.listTools(projectId).then((d) => setRegisteredTools(d.tools || [])).catch(() => {});
  }, [projectId]);

  const toggleKb = (id) => setKbIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleTool = (id) => setToolIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleEntity = (id) => setEntityIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const buildPayload = (status) => ({
    project_id: projectId,
    name: name.trim(),
    description: description.trim(),
    system_prompt: systemPrompt,
    model,
    temperature,
    icon_color: iconColor,
    attached_knowledge_bases: kbIds,
    attached_tool_ids: toolIds,
    attached_entities: entityIds,
    attached_mcp_servers: mcpServers,
    tools: webSearchKey
      ? [{ id: "web_search", type: "web_search", config: { google_api_key: webSearchKey } }]
      : [],
    status,
  });

  const ensureDraft = async () => {
    if (draftAgentId) return draftAgentId;
    const agent = await api.createBuiltAgent({ ...buildPayload("draft") });
    setDraftAgentId(agent.id);
    return agent.id;
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const id = await ensureDraft();
      const result = await api.invokeAgent(id, { query: testQuery });
      setTestResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (activate) => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    try {
      let id = draftAgentId;
      if (id) {
        await api.updateAgent(id, buildPayload(activate ? "active" : "draft"));
      } else {
        const agent = await api.createBuiltAgent(buildPayload(activate ? "active" : "draft"));
        id = agent.id;
      }
      navigate(`/projects/${projectId}/agents/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addMcp = () => {
    if (!mcpForm.name || !mcpForm.url) return;
    setMcpServers([...mcpServers, { ...mcpForm, auth_type: "none" }]);
    setMcpForm({ name: "", url: "", credentials: "" });
  };

  return (
    <div className="shell-page">
      <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate(`/projects/${projectId}/agents`)}>
        ← Agents
      </button>
      <h1 className="shell-page-title">Create Agent</h1>

      <div className="kb-wizard-steps mb-2">
        {TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`kb-wizard-step ${i === step ? "active" : ""}`}
            onClick={() => setStep(i)}
          >
            <span className="kb-wizard-step-num">{i + 1}</span>
            <span className="kb-wizard-step-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="card agent-builder-body">
        {step === 0 && (
          <>
            <div className="form-row"><label className="form-label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="form-row"><label className="form-label">Description</label><textarea className="input textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="form-row"><label className="form-label">Icon color</label><input type="color" value={iconColor} onChange={(e) => setIconColor(e.target.value)} /></div>
          </>
        )}
        {step === 1 && (
          <>
            <div className="form-row"><label className="form-label">Model</label>
              <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
                {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-row"><label className="form-label">System prompt</label>
              <textarea className="input textarea agent-prompt-input" rows={8} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
            </div>
            <div className="form-row"><label className="form-label">Temperature: {temperature}</label>
              <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="kb-slider" />
            </div>
          </>
        )}
        {step === 2 && (
          <div className="connector-checklist">
            {kbs.map((kb) => (
              <label key={kb.id} className="connector-check-item">
                <input type="checkbox" checked={kbIds.includes(kb.id)} onChange={() => toggleKb(kb.id)} />
                <span>{kb.name}</span>
                <code className="text-xs">POST /api/knowledge-bases/{kb.id}/query</code>
              </label>
            ))}
          </div>
        )}
        {step === 3 && (
          <>
            <p className="text-sm text-muted mb-2">Attach registered tools from the Tools catalog.</p>
            <div className="connector-checklist mb-2">
              {registeredTools.length === 0 ? (
                <p className="text-sm text-muted">No tools registered yet. Add one in the Tools section.</p>
              ) : (
                registeredTools.map((tool) => (
                  <label key={tool.id} className="connector-check-item">
                    <input type="checkbox" checked={toolIds.includes(tool.id)} onChange={() => toggleTool(tool.id)} />
                    <span>{tool.name}</span>
                    {tool.config?.endpoint && (
                      <code className="text-xs">POST {tool.config.endpoint}</code>
                    )}
                  </label>
                ))
              )}
            </div>
            <div className="form-row"><label className="form-label">Web Search — Google API key</label>
              <input className="input" type="password" value={webSearchKey} onChange={(e) => setWebSearchKey(e.target.value)} placeholder="Optional" />
            </div>
          </>
        )}
        {step === 4 && (
          <>
            {mcpServers.map((m, i) => <div key={i} className="badge badge-grey mb-1">{m.name} — {m.url}</div>)}
            <div className="kb-create-advanced mt-2">
              <input className="input" placeholder="Name" value={mcpForm.name} onChange={(e) => setMcpForm({ ...mcpForm, name: e.target.value })} />
              <input className="input" placeholder="URL" value={mcpForm.url} onChange={(e) => setMcpForm({ ...mcpForm, url: e.target.value })} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={addMcp}>+ Add MCP server</button>
            </div>
          </>
        )}
        {step === 5 && (
          <div className="connector-checklist">
            {entities.map((ent) => (
              <label key={ent.id} className="connector-check-item">
                <input type="checkbox" checked={entityIds.includes(ent.id)} onChange={() => toggleEntity(ent.id)} />
                <span>{ent.name}</span>
              </label>
            ))}
          </div>
        )}
        {step === 6 && (
          <>
            <textarea className="input textarea" rows={3} placeholder="Test message..." value={testQuery} onChange={(e) => setTestQuery(e.target.value)} />
            <button type="button" className="btn btn-primary btn-sm mt-1" onClick={handleTest} disabled={loading || !testQuery.trim()}>
              {loading ? "Running..." : "Send test (uses /invoke)"}
            </button>
            {testResult && (
              <div className="card kb-answer-card mt-2">
                <p>{testResult.answer}</p>
                <span className="text-sm text-muted">{testResult.latency_ms}ms</span>
              </div>
            )}
          </>
        )}
        {step === 7 && (
          <dl className="kb-review-list">
            <dt>Name</dt><dd>{name || "—"}</dd>
            <dt>Model</dt><dd>{model}</dd>
            <dt>KBs</dt><dd>{kbIds.length}</dd>
            <dt>Tools</dt><dd>{toolIds.length}</dd>
            <dt>Entities</dt><dd>{entityIds.length}</dd>
            <dt>MCP</dt><dd>{mcpServers.length}</dd>
          </dl>
        )}

        {error && <div className="alert alert-error mt-2">{error}</div>}

        <div className="modal-actions mt-2">
          <button type="button" className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
          {step < 7 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => handleDeploy(false)} disabled={loading}>Save draft</button>
              <button type="button" className="btn btn-primary" onClick={() => handleDeploy(true)} disabled={loading}>Activate</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
